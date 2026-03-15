require('dotenv').config();
const axios = require('axios');

async function testGeminiFlash() {
    const apiKey = process.env.GEMINI_API_KEY;
    const query = 'scope of political science academic resources scribd pdf';

    console.log('Testing Flash Search (No tools) for:', query);

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: `Act as a Google Search Engine. Provide 8 real, active, high-quality links for "${query}". Return ONLY a JSON array with: title, fileUrl, description, source, category, year. Ensure fileUrl is a valid full URL.` }] }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('Status:', response.status);
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Result:', text);
    } catch (error) {
        console.error('Flash Error:', error.response?.data || error.message);
    }
}

testGeminiFlash();
