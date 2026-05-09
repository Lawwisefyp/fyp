const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: `You are a helpful lawyer chatbot. Answer law-related questions clearly and concisely. User question: ${message}` }]
                }]
            }
        );

        if (!response.data.candidates || !response.data.candidates[0].content.parts[0].text) {
            throw new Error('Invalid response from Gemini API');
        }

        const answer = response.data.candidates[0].content.parts[0].text;
        res.json({ success: true, answer });
    } catch (error) {
        console.error('Gemini API error, attempting local fallback:', error.message);
        
        try {
            // OLLAMA FALLBACK for simple chatbot
            const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
            const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma2:2b";

            console.log(`Calling local Ollama model: ${OLLAMA_MODEL}...`);
            
            const ollamaResponse = await axios.post(OLLAMA_URL, {
                model: OLLAMA_MODEL,
                prompt: `[LAW CHAT - OFFLINE] Answer in English ONLY: ${message}`,
                stream: false,
            }, { timeout: 90000 });

            if (ollamaResponse.data && ollamaResponse.data.response) {
                return res.json({ 
                    success: true, 
                    answer: `⚠️ *Offline Mode* \n\n ${ollamaResponse.data.response}` 
                });
            }
            throw new Error("Ollama failed");
        } catch (ollamaError) {
            console.error('Ollama fallback error:', ollamaError.message);
            res.status(500).json({ 
                error: 'Both Gemini and Local AI are unavailable.',
                details: error.message 
            });
        }
    }
});

module.exports = router;
