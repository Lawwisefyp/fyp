import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/lib/models/Case';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(req, { params }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId, documentId } = await params;

    await dbConnect();
    const caseData = await Case.findOne({ id: caseId });

    if (!caseData) {
      return NextResponse.json({ success: false, message: 'Case not found' }, { status: 404 });
    }

    // Verify access
    if (auth.role === 'lawyer' && caseData.lawyerId?.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    if (auth.role === 'client' && caseData.clientEmail !== auth.user.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const document = caseData.documents.find(doc => doc.filename === documentId);

    if (!document) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    if (!fs.existsSync(document.filepath)) {
      return NextResponse.json({ success: false, message: 'Document file not found on server' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(document.filepath);
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': document.documentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.originalName}"`,
      },
    });

  } catch (error) {
    console.error('Download document error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
