import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/lib/models/Case';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const { caseId } = await params;
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stageId } = await req.json();

    await dbConnect();

    // Find case and verify lawyer ownership
    const caseData = await Case.findOne({ id: caseId, lawyerId: auth.user._id });

    if (!caseData) {
      return NextResponse.json({ success: false, message: 'Case not found' }, { status: 404 });
    }

    const completionDate = new Date().toISOString().split('T')[0];

    // Check if stage already completed to avoid duplicates
    const isAlreadyCompleted = caseData.stageHistory.some(s => s.stageId === stageId);

    if (!isAlreadyCompleted) {
      caseData.stageHistory.push({
        stageId: stageId,
        completedDate: completionDate
      });
      caseData.completedStages.push(stageId);
    }

    caseData.currentStage = stageId;
    caseData.lastUpdateDate = completionDate;

    // Auto-update status based on stage
    if (stageId === 1) caseData.status = 'filed';
    if (stageId >= 2 && stageId <= 5) caseData.status = 'in-progress';
    if (stageId >= 6 && stageId <= 8) caseData.status = 'hearings';
    if (stageId === 9) caseData.status = 'completed';

    await caseData.save();

    return NextResponse.json({
      success: true,
      message: `Stage ${stageId} marked as completed`,
      case: caseData
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
