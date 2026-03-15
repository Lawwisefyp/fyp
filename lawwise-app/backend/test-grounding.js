require('dotenv').config();
const axios = require('axios');

async function testGeminiGrounded() {
    const apiKey = process.env.GEMINI_API_KEY;
    const query = 'scope of political science academic resources scribd pdf';

    console.log('Testing Grounded Search for:', query);

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: `Search for high-quality academic and legal resources for: "${query}". Provide a list of real URLs with titles and descriptions. Return ONLY a JSON array of objects with title, fileUrl, description, source, category, year.` }] }],
                tools: [{ google_search_retrieval: {} }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('Response Status:', response.status);
        const candidates = response.data?.candidates;
        if (candidates && candidates.length > 0) {
            console.log('Content:', candidates[0].content?.parts?.[0]?.text);
            if (candidates[0].groundingMetadata) {
                console.log('Grounding Metadata Found (Live search worked!)');
            }
        } else {
            console.log('No candidates found. Full response:', JSON.stringify(response.data, null, 2));
        }
    } catch (error) {
        console.error('Grounded Search Error:', error.response?.data || error.message);
        console.log('Retrying with gemini-2.0-flash...');
        try {
            const response2 = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    contents: [{ parts: [{ text: `Search for high-quality academic and legal resources for: "${query}". Provide a list of real URLs with titles and descriptions. Return ONLY a JSON array of objects with title, fileUrl, description, source, category, year.` }] }],
                    tools: [{ google_search_retrieval: {} }]
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            console.log('Gemini 2.0 Response Status:', response2.status);
            console.log('Content:', response2.data?.candidates?.[0]?.content?.parts?.[0]?.text);
        } catch (error2) {
            console.error('Gemini 2.0 Error:', error2.response?.data || error2.message);
        }
    }
}

testGeminiGrounded();
