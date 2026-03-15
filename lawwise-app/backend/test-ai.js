require('dotenv').config();
const axios = require('axios');

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key:', apiKey ? 'Found' : 'Missing');
    if (!apiKey) return;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: 'Say hello from Lawwise System Test' }] }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testGemini();
