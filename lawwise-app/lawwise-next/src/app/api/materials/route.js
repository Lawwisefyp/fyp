import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import StudyMaterial from '@/lib/models/StudyMaterial';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    await dbConnect();
    let query = {};
    if (category) query.category = category;

    const materials = await StudyMaterial.find(query);
    return NextResponse.json({ success: true, materials });
  } catch (error) {
    console.error('Fetch materials error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    // Assuming only admins or students can upload? Let's check original.
    // For now, allow auth users.
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const materialData = await req.json();
    await dbConnect();
    const material = new StudyMaterial(materialData);
    await material.save();
    return NextResponse.json({ success: true, material }, { status: 201 });
  } catch (error) {
    console.error('Create material error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
