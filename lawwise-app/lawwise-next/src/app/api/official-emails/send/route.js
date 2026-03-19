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
      return NextResponse.json({
        success: false,
        error: 'Recipient, subject, and content are required.'
      }, { status: 400 });
    }

    const result = await sendOfficialEmail(to, subject, content, 'Lawwise Admin');

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Official email sent successfully.'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Official email route error:', error);
    return NextResponse.json({ success: false, error: 'Server error while sending email.' }, { status: 500 });
  }
}
