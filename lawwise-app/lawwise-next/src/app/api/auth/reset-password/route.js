import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';
import Client from '@/lib/models/Client';
import Student from '@/lib/models/Student';

export async function POST(req) {
  try {
    const { email, otp, newPassword, userType } = await req.json();
    
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
      return NextResponse.json({ error: 'Invalid or expired verification session' }, { status: 400 });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
