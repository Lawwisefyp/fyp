import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import SharedNote from '@/lib/models/SharedNote';
import aiService from '@/lib/services/aiService';

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        await dbConnect();
        const note = await SharedNote.findById(id);

        if (!note) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        // Check uploader or if public
        if (note.uploader.toString() !== auth.user._id.toString() && !note.isPublic) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Return cached explanation if it exists
        if (note.aiExplanation) {
            return NextResponse.json({ success: true, explanation: note.aiExplanation });
        }

        const aiResult = await aiService.explainNote(note);
        if (aiResult.success) {
            note.aiExplanation = aiResult.explanation;
            await note.save();
        }

        return NextResponse.json(aiResult);
    } catch (error) {
        console.error('AI Explain route error:', error);
        return NextResponse.json({ error: 'Server error generating AI explanation' }, { status: 500 });
    }
}
