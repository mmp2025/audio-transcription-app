const ffmpeg = require("fluent-ffmpeg");
const { Translate } = require('@google-cloud/translate').v2;
const crypto = require('crypto');

// Update this path to match your ffmpeg installation
ffmpeg.setFfmpegPath("C:\\ffmpeg-7.1-essentials_build\\ffmpeg-7.1-essentials_build\\bin\\ffmpeg.exe");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const ytDlp = require("yt-dlp-exec");
const OpenAI = require("openai");

const app = express();
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Google Translate
const translate = new Translate();

app.post("/upload", async (req, res) => {
    try {
        const { youtubeUrl } = req.body;
        if (!youtubeUrl) return res.status(400).json({ error: "No YouTube URL provided" });

        // Generate unique filenames for this upload
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const audioFilePath = path.join(__dirname, `audio_${uniqueId}.mp3`);
        const trimmedAudioFilePath = path.join(__dirname, `trimmed_audio_${uniqueId}.mp3`);

        // Clean up any existing audio files before starting
        const directory = __dirname;
        fs.readdirSync(directory).forEach(file => {
            if (file.startsWith('audio_') && file.endsWith('.mp3')) {
                try {
                    fs.unlinkSync(path.join(directory, file));
                } catch (err) {
                    console.error(`Failed to delete file ${file}:`, err);
                }
            }
        });

        // Step 1: Download YouTube audio
        console.log("Downloading audio from:", youtubeUrl);
        try {
            await ytDlp(youtubeUrl, {
                output: audioFilePath,
                extractAudio: true,
                audioFormat: "mp3",
                ffmpegLocation: "C:\\ffmpeg-7.1-essentials_build\\ffmpeg-7.1-essentials_build\\bin\\ffmpeg.exe"
            });
        } catch (dlError) {
            console.error("YouTube download error:", dlError);
            return res.status(400).json({ error: "Failed to download YouTube video. Please check the URL." });
        }

        // Verify the file exists
        if (!fs.existsSync(audioFilePath)) {
            return res.status(500).json({ error: "Audio file was not created" });
        }

        // Step 2: Upload audio to AssemblyAI
        console.log("Uploading audio to AssemblyAI...");
        let uploadResponse;
        try {
            const audioData = fs.createReadStream(audioFilePath);
            uploadResponse = await axios.post("https://api.assemblyai.com/v2/upload", audioData, {
                headers: { 
                    Authorization: process.env.ASSEMBLYAI_API_KEY,
                    'Content-Type': 'audio/mpeg'
                }
            });
        } catch (uploadError) {
            console.error("AssemblyAI upload error:", uploadError.response?.data || uploadError);
            return res.status(500).json({ error: "Failed to upload audio to transcription service" });
        }

        // Step 3: Request transcription
        try {
            const transcriptRes = await axios.post("https://api.assemblyai.com/v2/transcript", {
                audio_url: uploadResponse.data.upload_url,
                language_code: "hi"  // Just Hindi transcription
            }, {
                headers: { 
                    Authorization: process.env.ASSEMBLYAI_API_KEY,
                    "Content-Type": "application/json"
                }
            });

            res.json({ transcript_id: transcriptRes.data.id });
        } catch (transcriptError) {
            console.error("Transcription request error:", transcriptError.response?.data || transcriptError);
            return res.status(500).json({ error: "Failed to initiate transcription" });
        }

        // Cleanup: Delete audio files after processing
        setTimeout(() => {
            try {
                if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
                if (fs.existsSync(trimmedAudioFilePath)) fs.unlinkSync(trimmedAudioFilePath);
            } catch (cleanupError) {
                console.error("Cleanup error:", cleanupError);
            }
        }, 5000);

    } catch (error) {
        console.error("General error:", error);
        res.status(500).json({ error: error.message || "An unexpected error occurred" });
    }
});

app.get("/transcript/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: { Authorization: process.env.ASSEMBLYAI_API_KEY }
        });

        let translation = '';
        if (response.data.text && response.data.status === 'completed') {
            try {
                // Translate the text to English
                const [translationResult] = await translate.translate(response.data.text, {
                    from: 'hi',  // Source language (Hindi)
                    to: 'en'     // Target language (English)
                });
                translation = translationResult;
            } catch (translateError) {
                console.error("Translation error:", translateError);
                translation = "Translation failed";
            }
        }

        res.json({ 
            status: response.data.status,
            transcript: response.data.text,
            translation: translation
        });

    } catch (error) {
        console.error("Transcript retrieval error:", error.response?.data || error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/ask", async (req, res) => {
    try {
        const { transcript, question } = req.body;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: "You are a helpful assistant." },
                       { role: "user", content: `Transcript: ${transcript}\n\nQuestion: ${question}` }],
        });

        res.json({ answer: completion.choices[0].message.content });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
