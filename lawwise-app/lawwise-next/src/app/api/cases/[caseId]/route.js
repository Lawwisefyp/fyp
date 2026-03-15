import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/lib/models/Case';
import Notification from '@/lib/models/Notification';
import { verifyAuth } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const { caseId } = await params;
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const foundCase = await Case.findOne({ id: caseId, lawyerId: auth.user._id });

    if (!foundCase) {
      return NextResponse.json({
        success: false,
        message: 'Case not found or unauthorized'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      case: foundCase
    });
  } catch (error) {
    console.error('Get case error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;
    const updateData = await req.json();

    await dbConnect();

    // Use findOne with the 'id' field (CASE-...) or '_id'
    const existingCase = await Case.findOne({ id: caseId, lawyerId: auth.user._id });

    if (!existingCase) {
      return NextResponse.json({
        success: false,
        message: 'Case not found or unauthorized'
      }, { status: 404 });
    }

    // Handle nextHearingDate update for notifications
    if (updateData.nextHearingDate && updateData.nextHearingDate !== existingCase.nextHearingDate) {
      const reminder = new Notification({
        toLawyerId: auth.user._id,
        title: '⚖️ New Hearing Scheduled',
        message: `A new hearing for "${existingCase.title}" has been set for ${new Date(updateData.nextHearingDate).toLocaleDateString()}.`,
        type: 'hearing_reminder',
        status: 'unread'
      });
      await reminder.save();
    }

    // Update case
    const updatedCase = await Case.findOneAndUpdate(
      { id: caseId, lawyerId: auth.user._id },
      { ...updateData, lastUpdateDate: new Date().toISOString().split('T')[0] },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Case updated successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('Update case error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;

    await dbConnect();

    const deletedCase = await Case.findOneAndDelete({ id: caseId, lawyerId: auth.user._id });

    if (!deletedCase) {
      return NextResponse.json({
        success: false,
        message: 'Case not found or unauthorized'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
