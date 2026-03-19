const express = require("express");
const router = express.Router();
const { queryVectorStore } = require("../services/vectorService");
const { getChatResponse } = require("../services/aiService");
const { searchLegalCases } = require("../services/legalSearchService");

router.post("/", async (req, res) => {
  const { message, question, history } = req.body;
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

    const combinedContext = `
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

    res.json({
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
