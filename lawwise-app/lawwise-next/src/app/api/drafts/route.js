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
    const drafts = await Draft.find({ lawyerId: auth.user._id }).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    console.error('Fetch drafts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const draftData = await req.json();

    await dbConnect();
    const draft = new Draft({
      ...draftData,
      lawyerId: auth.user._id
    });

    await draft.save();
    return NextResponse.json({ success: true, draft }, { status: 201 });
  } catch (error) {
    console.error('Create draft error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
