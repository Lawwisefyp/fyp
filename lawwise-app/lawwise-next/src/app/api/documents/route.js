import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Document from '@/lib/models/Document';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const documents = await Document.find({ lawyerId: auth.user._id }).sort({ uploadedAt: -1 });

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('Fetch documents error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
