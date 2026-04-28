import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import QuizResult from '@/lib/models/QuizResult';
import { getUserIdFromToken } from '@/lib/auth';

export async function POST(req) {
    try {
        await dbConnect();
        const userId = await getUserIdFromToken(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { quizId, score, totalQuestions, subject } = await req.json();

        if (!quizId || score === undefined || !totalQuestions || !subject) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = new QuizResult({
            student: userId,
            quiz: quizId,
            score,
            totalQuestions,
            subject
        });

        await result.save();

        return NextResponse.json({
            success: true,
            message: 'Result saved successfully',
            resultId: result._id
        }, { status: 201 });

    } catch (error) {
        console.error('Quiz result save error:', error);
        return NextResponse.json({ error: 'Failed to save quiz result' }, { status: 500 });
    }
}
