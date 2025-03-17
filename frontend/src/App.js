import React, { useState } from "react";
import { 
    Container, TextField, Button, CircularProgress, Typography, 
    Card, CardContent, Box, AppBar, Toolbar, Grid, Divider,
    Paper, InputAdornment, Fade, Chip, LinearProgress, Fab, Stepper, Step, StepLabel, IconButton
} from "@mui/material";
import { 
    YouTube as YouTubeIcon, 
    Translate as TranslateIcon, 
    Search as SearchIcon,
    Kitchen as KitchenIcon,
    MenuBook as MenuBookIcon,
    Help as HelpIcon,
    PlayArrow as PlayArrowIcon,
    Home as HomeIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles';
import Confetti from 'react-confetti';

// Create a modern, sleek theme inspired by Myntra
const theme = createTheme({
    palette: {
        primary: {
            main: '#58CC02',
            light: '#7DDC35',
            dark: '#46A302',
        },
        secondary: {
            main: '#1CB0F6',
            light: '#58C8FF',
            dark: '#1899D6',
        },
        error: {
            main: '#FF4B4B',
        },
        background: {
            default: '#FAFAFA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#4B4B4B',
            secondary: '#777777',
        },
    },
    typography: {
        fontFamily: '"DIN Round Pro", "Inter", "Roboto", sans-serif',
        h1: {
            fontWeight: 800,
            fontSize: '2.5rem',
            letterSpacing: '-0.02em',
        },
        h2: {
            fontWeight: 800,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 700,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 700,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 700,
            fontSize: '1.25rem',
        },
        button: {
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '1rem',
            letterSpacing: '0.02em',
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    padding: '12px 24px',
                    boxShadow: 'none',
                    border: '2px solid',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    },
                    '&:active': {
                        transform: 'translateY(1px)',
                    },
                },
                containedPrimary: {
                    borderColor: '#46A302',
                    '&:hover': {
                        backgroundColor: '#46A302',
                        borderColor: '#46A302',
                    },
                },
                outlined: {
                    backgroundColor: '#FFF',
                    '&:hover': {
                        backgroundColor: '#F7F7F7',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#F7F7F7',
                        '& fieldset': {
                            borderWidth: '2px',
                            borderColor: '#E5E5E5',
                        },
                        '&:hover fieldset': {
                            borderColor: '#58CC02',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#58CC02',
                        },
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    fontWeight: 600,
                },
            },
        },
    },
});

// Sample questions
const sampleQuestions = [
    "What are all the ingredients needed?",
    "What kitchen tools are required?",
    "How long does this recipe take?",
    "What are the main cooking steps?",
    "Is this recipe vegetarian/vegan?",
    "What are the nutritional facts?",
    "Any ingredient substitutes?",
    "What's the difficulty level?"
];

function App() {
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [transcript, setTranscript] = useState("");
    const [translation, setTranslation] = useState("");
    const [language, setLanguage] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [processingStatus, setProcessingStatus] = useState("");
    const [activeStep, setActiveStep] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setProcessingStatus("Uploading video...");
        setTranscript("");
        setTranslation("");
        setLanguage("");
        setAnswer("");
        setActiveStep(1);
        
        try {
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtubeUrl })
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Failed to upload video');
            
            setProcessingStatus("Transcribing recipe audio...");
            const transcriptId = data.transcript_id;
            let transcriptData;
            
            do {
                await new Promise(resolve => setTimeout(resolve, 3000));
                const transcriptResponse = await fetch(`http://localhost:5000/transcript/${transcriptId}`);
                transcriptData = await transcriptResponse.json();
                setProcessingStatus(`Transcription: ${transcriptData.status}`);
            } while (transcriptData.status === 'processing' || transcriptData.status === 'queued');

            if (transcriptData.status === 'completed') {
                setTranscript(transcriptData.transcript);
                setTranslation(transcriptData.translation);
                setLanguage(transcriptData.language || "hi");
                setActiveStep(2);
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 3000);
            } else {
                throw new Error('Transcription failed: ' + transcriptData.status);
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
            setActiveStep(0);
        } finally {
            setLoading(false);
            setProcessingStatus("");
        }
    };

    const handleAsk = async () => {
        try {
            setAnswer(""); // Clear previous answer
            setLoading(true);
            const response = await fetch('http://localhost:5000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    transcript: language === "en" ? transcript : translation, 
                    question 
                })
            });
            const data = await response.json();
            setAnswer(data.answer);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setError("Failed to get answer: " + error.message);
            setLoading(false);
        }
    };

    const handleSampleQuestion = (q) => {
        setQuestion(q);
    };

    // Extract YouTube video ID for thumbnail
    const getYoutubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeVideoId(youtubeUrl);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    // Add URL validation
    const isValidYoutubeUrl = (url) => {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
        return pattern.test(url);
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ 
                flexGrow: 1, 
                bgcolor: 'background.default', 
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <AppBar 
                    position="sticky" 
                    elevation={0} 
                    sx={{ 
                        bgcolor: 'white',
                        borderBottom: '2px solid',
                        borderColor: '#E5E5E5',
                    }}
                >
                    <Toolbar sx={{ py: 1 }}>
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                fontWeight: 800,
                                color: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <KitchenIcon sx={{ fontSize: 32 }} />
                            ChefJunior
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Stepper 
                    activeStep={activeStep} 
                    sx={{ 
                        mt: 2, 
                        mb: 4,
                        '& .MuiStepLabel-label': {
                            fontWeight: 600
                        }
                    }}
                >
                    <Step>
                        <StepLabel>Paste Video Link</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Get Transcript</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Ask Questions</StepLabel>
                    </Step>
                </Stepper>

                <Container 
                    maxWidth="lg" 
                    sx={{ 
                        mt: { xs: 2, sm: 4 }, 
                        mb: { xs: 2, sm: 4 },
                        px: { xs: 2, sm: 3, md: 4 }
                    }}
                >
                    {activeStep === 0 && (
                        <Fade in={activeStep === 0} timeout={800}>
                            <Box>
                                <Grid container spacing={4}>
                                    {/* Hero Section */}
                                    <Grid item xs={12}>
                                        <Box 
                                            sx={{ 
                                                textAlign: 'center', 
                                                py: { xs: 4, md: 6 },
                                                px: 2
                                            }}
                                        >
                                            <Typography 
                                                variant="h1" 
                                                gutterBottom
                                                sx={{ 
                                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                                    mb: 2
                                                }}
                                            >
                                                Understand Any Recipe Video
                                            </Typography>
                                            <Typography 
                                                variant="h5" 
                                                color="text.secondary"
                                                sx={{ 
                                                    maxWidth: 600, 
                                                    mx: 'auto',
                                                    mb: 4,
                                                    fontWeight: 400
                                                }}
                                            >
                                                Paste a YouTube recipe link, get a transcript, and ask questions about ingredients, steps, or anything else.
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {/* URL Input Card */}
                                    <Grid item xs={12}>
                                        <Card sx={{ 
                                            p: 3,
                                            border: '2px solid',
                                            borderColor: 'primary.main',
                                            boxShadow: '0 4px 0 0 rgba(88,204,2,0.2)',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 6px 0 0 rgba(88,204,2,0.2)',
                                            }
                                        }}>
                                            <TextField
                                                fullWidth
                                                placeholder="Paste your recipe video link here..."
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                error={youtubeUrl && !isValidYoutubeUrl(youtubeUrl)}
                                                helperText={youtubeUrl && !isValidYoutubeUrl(youtubeUrl) ? 
                                                    "Please enter a valid YouTube video URL" : ""}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <YouTubeIcon color={isValidYoutubeUrl(youtubeUrl) ? "primary" : "disabled"} />
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: youtubeUrl && (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={() => setYoutubeUrl("")}>
                                                                <ClearIcon />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                                aria-label="YouTube video URL input"
                                            />
                                            <Button 
                                                variant="contained"
                                                fullWidth
                                                onClick={handleSubmit}
                                                disabled={!youtubeUrl.trim()}
                                                sx={{ 
                                                    mt: 2,
                                                    py: 1.5,
                                                    fontSize: '1.1rem',
                                                    fontWeight: 800
                                                }}
                                                aria-label="Process recipe video"
                                            >
                                                Get Recipe Details
                                            </Button>
                                        </Card>
                                    </Grid>
                                    
                                    {/* Features Section */}
                                    <Grid item xs={12}>
                                        <Box sx={{ py: 6 }}>
                                            <Typography 
                                                variant="h3" 
                                                align="center" 
                                                gutterBottom
                                                sx={{ mb: 4 }}
                                            >
                                                How It Works
                                            </Typography>
                                            
                                            <Grid container spacing={3} justifyContent="center">
                                                <Grid item xs={12} sm={4}>
                                                    <Box 
                                                        sx={{ 
                                                            textAlign: 'center',
                                                            p: 3,
                                                            height: '100%',
                                                        }}
                                                    >
                                                        <Box 
                                                            sx={{ 
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                width: 60,
                                                                height: 60,
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                mx: 'auto',
                                                                mb: 2
                                                            }}
                                                        >
                                                            <YouTubeIcon sx={{ color: 'primary.main', fontSize: 30 }} />
                                                        </Box>
                                                        <Typography variant="h5" gutterBottom>
                                                            Paste a Link
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Enter any YouTube recipe video URL to get started
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                
                                                <Grid item xs={12} sm={4}>
                                                    <Box 
                                                        sx={{ 
                                                            textAlign: 'center',
                                                            p: 3,
                                                            height: '100%',
                                                        }}
                                                    >
                                                        <Box 
                                                            sx={{ 
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                width: 60,
                                                                height: 60,
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                mx: 'auto',
                                                                mb: 2
                                                            }}
                                                        >
                                                            <MenuBookIcon sx={{ color: 'primary.main', fontSize: 30 }} />
                                                        </Box>
                                                        <Typography variant="h5" gutterBottom>
                                                            Get Transcript
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            We'll transcribe the video and translate if needed
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                
                                                <Grid item xs={12} sm={4}>
                                                    <Box 
                                                        sx={{ 
                                                            textAlign: 'center',
                                                            p: 3,
                                                            height: '100%',
                                                        }}
                                                    >
                                                        <Box 
                                                            sx={{ 
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                width: 60,
                                                                height: 60,
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                mx: 'auto',
                                                                mb: 2
                                                            }}
                                                        >
                                                            <HelpIcon sx={{ color: 'primary.main', fontSize: 30 }} />
                                                        </Box>
                                                        <Typography variant="h5" gutterBottom>
                                                            Ask Questions
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Get answers about ingredients, steps, and more
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Fade>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <Fade in={loading} timeout={500}>
                            <Box 
                                sx={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 3,
                                    py: 4
                                }}
                            >
                                <CircularProgress 
                                    variant="determinate" 
                                    value={70} 
                                    size={80}
                                    thickness={4}
                                    sx={{
                                        color: 'primary.main',
                                        '& .MuiCircularProgress-circle': {
                                            strokeLinecap: 'round',
                                        },
                                    }}
                                />
                                <Typography variant="h5" color="primary.main" fontWeight={700}>
                                    {processingStatus}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" align="center">
                                    We're preparing your recipe details. This usually takes about a minute.
                                </Typography>
                                <LinearProgress 
                                    sx={{
                                        width: '100%',
                                        maxWidth: 400,
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: 'rgba(88,204,2,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                        }
                                    }}
                                />
                            </Box>
                        </Fade>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Fade in={!!error} timeout={500}>
                            <Card 
                                sx={{ 
                                    maxWidth: 600, 
                                    mx: 'auto', 
                                    mt: 4, 
                                    bgcolor: '#FEF2F2',
                                    borderColor: '#F87171'
                                }}
                            >
                                <CardContent>
                                    <Typography color="error" variant="h6" gutterBottom>
                                        Something went wrong
                                    </Typography>
                                    <Typography color="error.dark">
                                        {error}
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        sx={{ mt: 2 }}
                                        onClick={() => setError("")}
                                    >
                                        Dismiss
                                    </Button>
                                </CardContent>
                            </Card>
                        </Fade>
                    )}

                    {/* Results Section */}
                    {activeStep === 2 && !loading && (
                        <Fade in={activeStep === 2 && !loading} timeout={800}>
                            <Box>
                                {/* Language Badge */}
                                {language && (
                                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                                        <Chip 
                                            icon={<TranslateIcon />} 
                                            label={`${language === "hi" ? "Hindi" : language} ${language !== "en" ? "• Translated to English" : ""}`}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                )}

                                <Grid container spacing={3}>
                                    {/* Transcripts */}
                                    <Grid item xs={12} md={6}>
                                        <Card 
                                            sx={{ 
                                                height: '100%',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    boxShadow: '0 4px 12px rgba(40, 44, 63, 0.12)',
                                                }
                                            }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <MenuBookIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="h5">
                                                        Original Recipe Transcript
                                                    </Typography>
                                                </Box>
                                                <Divider sx={{ mb: 3 }} />
                                                <Box 
                                                    sx={{ 
                                                        maxHeight: 400, 
                                                        overflow: 'auto',
                                                        pr: 1,
                                                        '&::-webkit-scrollbar': {
                                                            width: '6px',
                                                        },
                                                        '&::-webkit-scrollbar-track': {
                                                            backgroundColor: '#F1F5F9',
                                                        },
                                                        '&::-webkit-scrollbar-thumb': {
                                                            backgroundColor: '#CBD5E1',
                                                            borderRadius: '10px',
                                                        }
                                                    }}
                                                >
                                                    <Typography 
                                                        variant="body1" 
                                                        sx={{ 
                                                            whiteSpace: "pre-wrap",
                                                            lineHeight: 1.8
                                                        }}
                                                    >
                                                        {transcript}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {transcript && language !== "en" && (
                                        <Grid item xs={12} md={6}>
                                            <Card 
                                                sx={{ 
                                                    height: '100%',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        boxShadow: '0 4px 12px rgba(40, 44, 63, 0.12)',
                                                    }
                                                }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <TranslateIcon color="primary" sx={{ mr: 1 }} />
                                                        <Typography variant="h5">
                                                            English Translation
                                                        </Typography>
                                                    </Box>
                                                    <Divider sx={{ mb: 3 }} />
                                                    <Box 
                                                        sx={{ 
                                                            maxHeight: 400, 
                                                            overflow: 'auto',
                                                            pr: 1,
                                                            '&::-webkit-scrollbar': {
                                                                width: '6px',
                                                            },
                                                            '&::-webkit-scrollbar-track': {
                                                                backgroundColor: '#F1F5F9',
                                                            },
                                                            '&::-webkit-scrollbar-thumb': {
                                                                backgroundColor: '#CBD5E1',
                                                                borderRadius: '10px',
                                                            }
                                                        }}
                                                    >
                                                        <Typography 
                                                            variant="body1" 
                                                            sx={{ 
                                                                whiteSpace: "pre-wrap",
                                                                lineHeight: 1.8
                                                            }}
                                                        >
                                                            {translation}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    )}

                                    {/* Ask Questions */}
                                    <Grid item xs={12}>
                                        <Card sx={{ mt: 2 }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <HelpIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="h5">
                                                        Ask About This Recipe
                                                    </Typography>
                                                </Box>
                                                <Divider sx={{ mb: 3 }} />
                                                
                                                <TextField
                                                    fullWidth
                                                    variant="outlined"
                                                    placeholder="Type your question about the recipe..."
                                                    value={question}
                                                    onChange={(e) => setQuestion(e.target.value)}
                                                    sx={{ mb: 2 }}
                                                />
                                                
                                                <Button 
                                                    variant="contained" 
                                                    color="primary" 
                                                    onClick={handleAsk}
                                                    disabled={!question.trim() || loading}
                                                    sx={{ mb: 3 }}
                                                >
                                                    Get Answer
                                                </Button>

                                                {/* Sample Questions */}
                                                <Box sx={{ mt: 2 }}>
                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                        Try asking:
                                                    </Typography>
                                                    <Grid container spacing={1}>
                                                        {sampleQuestions.map((q, i) => (
                                                            <Grid item xs={12} sm={6} md={3} key={i}>
                                                                <Button 
                                                                    variant="outlined"
                                                                    onClick={() => handleSampleQuestion(q)}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                                            handleSampleQuestion(q);
                                                                        }
                                                                    }}
                                                                    sx={{
                                                                        width: '100%',
                                                                        justifyContent: 'flex-start',
                                                                        borderWidth: 2,
                                                                        borderColor: '#E5E5E5',
                                                                        color: 'text.secondary',
                                                                        transition: 'all 0.2s ease',
                                                                        transform: 'scale(1)',
                                                                        '&:hover': {
                                                                            borderColor: 'primary.main',
                                                                            color: 'primary.main',
                                                                            backgroundColor: 'rgba(88,204,2,0.05)',
                                                                            transform: 'scale(1.02)',
                                                                        }
                                                                    }}
                                                                >
                                                                    {q}
                                                                </Button>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>

                                                {/* Answer */}
                                                {answer && (
                                                    <Fade in={!!answer} timeout={500}>
                                                        <Box sx={{ 
                                                            mt: 3,
                                                            p: 3,
                                                            bgcolor: 'rgba(88,204,2,0.05)',
                                                            borderRadius: 3,
                                                            border: '2px solid',
                                                            borderColor: 'primary.main'
                                                        }}>
                                                            <Typography 
                                                                variant="body1" 
                                                                sx={{ 
                                                                    fontSize: '1.1rem',
                                                                    lineHeight: 1.8
                                                                }}
                                                            >
                                                                {answer}
                                                            </Typography>
                                                        </Box>
                                                    </Fade>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Fade>
                    )}
                </Container>

                {/* Footer */}
                <Box 
                    component="footer" 
                    sx={{ 
                        py: 3, 
                        px: 2, 
                        mt: 'auto',
                        backgroundColor: 'white',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Container maxWidth="lg">
                        <Typography variant="body2" color="text.secondary" align="center">
                            ChefJunior — Your AI Recipe Assistant © {new Date().getFullYear()}
                        </Typography>
                    </Container>
                </Box>

                {showCelebration && <Confetti gravity={0.3} numberOfPieces={100} />}

                {activeStep !== 0 && (
                    <Fab
                        color="primary"
                        sx={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                            boxShadow: '0 4px 0 0 rgba(88,204,2,0.2)',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                            }
                        }}
                        onClick={() => setActiveStep(0)}
                    >
                        <HomeIcon />
                    </Fab>
                )}
            </Box>
        </ThemeProvider>
    );
}

export default App;
