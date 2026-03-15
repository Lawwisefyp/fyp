import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    const lawyer = await Lawyer.findById(id).select('-password');
    if (!lawyer) {
      return NextResponse.json({ success: false, error: 'Lawyer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lawyer });
  } catch (error) {
    console.error('Fetch lawyer error:', error);
    return NextResponse.json({ success: false, error: 'Server error fetching lawyer' }, { status: 500 });
  }
}
