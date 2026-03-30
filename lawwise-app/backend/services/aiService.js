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
      
      The document MUST strictly adhere to Pakistani legal drafting standards and relevant statutes:
      - Civil Documents: Code of Civil Procedure (CPC) 1908.
      - Criminal Documents: Code of Criminal Procedure (CrPC) 1898.
      - Contracts & Business: Contract Act 1872 and Transfer of Property Act 1882.
      - Constitutional: Constitution of Pakistan 1973 (e.g., Article 199 for Writ Petitions).
      
      INPUT PARAMETERS:
      ${formattedInputs || "No specific details provided."}
      
      CRITICAL INSTRUCTIONS:
      1. DOCUMENT preamble:
         - Formally introduce all parties with their Full Names, Addresses, and CNIC numbers (if provided).
         - Identify roles correctly (e.g., Petitioner vs Respondent, Plaintiff vs Defendant, First Party vs Second Party).
         - For Court Documents (Petitions, Plaints, Applications), use the formal court heading format (In the Court of..., etc.).

      2. SPECIALIZED SECTIONS (Integrate if provided in inputs):
         - JURISDICTION: Include a specific paragraph justifying the jurisdiction of the court/authority.
         - LEGAL GROUNDS: Elaborate on the "Cause of Action" or "Grounds" using professional legal logic and citing relevant sections (e.g., Section 9 CPC, Section 497 CrPC).
         - ARBITRATION/NOTICES: For Contracts, if provided, draft a standard Pakistani-style Arbitration or Notice clause.
         - FORCE MAJEURE: If relevant or provided, include a standard "Acts of God" clause tailored to the contract context.
         - ANNEXURES: At the end of Petitions, list the provided Annexures formally (e.g., Annex-A, Annex-B).
      
      3. STRUCTURE & PHRASING:
         - LANGUAGE: Use clear, modern, and easily understandable language that a layperson (normal person) can comprehend. Avoid unnecessary or archaic legalese (e.g., avoid "inter-alia", "hereinafter", "whereas" unless strictly necessary for the formal structure).
         - Use numbered paragraphs for all factual and legal claims.
         - Use precise but accessible terminology: "applicant", "respondent", "prayer", "verification".
         - Include a formal "Prayer" section for Petitions/Suits or "Demand" for Legal Notices.
         - Verification: Every Petition, Suit, or Affidavit MUST end with a formal Verification block as per High Court Rules.
         
      4. FORMATTING:
         - Output ONLY the professional document text. No conversational filler.
         - Ensure the document is well-organized and easy to read.
         - Use bracketed placeholders [LIKE THIS] for any standard professional information that is missing but legally necessary (e.g., [CNIC No.], [Date]).
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
