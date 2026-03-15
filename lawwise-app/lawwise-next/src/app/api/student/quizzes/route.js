import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Quiz from '@/lib/models/Quiz';

export async function GET(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const quizzes = await Quiz.find({ owner: auth.user._id }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, quizzes });
    } catch (error) {
        console.error('Fetch quizzes error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
