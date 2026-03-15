import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/lib/models/Notification';
import Lawyer from '@/lib/models/Lawyer';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetLawyerId, message } = await req.json();
    const senderId = auth.user._id;
    const senderRole = auth.role;

    if (!targetLawyerId) {
      return NextResponse.json({ success: false, error: 'Target lawyer ID is required' }, { status: 400 });
    }

    // Prevent self-connection
    if (senderRole === 'lawyer' && senderId.toString() === targetLawyerId.toString()) {
      return NextResponse.json({ success: false, error: 'You cannot connect with yourself' }, { status: 400 });
    }

    await dbConnect();

    // Check for existing pending request
    const query = {
      toLawyerId: targetLawyerId,
      status: 'pending',
      type: 'connection_request'
    };

    if (senderRole === 'lawyer') {
      query.fromLawyerId = senderId;
    } else {
      query.fromClientId = senderId;
    }

    const existingRequest = await Notification.findOne(query);
    if (existingRequest) {
      return NextResponse.json({ success: false, error: 'Connection request already pending' }, { status: 400 });
    }

    // Get sender name
    let senderName = auth.user.fullName || 'User';
    if (!senderName && auth.user.personalInfo) {
      senderName = `${auth.user.personalInfo.firstName} ${auth.user.personalInfo.lastName}`;
    }

    // Create notification
    const notificationData = {
      toLawyerId: targetLawyerId,
      message: message || `New connection request from ${senderName}`,
      type: 'connection_request',
      status: 'pending'
    };

    if (senderRole === 'lawyer') {
      notificationData.fromLawyerId = senderId;
      notificationData.fromLawyerName = senderName;
    } else {
      notificationData.fromClientId = senderId;
      notificationData.fromClientName = senderName;
    }

    const notification = new Notification(notificationData);
    await notification.save();

    return NextResponse.json({ success: true, message: 'Connection request sent', notification });
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json({ success: false, error: 'Server error sending connection request' }, { status: 500 });
  }
}
