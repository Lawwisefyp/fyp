import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Message from '@/lib/models/Message';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();
    const messages = await Message.find({
      $or: [
        { senderId: auth.user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: auth.user._id }
      ]
    }).sort({ createdAt: 1 });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, receiverModel, content } = await req.json();

    await dbConnect();
    const message = new Message({
      senderId: auth.user._id,
      senderModel: auth.role === 'lawyer' ? 'Lawyer' : 'Client',
      receiverId,
      receiverModel,
      content
    });

    await message.save();
    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
