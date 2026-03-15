import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import SharedNote from '@/lib/models/SharedNote';
import Quiz from '@/lib/models/Quiz';
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
        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

        // Check ownership or public status
        if (note.uploader.toString() !== auth.user._id.toString() && !note.isPublic) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const aiResult = await aiService.generateQuizFromNote(note);
        if (!aiResult.success) return NextResponse.json(aiResult, { status: 500 });

        // Save the generated quiz to the database
        const quiz = new Quiz({
            title: aiResult.quiz.title,
            subject: note.subject || 'Legal Studies',
            questions: aiResult.quiz.questions,
            noteId: note._id,
            owner: auth.user._id,
            difficulty: 'Intermediate'
        });

        await quiz.save();
        return NextResponse.json({ success: true, quizId: quiz._id }, { status: 201 });
    } catch (error) {
        console.error('Quiz generation route error:', error);
        return NextResponse.json({ error: 'Server error generating quiz' }, { status: 500 });
    }
}
