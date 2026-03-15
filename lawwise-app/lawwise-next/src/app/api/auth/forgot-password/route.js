import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';
import Client from '@/lib/models/Client';
import Student from '@/lib/models/Student';
import { sendOTPEmail } from '@/lib/services/emailService';

export async function POST(req) {
  try {
    const { email, userType } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    await dbConnect();

    let Model;
    if (userType === 'client') Model = Client;
    else if (userType === 'student') Model = Student;
    else Model = Lawyer;

    const user = await Model.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTPEmail(user.email, otp);
    return NextResponse.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
