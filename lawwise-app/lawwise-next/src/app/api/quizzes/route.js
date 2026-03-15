import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Quiz from '@/lib/models/Quiz';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const quizzes = await Quiz.find({ owner: auth.user._id });
    return NextResponse.json({ success: true, quizzes });
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizData = await req.json();
    await dbConnect();
    const quiz = new Quiz({
      ...quizData,
      owner: auth.user._id
    });

    await quiz.save();
    return NextResponse.json({ success: true, quiz }, { status: 201 });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
