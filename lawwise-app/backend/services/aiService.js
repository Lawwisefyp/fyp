const axios = require('axios');

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = (apiKey) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

const callGemini = async (apiKey, prompt) => {
    const response = await axios.post(
        GEMINI_URL(apiKey),
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        console.error('Gemini empty response:', JSON.stringify(response.data));
        throw new Error('Empty response from Gemini');
    }
    return text;
};

const aiService = {
    explainNote: async (noteData) => {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return { success: false, error: 'AI Service (Gemini) not configured.' };

            const prompt = `Act as an expert Law Professor. 
            User has a study note titled: "${noteData.title}".
            Description: "${noteData.description}".
            Subject: "${noteData.subject}".

            Explain this legal topic in simple but professional terms for an LLB student. 
            Break it down into:
            1. Core Concept (Summary)
            2. Key Legal Principles involved.
            3. Why this is important for Law Students.

            Keep the response structured and easy to read. Use bullet points. 
            Avoid very long paragraphs. Limit to ~300 words.`;

            const contentText = await callGemini(apiKey, prompt);
            return { success: true, explanation: contentText };
        } catch (error) {
            console.error('AI Explain Error:', error.response?.data || error.message);
            return { success: false, error: 'Failed to generate AI explanation. Please try again later.' };
        }
    },

    generateQuizFromNote: async (noteData) => {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return { success: false, error: 'AI Service not configured.' };

            const prompt = `Act as a Law Professor. Create an academic quiz based on the following study note:
            
            Title: "${noteData.title}"
            Description: "${noteData.description || 'General legal topic'}"
            Subject: "${noteData.subject || 'Law'}"

            Requirements:
            - Create exactly 3 Multiple Choice Questions. Each has 4 options and 1 correct answer.
            - Create exactly 2 Short Answer questions (2-3 sentences expected).
            - Create exactly 1 Long Answer question (detailed essay-style).
            
            Return ONLY a valid JSON object, no markdown, no extra text:
            {
                "title": "Quiz title here",
                "questions": [
                    {"type": "mcq", "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..."},
                    {"type": "mcq", "question": "...", "options": ["A","B","C","D"], "correctAnswer": "B", "explanation": "..."},
                    {"type": "mcq", "question": "...", "options": ["A","B","C","D"], "correctAnswer": "C", "explanation": "..."},
                    {"type": "short", "question": "...", "explanation": "sample answer..."},
                    {"type": "short", "question": "...", "explanation": "sample answer..."},
                    {"type": "long", "question": "...", "explanation": "key points to cover..."}
                ]
            }`;

            console.log('Generating quiz for:', noteData.title);
            const rawText = await callGemini(apiKey, prompt);

            // Strip markdown code blocks if present
            const cleanText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const quizData = JSON.parse(cleanText);

            return { success: true, quiz: quizData };
        } catch (error) {
            console.error('AI Quiz Error - Full:', error.response?.data || error.message);
            return { success: false, error: 'Failed to generate quiz. Check server logs.' };
        }
    }
};

module.exports = aiService;
