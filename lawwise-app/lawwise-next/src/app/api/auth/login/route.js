import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';
import { sendLoginNotification } from '@/lib/services/emailService';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();
    const lawyer = await Lawyer.findOne({ email: email.toLowerCase() });

    if (!lawyer) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!lawyer.isActive) {
      return NextResponse.json({ error: 'Account is deactivated.' }, { status: 401 });
    }

    if (!lawyer.isEmailVerified) {
      return NextResponse.json({
        error: 'Email not verified',
        message: 'Please verify your email address before logging in.',
        email: lawyer.email
      }, { status: 403 });
    }

    const isMatch = await lawyer.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = lawyer.generateAuthToken();

    sendLoginNotification(lawyer.email, lawyer.fullName).catch(console.error);

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${lawyer.fullName}!`,
      token,
      lawyer: {
        id: lawyer._id,
        name: lawyer.fullName,
        email: lawyer.email,
        specialization: lawyer.specialization,
        barNumber: lawyer.barNumber
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}
