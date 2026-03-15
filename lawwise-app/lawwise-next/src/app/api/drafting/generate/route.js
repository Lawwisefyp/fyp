import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Draft from '@/lib/models/Draft';
import Template from '@/lib/models/Template';
import { verifyAuth } from '@/lib/auth';
import axios from 'axios';

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const templateId = formData.get('templateId');
    const title = formData.get('title');
    const documentType = formData.get('documentType');
    const details = formData.get('details');
    // For now, ignoring file uploads for simplicity in migration, or keeping them basic
    const files = formData.getAll('files');

    await dbConnect();

    let finalContent = "";
    let agentUsed = "Deterministic Engine";
    let template = null;

    if (templateId) {
      template = await Template.findById(templateId);
      if (!template) return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });

      template.sections.forEach(section => {
        finalContent += `### ${section.title}\n${section.content}\n\n`;
      });
      agentUsed = "Boilerplate + Synthesis";
    } else {
      finalContent = "Generating from case facts using general legal standards...";
      agentUsed = "Pure AI Generation";
    }

    // AI Case Synthesis logic
    if (details || !templateId) {
      agentUsed = templateId ? "Elite Synthesis" : "Pure AI Drafting";
      
      const aiPrompt = `
        ROLE: Elite Senior Advocate & Legal Drafting Specialist.
        
        PHASE 1: SITUATIONAL ANALYSIS
        1. Read the "SPECIFIC CASE FACTS" provided below.
        2. Identify the Applicant (Client), the Recipient (Opposite Party), the core legal issue, and the specific demands.
        
        PHASE 2: ELITE DOCUMENT SYNTHESIS
        Draft a world-class legal document using this as your structural guide:
        ${finalContent}
        
        SPECIFIC CASE FACTS:
        ${details}
        
        STRICT COMPLIANCE RULES:
        1. NO PLACEHOLDERS: Replace all [BRACKETED_FIELDS] with factual data or professional legal boilerplate.
        2. BOLDING: Use **bolding** for party names, dates, amounts.
        3. TONE: High-weight, authoritative legal tone.
        
        OUTPUT ONLY THE FINALIZED PROFESSIONAL DOCUMENT.
      `;

      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are an Elite Senior Advocate and Legal Drafting Specialist." },
              { role: "user", content: aiPrompt }
            ],
            temperature: 0.7,
            max_tokens: 3000
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        if (response.data?.choices?.[0]?.message?.content) {
          finalContent = response.data.choices[0].message.content;
        }
      } catch (err) {
        console.error('[Drafting] AI Synthesis Fallback:', err.message);
        // Fallback or error
        if (!finalContent) {
           return NextResponse.json({ success: false, error: 'AI Synthesis failed and no template available.' }, { status: 500 });
        }
      }
    }

    const newDraft = new Draft({
      lawyerId: auth.user._id,
      templateId: templateId || null,
      title: title || `Draft - ${documentType || template?.type}`,
      documentType: documentType || template?.type || 'Other',
      content: finalContent,
      details,
      metadata: {
        agentUsed,
        timestamp: new Date()
      }
    });

    await newDraft.save();
    return NextResponse.json({ success: true, draft: newDraft });

  } catch (error) {
    console.error('[Drafting] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
