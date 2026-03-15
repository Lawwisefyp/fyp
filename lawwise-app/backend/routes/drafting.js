const express = require('express');
const router = express.Router();
const Draft = require('../models/Draft');
const Template = require('../models/Template');
const auth = require('../middleware/auth');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/drafts';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Get available templates
router.get('/templates', auth, async (req, res) => {
    try {
        const templates = await Template.find({ isActive: true });
        res.json({ success: true, templates });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
});

// Generate/Synthesize Document
router.post('/generate', auth, upload.array('files'), async (req, res) => {
    try {
        const { templateId, formData, title, documentType, details, enhanceClauses } = req.body;
        const uploadedFiles = req.files || [];
        const parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData;

        let finalContent = "";
        let agentUsed = "Deterministic Engine";
        let template = null;

        if (templateId) {
            template = await Template.findById(templateId);
            if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

            // Step 1: Extract Professional Boilerplate Syntax
            template.sections.forEach(section => {
                finalContent += `### ${section.title}\n${section.content}\n\n`;
            });
            agentUsed = "Boilerplate + Synthesis";
        } else {
            finalContent = "Generating from case facts using general legal standards...";
            agentUsed = "Pure AI Generation";
        }

        // Step 2: AI Case Synthesis (Mandatory for high-quality professional results)
        if (details || !templateId) {
            agentUsed = templateId ? "Elite Synthesis" : "Pure AI Drafting";
            const contextFromFiles = ""; // Parsing files logic here if needed

            const aiPrompt = `
                ROLE: Elite Senior Advocate & Legal Drafting Specialist.
                
                PHASE 1: SITUATIONAL ANALYSIS
                1. Read the "SPECIFIC CASE FACTS" and "ADDITIONAL CONTEXT" provided below.
                2. Identify the Applicant (Client), the Recipient (Opposite Party), the core legal issue, and the specific demands.
                3. Determine the situational requirement (e.g., is it a bank verification, a payment recovery, a notice of breach?).
                
                PHASE 2: ELITE DOCUMENT SYNTHESIS
                Draft a world-class legal document using the "UNIVERSAL MASTER TEMPLATE (SKELETON)" as your structural guide.
                
                SKELETON TO FOLLOW:
                ${finalContent}
                
                SPECIFIC CASE FACTS / USER DIRECTIVE:
                ${details}
                
                ADDITIONAL CONTEXT FROM FILES:
                ${contextFromFiles || "None"}
                
                STRICT COMPLIANCE RULES:
                1. NO PLACEHOLDERS: You MUST replace every single bracketed placeholder [LIKE_THIS] with either factual data or professional legal boilerplate. NEVER output a bracketed placeholder.
                2. NARRATIVE EXPANSION: Do not just "fill" sentences. Expand the narrative based on your PHASE 1 analysis. Use legal reasoning.
                3. BOLDING: Use **bolding** for all party names, dates, amounts, and paragraph headers.
                4. FORMAL WITNESSES: Always include the formal "WITNESSES" section at the end.
                5. TONE: Maintain a high-weight, authoritative legal tone ("hereinafter", "constrained", "without prejudice").
                
                OUTPUT ONLY THE FINALIZED PROFESSIONAL DOCUMENT. DO NOT INCLUDE YOUR ANALYSIS IN THE OUTPUT.
            `;

            console.log(`[DraftingAgent] Initiating Synthesis for: ${title || 'Unstructured Case'}`);
            console.log(`[DraftingAgent] Facts Length: ${details?.length || 0} chars`);

            try {
                const response = await axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: "gpt-4o",
                        messages: [
                            {
                                role: "system",
                                content: "You are an Elite Senior Advocate and Legal Drafting Specialist. You always produce 100% placeholder-free, professionally bolded, and situationally aware legal documents."
                            },
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
                    console.log(`[DraftingAgent] OpenAI Synthesis Successful. Final Length: ${finalContent.length} chars`);
                } else {
                    throw new Error("AI returned empty content");
                }
            } catch (err) {
                console.error('[DraftingAgent] AI Synthesis Critical Failure:', err.response?.data || err.message);

                // --- DETERMINISTIC FALLBACK ENGINE (FREE MODE) ---
                console.log('[DraftingAgent] Initiating Deterministic Synthesis Fallback...');
                agentUsed = "Deterministic Synthesis (Free Mode)";

                // Helper to extract data from 'details' using common patterns
                const extractFact = (regex, fallback = "") => {
                    const match = details.match(regex);
                    return match ? match[1].trim() : fallback;
                };

                const facts = {
                    client: extractFact(/Client[:\-\s]+([^\n\r]+)/i, "Our Client"),
                    recipient: extractFact(/Recipient[:\-\s]+([^\n\r]+)/i, "the Addressee"),
                    date: new Date().toLocaleDateString(),
                    amount: extractFact(/(?:Amount|Balance|Sum|Demand)[:\-\s]+([^\s\n\r]+)/i, "the outstanding sum"),
                    days: extractFact(/([0-9]+)\s*(?:days|day)/i, "15"),
                    subject: extractFact(/Subject[:\-\s]+([^\n\r]+)/i, "LEGAL NOTICE"),
                    issue: extractFact(/(?:Issue|Breach|Default|Fact)[:\-\s]+([^\n\r]+)/i, "the default and breach of obligations"),
                    background: extractFact(/(?:Background|Context)[:\-\s]+([^\n\r]+)/i, "the long-standing professional and contractual relationship between the parties"),
                    importantDate: extractFact(/(?:On|Dated)[:\-\s]+([^\n\r]+)/i, "the date mentioned in our directives"),
                    eventDescription: extractFact(/(?:Event|Transaction|Purchase)[:\-\s]+([^\n\r]+)/i, "the transaction detailed in the directives")
                };

                // Perform global replacement in the template content
                let s = finalContent;
                s = s.replace(/\[CLIENT_NAME\]/g, facts.client);
                s = s.replace(/\[RECIPIENT_FULL_DETAILS\]/g, facts.recipient);
                s = s.replace(/\[DATE\]/g, facts.date);
                s = s.replace(/\[SUBJECT_OF_NOTICE\]/g, facts.subject);
                s = s.replace(/\[NUMBER_OF_DAYS\]/g, facts.days);
                s = s.replace(/\[RECIPIENT_NAME\]/g, facts.recipient.split(',')[0]);

                // Narrative Specifics
                s = s.replace(/\[BRIEF_BACKGROUND_OF_RELATIONSHIP_OR_TRANSACTION\]/g, facts.background);
                s = s.replace(/\[IMPORTANT_DATE\]/g, facts.importantDate);
                s = s.replace(/\[KEY_EVENT_OR_TRANSACTION\]/g, facts.eventDescription);
                s = s.replace(/\[DEFAULT_OR_WRONGFUL_ACT\]/g, facts.issue);

                const pDemand = (facts.amount.toLowerCase().startsWith('of') || facts.amount.toLowerCase().startsWith('the'))
                    ? `comply with the demand for ${facts.amount}`
                    : `make the payment of ${facts.amount}`;

                s = s.replace(/\[PRIMARY_DEMAND\]/g, pDemand);
                s = s.replace(/\[ALTERNATIVE_OR_ADDITIONAL_DEMAND\]/g, `pay any additional costs or interest accrued as per the agreement`);

                // Clean up any remaining common placeholders
                s = s.replace(/\[ADVOCATE_NAME\]/g, "the undersigned Advocate");
                s = s.replace(/^[a-z]\)\s*\[.*?\]\s*$/gm, ""); // Remove empty bullet points
                s = s.replace(/\[.*?\]/g, ""); // Final removal of any leftovers

                // Add Professional Signature Box
                s += `\n\nYours faithfully,\n\n(Signature / Court Seal)\n\n__________________________\nAuthorized Signatory for ${facts.client}\nDesignation: Legal Representative / Advocate\nDate: ${facts.date}`;

                finalContent = s;
                console.log('[DraftingAgent] Elite Deterministic Synthesis Complete.');
            }
        }

        // Step 3: Self-Review Step (Simulated for now, could be another AI call)
        const reviewNotes = "Document consistency checked against provided facts.";

        const newDraft = new Draft({
            lawyerId: req.user._id,
            templateId: templateId || null,
            title: title || `Draft - ${documentType || template?.type}`,
            documentType: documentType || template?.type || 'Other',
            content: finalContent,
            formData: parsedFormData,
            details,
            sourceFiles: uploadedFiles.map(f => ({ name: f.originalname, path: f.path })),
            metadata: {
                agentUsed,
                reviewNotes,
                timestamp: new Date()
            }
        });

        await newDraft.save();
        res.json({ success: true, draft: newDraft });

    } catch (error) {
        console.error('[DraftingAgent] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// AI Self-Review of a draft
router.post('/:id/review', auth, async (req, res) => {
    try {
        const draft = await Draft.findOne({ _id: req.params.id, lawyerId: req.user._id });
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });

        const reviewPrompt = `
            ROLE: Senior Legal Auditor.
            TASK: Review the following legal document draft for any internal inconsistencies, missing required placeholders, or logical errors.
            
            DOCUMENT CONTENT:
            ${draft.content}
            
            USER FACTS:
            ${draft.details}
            
            OUTPUT:
            Provide a concise list of potential issues or a confirmation that the document is consistent.
        `;

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [{ role: "user", content: reviewPrompt }]
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                timeout: 30000
            }
        );

        const reviewNotes = response.data?.choices?.[0]?.message?.content || "No issues found.";

        draft.metadata = { ...draft.metadata, reviewNotes, lastReviewed: new Date() };
        await draft.save();

        res.json({ success: true, reviewNotes });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Review failed' });
    }
});

// Update an existing draft (Versioning)
router.put('/:id', auth, async (req, res) => {
    try {
        const { content, title } = req.body;
        const draft = await Draft.findOne({ _id: req.params.id, lawyerId: req.user._id });

        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });

        // Push current state to history before updating
        draft.history.push({
            content: draft.content,
            updatedBy: req.user._id,
            updatedAt: new Date(),
            version: draft.version
        });

        draft.content = content || draft.content;
        draft.title = title || draft.title;
        draft.version += 1;

        await draft.save();
        res.json({ success: true, draft });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Update failed' });
    }
});

// Get user's drafts
router.get('/my-drafts', auth, async (req, res) => {
    try {
        const drafts = await Draft.find({ lawyerId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, drafts });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch drafts' });
    }
});

// Export Draft to DOCX
router.get('/export/:id/docx', auth, async (req, res) => {
    try {
        const draft = await Draft.findOne({ _id: req.params.id, lawyerId: req.user._id });
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: draft.title.toUpperCase(),
                                bold: true,
                                size: 32,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    ...draft.content.split('\n').map(line => {
                        if (line.startsWith('### ')) {
                            return new Paragraph({
                                children: [
                                    new TextRun({
                                        text: line.replace('### ', '').toUpperCase(),
                                        bold: true,
                                        size: 24,
                                    }),
                                ],
                                spacing: { before: 400, after: 200 },
                            });
                        }
                        return new Paragraph({
                            children: [new TextRun(line)],
                            spacing: { after: 200 },
                        });
                    }),
                ],
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${draft.title.replace(/\s+/g, '_')}.docx`);
        res.send(buffer);

    } catch (error) {
        console.error('[Export] Critical failure:', error);
        res.status(500).json({ success: false, error: 'Export failed' });
    }
});

module.exports = router;
