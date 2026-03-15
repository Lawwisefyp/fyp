require('dotenv').config();
const axios = require('axios');

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    console.log('Testing Gemini API Key:', key ? 'Found (Length: ' + key.length + ')' : 'Not Found');

    if (!key) return;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
            { contents: [{ parts: [{ text: "Hello, this is a test. Reply with 'Success'." }] }] },
            { timeout: 10000 }
        );
        console.log('Gemini Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Gemini Error:', err.response?.data || err.message);
    }
}

testGemini();
