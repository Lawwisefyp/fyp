import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';
import Client from '@/lib/models/Client';
import Student from '@/lib/models/Student';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || !type) {
      return NextResponse.json({ error: 'Token and type are required' }, { status: 400 });
    }

    await dbConnect();

    let Model;
    if (type === 'client') Model = Client;
    else if (type === 'student') Model = Student;
    else Model = Lawyer;

    const user = await Model.findOne({ emailVerificationToken: token });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: 'Email verified successfully! You can now log in.' });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Server error during verification' }, { status: 500 });
  }
}
