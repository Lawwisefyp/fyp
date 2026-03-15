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
        console.error('Gemini API error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

module.exports = router;
