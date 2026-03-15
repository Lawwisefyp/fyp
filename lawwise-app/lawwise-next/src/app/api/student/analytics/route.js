import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import SharedNote from '@/lib/models/SharedNote';
import Quiz from '@/lib/models/Quiz';

export async function GET(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const studentId = auth.user._id;

        // Get total uploaded notes
        const notesCount = await SharedNote.countDocuments({ uploader: studentId });

        // Get total taken quizzes
        const quizzesCount = await Quiz.countDocuments({ owner: studentId });

        // Get recent notes/quizzes for the graph (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentNotes = await SharedNote.find({ uploader: studentId, createdAt: { $gte: sevenDaysAgo } });
        const recentQuizzes = await Quiz.find({ owner: studentId, createdAt: { $gte: sevenDaysAgo } });

        // Generate date map
        const activityMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            activityMap[d.toISOString().split('T')[0]] = 0;
        }

        recentNotes.forEach(note => {
            const dateStr = note.createdAt.toISOString().split('T')[0];
            if (activityMap[dateStr] !== undefined) activityMap[dateStr] += 1;
        });

        recentQuizzes.forEach(quiz => {
            const dateStr = quiz.createdAt.toISOString().split('T')[0];
            if (activityMap[dateStr] !== undefined) activityMap[dateStr] += 1;
        });

        const activityGraph = Object.keys(activityMap).map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            count: activityMap[date]
        }));

        return NextResponse.json({
            success: true,
            analytics: {
                notesCount,
                quizzesCount,
                activityGraph
            }
        });
    } catch (error) {
        console.error('Analytics route error:', error);
        return NextResponse.json({ error: 'Server error fetching analytics' }, { status: 500 });
    }
}
