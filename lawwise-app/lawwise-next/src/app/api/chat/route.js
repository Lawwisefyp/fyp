import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful lawyer chatbot. Answer law-related questions clearly and concisely.' },
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const answer = response.data.choices[0].message.content;
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to get response from ChatGPT' }, { status: 500 });
  }
}
