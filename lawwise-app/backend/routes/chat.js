const express = require("express");
const router = express.Router();
const { queryVectorStore } = require("../services/vectorService");
const { getChatResponse } = require("../services/aiService");
const { searchLegalCases } = require("../services/legalSearchService");
const auth = require("../middleware/auth");
const ChatSession = require("../models/ChatSession");

// GET /api/chat/history - Fetch user's chat history
router.get("/history", auth, async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.user._id })
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
  const { message, question, history, sessionId } = req.body;
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

    console.log("Searching Legal Cases (External Knowledge)...");
    const externalContext = (await searchLegalCases(userQuery)) || [];
    console.log(`Legal Search Result: ${externalContext.length} results found`);

    const Document = require('../models/Document');
    let selectedDocsContext = "";
    if (req.body.documentIds && req.body.documentIds.length > 0) {
      console.log(`Fetching selected documents for context: ${req.body.documentIds}`);
      try {
        const docs = await Document.find({ _id: { $in: req.body.documentIds } });
        for (const doc of docs) {
            if (doc.fileData) {
                // simple extraction for text files, or base64 for others if we pass to multimodal AI,
                // but since we only have text prompts here, let's try to decode as text.
                // For PDF/DOCX this might be gibberish without parsing, but it will work perfectly for .txt
                const textContent = doc.fileData.toString('utf-8').substring(0, 5000); // limit to 5000 chars to avoid token limits
                selectedDocsContext += `\nDOCUMENT: ${doc.title}\nCONTENT:\n${textContent}\n---\n`;
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

EXTERNAL CASE LAW:
${Array.isArray(externalContext) ? externalContext.map((c) => `${c.title}: ${c.snippet}`).join("\n") : ""}
    `;

    console.log("Calling Gemini AI...");
    const aiResponse = await getChatResponse(
      history,
      userQuery,
      combinedContext,
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
        messages: []
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
      context: { local: localContext, external: externalContext }
    });

    await session.save();

    res.json({
      sessionId: session._id,
      response: aiResponse,
      answer: aiResponse,
      context: { local: localContext, external: externalContext },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
