import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import Client from '@/lib/models/Client';
import { sendLoginNotification } from '@/lib/services/emailService';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();
    const client = await Client.findOne({ email: email.toLowerCase() });

    if (!client) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await client.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!client.isEmailVerified) {
      return NextResponse.json({
        error: 'Email not verified',
        message: 'Please verify your email address before logging in.',
        email: client.email
      }, { status: 403 });
    }

    const token = jwt.sign({ id: client._id, role: 'client' }, process.env.JWT_SECRET || 'dev_jwt_secret_change_me', {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });

    sendLoginNotification(client.email, client.fullName).catch(console.error);

    return NextResponse.json({
      success: true,
      message: `Welcome, ${client.fullName}!`,
      token,
      client: {
        id: client._id,
        fullName: client.fullName,
        email: client.email
      }
    });

  } catch (error) {
    console.error('Client login error:', error);
    return NextResponse.json({ error: 'Server error during client login' }, { status: 500 });
  }
}
