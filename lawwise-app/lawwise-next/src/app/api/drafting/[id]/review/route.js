import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Draft from '@/lib/models/Draft';
import { verifyAuth } from '@/lib/auth';
import axios from 'axios';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    await dbConnect();
    const draft = await Draft.findOne({ _id: id, lawyerId: auth.user._id });
    if (!draft) return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });

    const reviewPrompt = `
        ROLE: Senior Legal Auditor.
        TASK: Review the following legal document draft for any internal inconsistencies, missing required placeholders, or logical errors.
        
        DOCUMENT CONTENT:
        ${draft.content}
        
        USER FACTS:
        ${draft.details}
        
        OUTPUT:
        Provide a concise list of potential issues or a confirmation that the document is consistent.
    `;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o",
          messages: [{ role: "user", content: reviewPrompt }]
        },
        {
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          timeout: 30000
        }
      );

      const reviewNotes = response.data?.choices?.[0]?.message?.content || "No issues found.";
      draft.metadata = { ...draft.metadata, reviewNotes, lastReviewed: new Date() };
      await draft.save();

      return NextResponse.json({ success: true, reviewNotes });
    } catch (err) {
      console.error('AI Review Error:', err.message);
      return NextResponse.json({ success: false, error: 'Review failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Draft review error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
