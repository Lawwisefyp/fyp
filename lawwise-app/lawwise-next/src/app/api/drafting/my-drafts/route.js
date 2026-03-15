import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Draft from '@/lib/models/Draft';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const drafts = await Draft.find({ lawyerId: auth.user._id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    console.error('Drafts fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch drafts' }, { status: 500 });
  }
}
