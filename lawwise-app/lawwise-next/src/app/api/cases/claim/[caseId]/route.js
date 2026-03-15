import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/lib/models/Case';
import Notification from '@/lib/models/Notification';
import { verifyAuth } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const { caseId } = await params;
    const auth = await verifyAuth(req);
    if (!auth || auth.role.toLowerCase() !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized or not a lawyer' }, { status: 401 });
    }


    await dbConnect();

    // Use findOne with the 'id' field (CASE-...) or '_id'
    // The original app uses 'id' field for these Case IDs
    const caseData = await Case.findOne({ id: caseId, lawyerId: null });

    if (!caseData) {
      return NextResponse.json({
        success: false,
        message: 'Case not found or already assigned'
      }, { status: 404 });
    }

    console.log('Claiming case:', caseId, 'for lawyer:', auth.user._id);
    caseData.lawyerId = auth.user._id;
    caseData.status = 'assigned';
    caseData.lastUpdateDate = new Date().toISOString().split('T')[0];

    await caseData.save();
    console.log('Case claimed successfully saved');

    // Notify lawyer
    const claimNotif = new Notification({
      toLawyerId: auth.user._id,
      title: '💼 Case Claimed',
      message: `You have successfully claimed the case "${caseData.title}".`,
      type: 'reminder',
      status: 'unread'
    });
    await claimNotif.save();

    return NextResponse.json({
      success: true,
      message: 'Case claimed successfully',
      case: caseData
    });
  } catch (error) {
    console.error('Case claim error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
