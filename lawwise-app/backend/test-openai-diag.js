require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
    const key = process.env.OPENAI_API_KEY;
    console.log('Testing OpenAI API Key:', key ? 'Found (Length: ' + key.length + ')' : 'Not Found');

    if (!key) return;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [{ role: "user", content: "Hello, this is a test. Reply with 'Success'." }]
            },
            {
                headers: { 'Authorization': `Bearer ${key}` },
                timeout: 10000
            }
        );
        console.log('OpenAI Response:', JSON.stringify(response.data.choices[0].message.content, null, 2));
    } catch (err) {
        console.error('OpenAI Error:', err.response?.data || err.message);
    }
}

testOpenAI();
