const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getChatResponse = async (chatHistory, userMessage, context = "") => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a professional Legal AI Assistant. 
      - If the user asks about Pakistan or Pakistani law, you are a Senior Legal Expert in the Laws of Pakistan.
      - If the user asks about other jurisdictions or general legal principles, you are a Global Legal Consultant.

      Legal Context provided for this query (LOCAL STATUTES vs EXTERNAL CASE LAW):
      ${context}
      
      User Query: ${userMessage}
      
      RESPONSE GUIDELINES:
      - STRUCTURE: Use clear Markdown headers (###), bold key terms, and use bullet points for readability.
      - PAKISTAN QUERIES: 
        1. FIRST, search the "LOCAL STATUTES" for direct matches (e.g. PPC). Cite Sections clearly.
        2. SECOND, if the LOCAL STATUTES are missing the specific law (e.g. Family Law, Constitution), use your comprehensive internal knowledge of Pakistani Law to provide a complete answer.
        3. Clarify if you are citing a provided statute or the broader legal framework of Pakistan.
      - INTERNATIONAL QUERIES: Use the "EXTERNAL CASE LAW" provided or your global knowledge. Always state the jurisdiction (e.g. "In the United States...", "Under English Law...").
      - TONE: Professional, objective, and helpful. Always include a standard legal disclaimer at the end.
      - ACCURACY: If the provided "LOCAL STATUTES" are about one topic (e.g. Theft) but the user asks about another (e.g. Divorce), do not try to force the theft context; instead, use your internal knowledge about the requested topic.
      `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error.message);
    return `Gemini Error: ${error.message}`;
  }
};

const generateLegalDocument = async (docType, userInputs) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Format inputs into a readable string for the prompt
    const formattedInputs = Object.entries(userInputs)
      .filter(([_, value]) => value && value.trim() !== "")
      .map(
        ([key, value]) =>
          `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`,
      )
      .join("\n      ");

    const prompt = `
      You are an expert Legal Draftsman and Attorney specializing in Pakistani Law.
      Your task is to draft a formal, professional, and legally sound document of type: "${docType}".
      
      The document MUST strictly adhere to Pakistani legal drafting standards (e.g., High Court Rules, Civil Procedure Code where applicable).
      
      INPUT PARAMETERS:
      ${formattedInputs || "No specific details provided."}
      
      CRITICAL INSTRUCTIONS:
      1. DOCUMENT preamble:
         - Formally introduce all parties with their Full Names, Addresses, and CNIC numbers (if provided).
         - Identify roles correctly (e.g., Petitioner vs Respondent, First Party vs Second Party).
         - For Petitions and Affidavits, use the formal court heading format.

      2. SPECIALIZED SECTIONS (Integrate if provided in inputs):
         - JURISDICTION: Include a specific paragraph justifying the jurisdiction of the court/authority.
         - LEGAL GROUNDS: Elaborate on the "Cause of Action" using professional legal logic.
         - ARBITRATION/NOTICES: For Contracts, if provided, draft a standard Pakistani-style Arbitration or Notice clause.
         - FORCE MAJEURE: If relevant or provided, include a standard "Acts of God" clause tailored to the contract context.
         - ANNEXURES: At the end of Petitions, list the provided Annexures formally (e.g., Annex-A, Annex-B).
      
      3. STRUCTURE & PHRASING:
         - Use numbered paragraphs for all factual and legal claims.
         - Use precise terminology: "deponent", "hereinafter", "whereas", "inter-alia", "prayer".
         - Include a formal "Prayer" section for Petitions or "Demand" for Legal Notices.
         - Verification: Every Petition or Affidavit MUST end with a formal Verification block.
         
      4. FORMATTING:
         - Output ONLY the professional document text. No conversational filler.
         - Use bracketed placeholders [LIKE THIS] for any standard professional information that is missing but legally necessary.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Strip markdown code blocks if the AI includes them accidentally
    return response
      .text()
      .replace(/^```[\w]*\n/, "")
      .replace(/\n```$/, "")
      .trim();
  } catch (error) {
    console.error("Gemini AI Drafting Error:", error);
    throw new Error(`Failed to generate document via AI: ${error.message}`);
  }
};

const refineLegalDocument = async (originalContent, instruction, docType) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Legal Draftsman specializing in Pakistani Law.
      You are provided with an existing draft of a "${docType}" and a specific instruction for refinement.
      
      ORIGINAL DRAFT:
      ---
      ${originalContent}
      ---
      
      USER INSTRUCTION FOR REFINEMENT:
      "${instruction}"
      
      CRITICAL INSTRUCTIONS:
      1. Apply the user's requested changes PRECISELY.
      2. Maintain the formal, professional, and logical structure of the original document.
      3. Ensure all Pakistani legal standards (terminology, numbering, verification blocks) remain intact.
      4. If the instruction is vague, interpret it in a way that maximizes legal protection for the party drafted for.
      5. Output ONLY the updated document text. No conversational filler.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response
      .text()
      .replace(/^```[\w]*\n/, "")
      .replace(/\n```$/, "")
      .trim();
  } catch (error) {
    console.error("Gemini AI Refinement Error:", error);
    throw new Error(`Failed to refine document via AI: ${error.message}`);
  }
};

module.exports = {
  getChatResponse,
  generateLegalDocument,
  refineLegalDocument,
};
