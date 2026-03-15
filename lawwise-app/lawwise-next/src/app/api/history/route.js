import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import History from '@/lib/models/History';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const history = await History.find({ lawyerId: auth.user._id }).sort({ watchedAt: -1 });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Fetch history error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videoData = await req.json();
    await dbConnect();

    const historyEntry = await History.findOneAndUpdate(
      { lawyerId: auth.user._id, videoId: videoData.videoId },
      { ...videoData, watchedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, history: historyEntry });
  } catch (error) {
    console.error('Save history error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
