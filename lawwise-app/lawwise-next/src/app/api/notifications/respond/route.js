import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/lib/models/Notification';
import Lawyer from '@/lib/models/Lawyer';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, response } = await req.json();
    if (!notificationId || !['accepted', 'rejected'].includes(response)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    await dbConnect();

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    // Verify it's for this lawyer
    if (notification.toLawyerId.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    notification.status = response;
    await notification.save();

    // If accepted, establish connection
    if (response === 'accepted' && notification.type === 'connection_request') {
      if (notification.fromLawyerId && notification.toLawyerId) {
        await Promise.all([
          Lawyer.findByIdAndUpdate(notification.fromLawyerId, {
            $addToSet: { connections: notification.toLawyerId }
          }),
          Lawyer.findByIdAndUpdate(notification.toLawyerId, {
            $addToSet: { connections: notification.fromLawyerId }
          })
        ]);
        console.log(`🔗 Established connection between ${notification.fromLawyerId} and ${notification.toLawyerId}`);
      }
    }

    // Notify the sender about the response
    const toLawyerName = auth.user.fullName || 'A Lawyer';
    const responseMessage = `Your connection request was ${response} by ${toLawyerName}.`;

    try {
      const responseNotification = new Notification({
        fromLawyerId: notification.toLawyerId,
        toLawyerId: notification.fromLawyerId || null,
        toClientId: notification.fromClientId || null,
        fromLawyerName: toLawyerName,
        message: responseMessage,
        type: 'connection_response',
        status: response
      });
      await responseNotification.save();
    } catch (saveError) {
      console.error('Failed to save response notification:', saveError);
      // We don't return error here because the primary action (accepting) succeeded
    }

    return NextResponse.json({ success: true, message: `Request ${response}` });
  } catch (error) {
    console.error('Respond to connection error:', error);
    return NextResponse.json({ success: false, error: 'Server error: ' + error.message }, { status: 500 });
  }
}
