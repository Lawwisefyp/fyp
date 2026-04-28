import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/lib/models/Case';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    let query = {};
    if (auth.role.toLowerCase() === 'lawyer') {
      query = { lawyerId: auth.user._id };
    } else {
      query = { clientEmail: auth.user.email };
    }

    console.log('Fetching cases for:', auth.user.email, 'Role:', auth.role, 'ID:', auth.user._id);
    const cases = await Case.find(query).sort({ createdDate: -1 });
    console.log('Found cases count:', cases.length);
    return NextResponse.json({ success: true, cases });
  } catch (error) {
    console.error('Fetch cases error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caseData = await req.json();

    await dbConnect();
    
    // Generate simple ID if not provided
    if (!caseData.id) {
      caseData.id = 'CASE-' + Date.now();
    }
    
    const newCase = new Case({
      ...caseData,
      lawyerId: auth.user._id
    });

    await newCase.save();

    // Create notification if hearing date is set
    if (newCase.nextHearingDate) {
      try {
        const Notification = (await import('@/lib/models/Notification')).default;
        const reminder = new Notification({
          toLawyerId: auth.user._id,
          title: '⚖️ New Hearing Scheduled',
          message: `A new hearing for "${newCase.title}" has been set for ${new Date(newCase.nextHearingDate).toLocaleDateString()}.`,
          type: 'hearing_reminder',
          status: 'unread'
        });
        await reminder.save();
      } catch (notifError) {
        console.error('Failed to create initial hearing notification:', notifError);
        // Don't fail the whole request if notification fails
      }
    }

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (error) {
    console.error('Create case error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
