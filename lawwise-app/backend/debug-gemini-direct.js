require('dotenv').config();
const axios = require('axios');

async function testGeminiDirect() {
    const apiKey = process.env.GEMINI_API_KEY;
    const query = 'scope of political science';
    const prompt = `Provide a list of 5-7 high-quality, real, and accessible web links for: "${query}". Return ONLY a JSON array of objects with title, fileUrl, description, source, category, year.`;

    console.log('Using API Key:', apiKey.substring(0, 5) + '...');

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Direct Gemini Error:', error.response?.data || error.message);
    }
}

testGeminiDirect();
