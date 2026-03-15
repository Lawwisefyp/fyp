import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';
import Client from '@/lib/models/Client';
import Student from '@/lib/models/Student';

export async function POST(req) {
  try {
    const { email, otp, userType } = await req.json();
    
    await dbConnect();

    let Model;
    if (userType === 'client') Model = Client;
    else if (userType === 'student') Model = Student;
    else Model = Lawyer;

    const user = await Model.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
