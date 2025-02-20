import React, { useState } from "react";
import axios from "axios";
import { Container, TextField, Button, CircularProgress, Typography, Card, CardContent } from "@mui/material";

function App() {
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [transcript, setTranscript] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!youtubeUrl.trim()) {
            alert("Please enter a YouTube URL.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("http://localhost:5000/upload", { youtubeUrl });
            const transcriptId = response.data.transcript_id;

            setTimeout(async () => {
                const transcriptRes = await axios.get(`http://localhost:5000/transcript/${transcriptId}`);
                setTranscript(transcriptRes.data.transcript);
                setLoading(false);
            }, 10000);
        } catch (error) {
            alert("Error processing YouTube link. Please try again.");
            setLoading(false);
        }
    };

    const handleAsk = async () => {
        if (!transcript) {
            alert("No transcript available.");
            return;
        }

        setLoading(true);
        const response = await axios.post("http://localhost:5000/ask", { transcript, question });
        setAnswer(response.data.answer);
        setLoading(false);
    };

    return (
        <Container maxWidth="md" style={{ textAlign: "center", padding: "20px" }}>
            <Typography variant="h4" gutterBottom>
                🎥 YouTube to Transcript App
            </Typography>

            <Card variant="outlined" style={{ padding: "20px", marginBottom: "20px" }}>
                <CardContent>
                    <Typography variant="h6">Enter YouTube URL</Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Paste YouTube link here..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        style={{ marginBottom: "10px" }}
                    />
                    <Button variant="contained" color="primary" onClick={handleUpload}>
                        Get Transcript
                    </Button>
                </CardContent>
            </Card>

            {loading && <CircularProgress />}

            {transcript && (
                <Card variant="outlined" style={{ padding: "20px", marginBottom: "20px" }}>
                    <CardContent>
                        <Typography variant="h6">Transcript</Typography>
                        <Typography variant="body1" style={{ whiteSpace: "pre-wrap" }}>{transcript}</Typography>
                    </CardContent>
                </Card>
            )}

            {transcript && (
                <Card variant="outlined" style={{ padding: "20px" }}>
                    <CardContent>
                        <Typography variant="h6">Ask a Question</Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Type your question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            style={{ marginBottom: "10px" }}
                        />
                        <Button variant="contained" color="secondary" onClick={handleAsk}>
                            Ask
                        </Button>
                        {answer && <Typography variant="body1" style={{ marginTop: "10px" }}><strong>Answer:</strong> {answer}</Typography>}
                    </CardContent>
                </Card>
            )}
        </Container>
    );
}

export default App;
