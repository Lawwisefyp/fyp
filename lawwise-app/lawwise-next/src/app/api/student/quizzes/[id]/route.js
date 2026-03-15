import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Quiz from '@/lib/models/Quiz';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        await dbConnect();
        const quiz = await Quiz.findById(id);
        if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        
        // In the original backend, it allowed anyone to view? 
        // No, let's restrict to owner for now to be safe, or check if it was intended to be public.
        // The original backend: if (quiz.owner.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Access denied' });
        
        if (quiz.owner.toString() !== auth.user._id.toString()) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ success: true, quiz });
    } catch (error) {
        console.error('Fetch quiz error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
