import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dummy sync route to satisfy frontend requests
    return NextResponse.json({ 
      success: true, 
      message: 'Notifications synchronized',
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
