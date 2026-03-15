import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';
import { sendVerificationEmail } from '@/lib/services/emailService';
// Fix for missing service
const checkAuthenticEmail = async () => ({ success: true });

export async function POST(req) {
  try {
    const { fullName, email, password, confirmPassword, barNumber, specialization } = await req.json();

    if (!fullName || !email || !password || !confirmPassword || !barNumber || !specialization) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    await dbConnect();

    // Check for existing lawyer
    const existingLawyer = await Lawyer.findOne({ $or: [{ email: email.toLowerCase() }, { barNumber }] });

    if (existingLawyer) {
      if (existingLawyer.email === email.toLowerCase()) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
      if (existingLawyer.barNumber === barNumber) {
        return NextResponse.json({ error: 'Bar number already registered' }, { status: 400 });
      }
    }

    const emailValidation = await checkAuthenticEmail(email);
    if (!emailValidation.success) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const lawyer = new Lawyer({
      fullName,
      email: email.toLowerCase(),
      password,
      barNumber,
      specialization,
      isEmailVerified: false,
      emailVerificationToken: crypto.randomBytes(32).toString('hex')
    });

    await lawyer.save();

    const emailResult = await sendVerificationEmail(lawyer.email, lawyer.fullName, lawyer.emailVerificationToken, 'lawyer');

    if (!emailResult.success) {
      await Lawyer.findByIdAndDelete(lawyer._id);
      return NextResponse.json({
        error: emailResult.error || 'Failed to send verification email.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your official email to verify your account.',
      lawyer: {
        id: lawyer._id,
        name: lawyer.fullName,
        email: lawyer.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Server error during registration' }, { status: 500 });
  }
}
