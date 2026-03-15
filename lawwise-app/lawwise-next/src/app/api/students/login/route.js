import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import Student from '@/lib/models/Student';
import { sendLoginNotification } from '@/lib/services/emailService';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();
    const student = await Student.findOne({ email: email.toLowerCase() });

    if (!student) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!student.isEmailVerified) {
      return NextResponse.json({
        error: 'Email not verified',
        message: 'Please verify your email address before logging in.',
        email: student.email
      }, { status: 403 });
    }

    const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET || 'dev_jwt_secret_change_me', {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });

    sendLoginNotification(student.email, student.fullName).catch(console.error);

    return NextResponse.json({
      success: true,
      message: `Welcome, ${student.fullName}!`,
      token,
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email
      }
    });

  } catch (error) {
    console.error('Student login error:', error);
    return NextResponse.json({ error: 'Server error during student login' }, { status: 500 });
  }
}
