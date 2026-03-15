import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/lib/models/Case';
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
      query = { lawyerId: auth.user._id };
    } else {
      query = { clientEmail: auth.user.email };
    }

    console.log('Fetching cases for:', auth.user.email, 'Role:', auth.role, 'ID:', auth.user._id);
    const cases = await Case.find(query).sort({ createdDate: -1 });
    console.log('Found cases count:', cases.length);
    return NextResponse.json({ success: true, cases });
  } catch (error) {
    console.error('Fetch cases error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caseData = await req.json();

    await dbConnect();
    
    // Generate simple ID if not provided
    if (!caseData.id) {
      caseData.id = 'CASE-' + Date.now();
    }
    
    const newCase = new Case({
      ...caseData,
      lawyerId: auth.user._id
    });

    await newCase.save();
    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (error) {
    console.error('Create case error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
