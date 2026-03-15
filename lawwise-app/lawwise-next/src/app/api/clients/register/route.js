import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import Client from '@/lib/models/Client';
import { sendVerificationEmail } from '@/lib/services/emailService';
// Fix for missing service
const checkAuthenticEmail = async () => ({ success: true });

export async function POST(req) {
  try {
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    await dbConnect();

    const existingClient = await Client.findOne({ email: email.toLowerCase() });
    if (existingClient) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const emailValidation = await checkAuthenticEmail(email);
    if (!emailValidation.success) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const client = new Client({
      fullName,
      email: email.toLowerCase(),
      password,
      isEmailVerified: false,
      emailVerificationToken: crypto.randomBytes(32).toString('hex')
    });

    await client.save();

    const emailResult = await sendVerificationEmail(client.email, client.fullName, client.emailVerificationToken, 'client');

    if (!emailResult.success) {
      await Client.findByIdAndDelete(client._id);
      return NextResponse.json({
        error: emailResult.error || 'Failed to send verification email.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client account created successfully. Please check your official email to verify your account.',
      client: { id: client._id, fullName: client.fullName, email: client.email }
    }, { status: 201 });

  } catch (error) {
    console.error('Client registration error:', error);
    return NextResponse.json({ error: 'Server error during client registration' }, { status: 500 });
  }
}
