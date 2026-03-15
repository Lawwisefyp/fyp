import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { sendOfficialEmail } from '@/lib/services/emailService';

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, content } = await req.json();

    if (!to || !subject || !content) {
      return NextResponse.json({ error: 'Recipient, subject, and content are required' }, { status: 400 });
    }

    const result = await sendOfficialEmail(to, subject, content, auth.user.fullName);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Send email API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
