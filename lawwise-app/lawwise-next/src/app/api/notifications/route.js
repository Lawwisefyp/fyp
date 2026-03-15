import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/lib/models/Notification';
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
      query = { toLawyerId: auth.user._id };
    } else {
      // Logic for client notifications if applicable
      query = { fromLawyerId: auth.user._id }; // Example placeholder
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toLawyerId, title, message, type } = await req.json();

    await dbConnect();
    const notification = new Notification({
      fromLawyerId: auth.role === 'lawyer' ? auth.user._id : null,
      fromClientId: auth.role === 'client' ? auth.user._id : null,
      toLawyerId,
      title,
      message,
      type
    });

    await notification.save();
    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
