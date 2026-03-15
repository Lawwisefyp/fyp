require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Say hello' }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('OpenAI Response:', response.data.choices[0].message.content);
    } catch (error) {
        console.error('OpenAI Error:', error.response?.data || error.message);
    }
}

testOpenAI();
