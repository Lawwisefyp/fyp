import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Template from '@/lib/models/Template';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const templates = await Template.find({ isActive: true });
    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}
