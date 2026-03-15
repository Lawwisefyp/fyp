import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/lib/models/Case';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized or not a lawyer' }, { status: 401 });
    }

    await dbConnect();

    // Get all unassigned cases with status 'filed'
    const unassignedCases = await Case.find({ lawyerId: null, status: 'filed' }).sort({ createdAt: -1 });

    const lawyer = auth.user;
    
    // Define keywords for each case type
    const typeToSpec = {
      'civil': ['civil'],
      'criminal': ['criminal'],
      'family': ['family'],
      'corporate': ['corporate', 'business'],
      'labor': ['labor', 'employment'],
      'intellectual': ['intellectual', 'patent', 'trademark', 'copyright']
    };

    // Extract lawyer's specializations and practice areas
    const specArray = [];
    if (lawyer.specialization) specArray.push(lawyer.specialization.toLowerCase());
    if (lawyer.professionalInfo?.specialization) specArray.push(lawyer.professionalInfo.specialization.toLowerCase());
    if (lawyer.professionalInfo?.practiceAreas) {
      lawyer.professionalInfo.practiceAreas.forEach(area => specArray.push(area.toLowerCase()));
    }

    const uniqueLawyerSpecs = [...new Set(specArray)];

    // Filter cases based on lawyer's expertise
    const filteredCases = unassignedCases.filter(c => {
      const keywords = typeToSpec[c.caseType] || [c.caseType?.toLowerCase() || ''];
      // Check if any of the lawyer's specializations contain any of the case's keywords
      return uniqueLawyerSpecs.some(spec => keywords.some(kw => spec.includes(kw)));
    });

    return NextResponse.json({
      success: true,
      cases: filteredCases
    });
  } catch (error) {
    console.error('Marketplace fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
