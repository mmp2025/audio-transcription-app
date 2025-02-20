const ffmpeg = require("fluent-ffmpeg");

// Manually set the FFmpeg path
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
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/upload", async (req, res) => {
    try {
        const { youtubeUrl } = req.body;
        if (!youtubeUrl) return res.status(400).json({ error: "No YouTube URL provided" });

        const audioFilePath = path.join(__dirname, "audio.mp3");
        const trimmedAudioFilePath = path.join(__dirname, "trimmed_audio.mp3");

        // Step 1: Download YouTube audio
        console.log("Downloading audio...");
        await ytDlp(youtubeUrl, {
            output: audioFilePath,
            extractAudio: true,
            audioFormat: "mp3",
            ffmpegLocation: "C:\\ffmpeg-7.1-essentials_build\\ffmpeg-7.1-essentials_build\\bin\\ffmpeg.exe"
        });

     
        // Step 2: Upload  audio to AssemblyAI
        console.log("Uploading audio to AssemblyAI...");
        const audioData = fs.createReadStream(audioFilePath);
        const response = await axios.post("https://api.assemblyai.com/v2/upload", audioData, {
            headers: { Authorization: process.env.ASSEMBLYAI_API_KEY }
        });

        // Step 4: Request transcription
        const transcriptRes = await axios.post("https://api.assemblyai.com/v2/transcript", {
            audio_url: response.data.upload_url
        }, {
            headers: { Authorization: process.env.ASSEMBLYAI_API_KEY }
        });

        res.json({ transcript_id: transcriptRes.data.id });

        // Cleanup: Delete audio files after processing
        setTimeout(() => {
            fs.unlink(audioFilePath, () => {});
            fs.unlink(trimmedAudioFilePath, () => {});
        }, 5000);

    } catch (error) {
        console.error("Error processing YouTube link:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/transcript/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: { Authorization: process.env.ASSEMBLYAI_API_KEY }
        });

        res.json({ transcript: response.data.text });

    } catch (error) {
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
