const express = require("express");
const router = express.Router();
const { queryVectorStore } = require("../services/vectorService");
const { getChatResponse } = require("../services/aiService");
const auth = require("../middleware/auth");
const ChatSession = require("../models/ChatSession");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

// GET /api/chat/history - Fetch user's chat history
router.get("/history", auth, async (req, res) => {
    try {
        const isBriefcaseQuery = req.query.module === 'briefcase';
        const query = { userId: req.user._id };
        if (isBriefcaseQuery) {
            query.isBriefcase = true;
        } else {
            query.$or = [{ isBriefcase: false }, { isBriefcase: { $exists: false } }];
        }

        const sessions = await ChatSession.find(query)
            .select('-messages.context') // Exclude heavy context data from list view
            .sort({ updatedAt: -1 });
        res.json(sessions);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

// GET /api/chat/history/:id - Fetch specific chat session details
router.get("/history/:id", auth, async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
        if (!session) return res.status(404).json({ error: "Session not found" });
        res.json(session);
    } catch (error) {
        console.error("Error fetching chat session:", error);
        res.status(500).json({ error: "Failed to fetch chat session" });
    }
});

router.post("/", auth, async (req, res) => {
  const { message, question, history, sessionId, isDocumentAnalysis } = req.body;
  const userQuery = message || question;

  console.log("Received chat request:", userQuery);

  if (!userQuery) {
    return res.status(400).json({ error: "Message/Question is required" });
  }

  try {
    console.log("Querying Vector Store (Local Knowledge)...");
    const localContext = (await queryVectorStore(userQuery)) || [];
    console.log(`Vector Store Result: ${localContext.length} documents found`);
    if (localContext.length > 0) {
      console.log("First Local Doc Snippet:", localContext[0].substring(0, 100));
    }



    const Document = require('../models/Document');
    let selectedDocsContext = "";
    if (req.body.documentIds && req.body.documentIds.length > 0) {
      console.log(`Fetching selected documents for context: ${req.body.documentIds}`);
      try {
        const docs = await Document.find({ _id: { $in: req.body.documentIds } });
        for (const doc of docs) {
            if (doc.fileData) {
                let textContent = "";
                const fileTypeUpper = (doc.fileType || "").toUpperCase();

                if (fileTypeUpper === "PDF") {
                    try {
                        console.log(`Parsing PDF document: ${doc.title}`);
                        const parser = new pdf.PDFParse({ data: doc.fileData });
                        const parsed = await parser.getText();
                        textContent = parsed.text || "";
                    } catch (pdfErr) {
                        console.error(`Failed to parse PDF document ${doc.title}:`, pdfErr);
                        textContent = doc.fileData.toString('utf-8');
                    }
                } else if (fileTypeUpper === "DOCX") {
                    try {
                        console.log(`Parsing DOCX document: ${doc.title}`);
                        const parsed = await mammoth.extractRawText({ buffer: doc.fileData });
                        textContent = parsed.value || "";
                    } catch (docxErr) {
                        console.error(`Failed to parse DOCX document ${doc.title}:`, docxErr);
                        textContent = doc.fileData.toString('utf-8');
                    }
                } else {
                    textContent = doc.fileData.toString('utf-8');
                }

                // limit to 10000 chars to avoid token limits
                const truncatedText = textContent.substring(0, 10000);
                selectedDocsContext += `\nDOCUMENT: ${doc.title}\nCONTENT:\n${truncatedText}\n---\n`;
            }
        }
      } catch (err) {
         console.error("Error fetching selected docs for context", err);
      }
    }

    const combinedContext = `
USER SELECTED DOCUMENTS:
${selectedDocsContext}

LOCAL STATUTES/KNOWLEDGE:
${Array.isArray(localContext) ? localContext.join("\n") : ""}
    `;

    console.log("Calling Gemini AI...");
    const aiResponse = await getChatResponse(
      history,
      userQuery,
      combinedContext,
      isDocumentAnalysis
    );

    // Save to Database
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user._id });
    }

    if (!session) {
      // Create new session
      let title = userQuery.substring(0, 40);
      if (userQuery.length > 40) title += '...';
      
      session = new ChatSession({
        userId: req.user._id,
        userType: req.role === 'lawyer' ? 'Lawyer' : (req.role === 'student' ? 'Student' : 'Client'),
        title: title,
        messages: [],
        isBriefcase: !!isDocumentAnalysis
      });
    }

    // Push new messages
    session.messages.push({
      role: 'user',
      content: userQuery
    });
    session.messages.push({
      role: 'ai',
      content: aiResponse,
      context: { local: localContext }
    });

    await session.save();

    res.json({
      sessionId: session._id,
      response: aiResponse,
      answer: aiResponse,
      context: { local: localContext },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
