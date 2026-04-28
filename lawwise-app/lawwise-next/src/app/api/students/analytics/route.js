import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Student from '@/lib/models/Student';
import SharedNote from '@/lib/models/SharedNote';
import QuizResult from '@/lib/models/QuizResult';
import { getUserIdFromToken } from '@/lib/auth';

export async function GET(req) {
    try {
        await dbConnect();
        const userId = await getUserIdFromToken(req);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get total notes count
        const notesCount = await SharedNote.countDocuments({ uploader: userId });

        // 2. Get quiz results
        const quizResults = await QuizResult.find({ student: userId });
        const totalQuizzes = quizResults.length;

        // 3. Calculate subject-wise performance
        const performance = {};
        quizResults.forEach(res => {
            if (!performance[res.subject]) {
                performance[res.subject] = { totalScore: 0, totalQuestions: 0, count: 0 };
            }
            performance[res.subject].totalScore += res.score;
            performance[res.subject].totalQuestions += res.totalQuestions;
            performance[res.subject].count += 1;
        });

        const subjectAnalytics = Object.keys(performance).map(subject => ({
            subject,
            averagePercentage: Math.round((performance[subject].totalScore / performance[subject].totalQuestions) * 100),
            count: performance[subject].count
        }));

        // Identify strengths and weaknesses
        const strengths = subjectAnalytics
            .filter(s => s.averagePercentage >= 75)
            .map(s => s.subject);
        
        const weaknesses = subjectAnalytics
            .filter(s => s.averagePercentage < 60)
            .map(s => s.subject);

        // 4. Get recommended notes (notes in weak subjects not uploaded by student)
        let recommendations = [];
        if (weaknesses.length > 0) {
            recommendations = await SharedNote.find({
                subject: { $in: weaknesses },
                uploader: { $ne: userId },
                isPublic: true
            })
            .limit(4)
            .select('title subject difficulty icon');
        }

        // Fallback recommendations if no weaknesses yet
        if (recommendations.length === 0) {
            recommendations = await SharedNote.find({
                uploader: { $ne: userId },
                isPublic: true
            })
            .limit(4)
            .select('title subject difficulty icon');
        }

        return NextResponse.json({
            success: true,
            analytics: {
                notesCount,
                totalQuizzes,
                readinessScore: totalQuizzes > 0 ? Math.round(subjectAnalytics.reduce((acc, curr) => acc + curr.averagePercentage, 0) / subjectAnalytics.length) : 0,
                strengths,
                weaknesses,
                subjectAnalytics
            },
            recommendations: recommendations.map(r => ({
                id: r._id,
                title: r.title,
                type: 'Shared Note',
                difficulty: 'Intermediate',
                match: '95%',
                icon: '📚',
                subject: r.subject
            }))
        });

    } catch (error) {
        console.error('Analytics fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
