import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Document from '@/lib/models/Document';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const document = await Document.findOne({ _id: id, lawyerId: auth.user._id });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete the physical file
    const filePath = path.join(process.cwd(), 'public', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
