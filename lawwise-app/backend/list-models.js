require('dotenv').config();
const axios = require('axios');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log('Available Models:', response.data.models.map(m => m.name));
    } catch (error) {
        console.error('List Models Error:', error.response?.data || error.message);
    }
}

listModels();
