const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getChatResponse = async (chatHistory, userMessage, context = "") => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a Senior Legal Expert in the Laws of Pakistan with comprehensive knowledge of all Pakistani statutes, case law, and legal principles.
      Your task is to provide a highly structured, professional, and detailed legal advisory response.
      
      User Query: ${userMessage}
      
      Local Knowledge Base Context (from ingested statutes/constitution):
      ${context || "No local context available."}

      KNOWLEDGE SOURCE RULE (CRITICAL):
      - If the Local Knowledge Base Context above is empty, insufficient, or does not fully answer the query — DO NOT leave any section blank.
      - Instead, draw from your comprehensive training knowledge of Pakistani law: PPC 1860, CrPC 1898, Constitution 1973, PECA 2016, Anti-Rape Act 2021, etc.
      - Treat your internal legal knowledge as a complete fallback. A response must ALWAYS be substantive and complete.

      CRITICAL INSTRUCTIONS:
      - **DYNAMIC PREAMBLE**: ALWAYS start your response with a 1-2 sentence formal statement identifying the core legal framework.

      - **INTERACTIVE TAGS (MANDATORY)**: Wrap key information in these specific HTML tags for UI enhancement:
          1. For every mention of a specific Law, Section, or Article:
             <law-statute name="Full Statute Name" url="GOOGLE_SCHOLAR_URL">Identifier</law-statute>
             URL RULES (STRICTLY FOLLOW): 
               - NEVER invent or guess a URL. 
               - ALWAYS use a Google Scholar search link as the URL: https://scholar.google.com/scholar?q=STATUTE+NAME+Pakistan
               - Example: url="https://scholar.google.com/scholar?q=Section+376+Pakistan+Penal+Code"
          2. <law-penalty>Penalty or Status Statement</law-penalty>: For every specific penalty or legal status.
          3. <law-details>Long Content</law-details>: Wrap verbatim quotes, lengthy analysis, or secondary facts in this tag. They will be collapsible in the UI.

      - **HEADINGS**: Use '###' (Markdown H3) for all main section headings.

      - **CASE LAW ACCURACY (CRITICAL)**: 
          - ONLY cite REAL, VERIFIED Pakistani Supreme Court or High Court judgments that you are CERTAIN exist.
          - If you are NOT 100% certain about a case name and citation, DO NOT cite it. It is better to cite 1 verified case than 3 fabricated ones.
          - DO NOT use placeholder or generic names like "ABC vs The State". These are not real citations.
          - Provide the full citation: [Petitioner Name] v [Respondent], [Year] [Reporter] [Page No.] (e.g., 2019 SCMR 1234).

      - **LEGAL ANALYSIS METHODOLOGY** (ALWAYS apply these principles):
          1. CIVIL vs CRIMINAL FIRST: Always distinguish civil and criminal liability before anything else.
          2. DEFAULT TO CIVIL: In financial/investment/contract disputes, default to civil remedies unless there is clear evidence of initial dishonest intention.
          3. INITIAL DISHONEST INTENT TEST: Before recommending Sections 420 or 406 PPC, apply the "initial dishonest intent" test. Criminal proceedings for fraud are only appropriate if dishonest intent existed AT THE INCEPTION of the transaction — not if it arose later.
          4. DO NOT OVER-CRIMINALIZE: Avoid recommending an FIR for what is essentially a breach of contract. Courts in Pakistan strongly discourage using criminal law as a tool to pressure the other party in civil disputes.
          5. STRUCTURED REMEDIES: Present remedies in this order:
             a. **Primary Remedy** — Civil (Suit for Recovery, Damages, Specific Performance).
             b. **Conditional Criminal Remedy** — Only if initial dishonest intent is established (Section 420/406 PPC, PECA 2016).
          6. DIGITAL EVIDENCE PROTOCOL: If the query involves electronic communications (WhatsApp, email, screenshots):
             - Cite Articles 164 and 46-A of Qanun-e-Shahadat Order 1984 for admissibility.
             - Mention forensic verification if authenticity is disputed.
             - Assess applicability of PECA 2016 Sections 14/24/25 if the digital act forms part of the offence.
          7. INCLUDE LEGAL TEST SECTION: Add a "### Legal Test" sub-section within Analysis applying the key judicial principles to the facts.
          8. CASE LAW ON CIVIL/CRIMINAL DISTINCTION: Cite relevant Pakistan Supreme Court / High Court judgments that address the distinction between breach of contract and criminal offence where applicable.

      - TONE: Write like a practicing Pakistani lawyer giving practical advice — clear, direct, and strategic. Not like a textbook. Objective but actionable.
      - ACCURACY: Strictly adhere to the Constitution of 1973, PPC 1860, and all applicable Pakistani laws.
      - NO "SYSTEM THINKING": Avoid headers like "Scenario Overview" or "Tests". Integrate context naturally.

      - CASE LAW IS MANDATORY — NOT OPTIONAL:
          - You MUST cite at least one real, verified Pakistani judgment when explaining any of these:
              a. Civil vs. criminal distinction
              b. Investment vs. entrustment
              c. Requirement of initial dishonest intent
          - DO NOT say "no precedent available" or skip case law. If needed, draw from your training knowledge of well-known Pakistani Supreme Court and High Court judgments.
          - Provide the full citation: Petitioner v Respondent, [Year] [Reporter] [Page] — e.g., 2006 SCMR 129.

      - LANGUAGE PRECISION — NO VAGUE PHRASES:
          - FORBIDDEN words: "may", "might", "could", "possibly", "perhaps".
          - REQUIRED: Give a definitive legal position in every conclusion. Examples:
              - "This is primarily a civil dispute."
              - "Criminal liability is unlikely unless initial dishonest intent is proven at the inception."
              - "Courts are likely to treat this as a breach of contract, not fraud."
              - "The FIR, if registered, is susceptible to quashing under Section 561-A CrPC."

      RESPONSE STRUCTURE (MANDATORY):
      
      ### 1. Initial Summary
         - Open with the formal governing framework preamble.
         - Clearly state upfront: Is this a civil dispute, a criminal matter, or both? Give a definitive answer.

      ### 2. Primary Legal Finding
         - Apply the "initial dishonest intent" test directly to the facts.
         - Distinguish clearly: investment vs. entrustment; breach of contract vs. criminal fraud.
         - State the finding conclusively — do not hedge.

      ### 3. Applicable Statutes
         - For each relevant law, use <law-statute> tags with a Google Scholar search URL.
         - PROVIDE VERBATIM QUOTES inside <law-details> tags.

      ### 4. Relevant Judgments
         - MANDATORY: Cite at least one real, verified Pakistani Supreme Court or High Court judgment relevant to:
             a. Civil vs. criminal distinction (e.g., 2006 SCMR 129 or similar)
             b. Initial dishonest intent requirement
             c. Investment vs. entrustment (where applicable)
         - Use <law-statute> tags for the citation. Provide ratio decidendi inside <law-details> tags.
         - NO "no precedent" disclaimers. You must cite real case law.

      ### 5. Legal Test / Key Determination
         - Apply the following three-step test to the facts:
             1. **Nature of Transaction**: Is this an investment (profit-sharing) or an entrustment (agency/trust)?
             2. **Initial Dishonest Intent**: Was there dishonest intent AT THE TIME of receiving the funds? (Not later.)
             3. **Legal Conclusion** (ONE of the following — be definitive):
                - "**This is a civil dispute.** The appropriate remedy is a civil suit for recovery."
                - "**Criminal liability exists** because initial dishonest intent is established by [reason]."
                - "**This is primarily civil**, but criminal proceedings are conditionally available if [specific condition]."
         - Wrap the detailed reasoning inside <law-details> tags.

      ### 6. Analysis and Advisory
         - Focus on applying law to the specific facts — not general legal explanations.
         - For each point, answer: "What does this mean for the client? What will the court likely do?"
         - Structure as:
             a. **Primary Remedy** — Civil (e.g., Suit for Recovery under CPC 1908).
             b. **Conditional Criminal Remedy** — Only if initial dishonest intent is clearly established.
             c. **Evidence Strategy** — Strength of digital evidence (WhatsApp, messages), with reference to Articles 164 & 46-A Qanun-e-Shahadat 1984.
         - Wrap lengthy advisory details inside <law-details> tags.
         - Wrap specific penalties/remedies in <law-penalty> tags.

      ### 7. Risk Assessment
         - Provide a clear, honest assessment (no hedging):
             - **Civil Suit Success Rate**: High / Medium / Low — and why.
             - **Criminal Prosecution Risk**: State whether an FIR is likely to be quashed and under what circumstances.
             - **Evidence Strength**: Assess the specific evidence mentioned (e.g., WhatsApp screenshots, agreements) and their admissibility.
             - **Strategic Recommendation**: One clear, actionable recommendation for the best course of action.

      ### 8. Reference Links & Sources
         - Provide a clean list of all real statutes cited using ONLY these verified official links:
           - Pakistan Penal Code 1860: [Pakistan Penal Code 1860](https://www.fmu.gov.pk/docs/laws/Pakistan%20Penal%20Code.pdf)
           - Constitution of Pakistan 1973: [Constitution of Pakistan 1973](https://na.gov.pk/uploads/documents/1333523681_951.pdf)
           - Anti-Rape Act 2021: [Anti-Rape (Investigation and Trial) Act 2021](https://pakistancode.gov.pk/)
           - PECA 2016: [Prevention of Electronic Crimes Act 2016](https://pakistancode.gov.pk/)
           - For case law searches: [Google Scholar - Pakistan Cases](https://scholar.google.com/scholar?q=Pakistan+Supreme+Court+judgment)
         - Use ONLY these links above. DO NOT invent any other URLs.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Error, attempting secondary cloud fallback (Groq):", error.message);

    try {
      // GROQ CLOUD FALLBACK
      if (process.env.GROQ_API_KEY) {
        console.log("Calling Groq Cloud API...");
        const groqResponse = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a Senior Legal Expert in the Laws of Pakistan. Use the following structure:
              1. Initial Summary
              2. Primary Legal Finding (Apply Initial Dishonest Intent test)
              3. Applicable Statutes (Use <law-statute> and <law-details> tags)
              4. Relevant Judgments (MANDATORY: Cite at least one real Pakistani judgment)
              5. Legal Test / Key Determination
              6. Analysis and Advisory (Use <law-penalty> and <law-details> tags)
              7. Risk Assessment
              8. Reference Links & Sources`
            },
            {
              role: "user",
              content: `Context from database: ${context}\n\nUser Question: ${userMessage}\n\nPlease generate a detailed response following all Pakistani legal principles and the mandatory structure.`
            }
          ]
        }, {
          headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 20000
        });

        if (groqResponse.data?.choices?.[0]?.message?.content) {
          return `⚠️ *Gemini Down: Response generated by Llama 3* \n\n ${groqResponse.data.choices[0].message.content}`;
        }
      }
      throw new Error("Groq key missing or empty response");
    } catch (groqError) {
      console.error("Groq Fallback Error, attempting local fallback:", groqError.message);

      try {
        // OLLAMA LOCAL FALLBACK (Final AI attempt)
        // Trying localhost for better Windows compatibility
        const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
        const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma2:2b";

        console.log(`Calling local Ollama model: ${OLLAMA_MODEL} at ${OLLAMA_URL}...`);

        const response = await axios.post(OLLAMA_URL, {
          model: OLLAMA_MODEL,
          prompt: `[PAKISTANI LAW ASSISTANT - OFFLINE]
        Using only the text below, answer the question in English. Do not cite international cases.
        
        LAW TEXT: ${context}
        QUESTION: ${userMessage}
        ANSWER:`,
          stream: false,
        }, { timeout: 90000 });

        if (response.data && response.data.response) {
          return `⚠️ *Offline Mode: Answer generated by local ${OLLAMA_MODEL}* \n\n ${response.data.response}`;
        }

        throw new Error("Empty response from Ollama");
      } catch (ollamaError) {
        console.error("Local Fallback Error:", ollamaError.message);

        // TRIPLE FAIL-SAFE: If both AIs fail, return the raw data retrieved from the database
        if (context && context.trim() !== "" && context !== "No local context available.") {
          return `⚠️ *System Note: AI services are currently offline. Here is the direct legal information retrieved from our database:* \n\n ${context}`;
        }

        return `Error: Both AI services are currently unavailable.
      
1. Gemini Cloud: ${error.message}
2. Local Backup (Ollama): ${ollamaError.message}

Please ensure the Ollama application is running on your computer if you are offline.`;
      }
    }
  }
};

const generateLegalDocument = async (docType, userInputs) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


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

const generateVideoSummary = async (videoTitle, videoDescription, channelName) => {
  const prompt = `You are a legal research assistant for busy Pakistani lawyers. A lawyer needs a QUICK, SCANNABLE summary of a legal education video.

VIDEO: ${videoTitle}
CHANNEL: ${channelName || 'Unknown'}
DESCRIPTION: ${videoDescription || 'No description.'}

Generate a summary using EXACTLY this format. Keep each bullet to ONE short sentence. Maximum 200 words total.

## Quick Summary
One sentence overview of what this video covers.

## Key Points
- Point 1
- Point 2
- Point 3
- Point 4

## Relevant Statutes
- Statute Name — Section X: Brief relevance
- Statute Name — Section Y: Brief relevance

## Actionable Takeaways
- Takeaway 1
- Takeaway 2
- Takeaway 3

STRICT RULES:
- Keep bullets SHORT (max 15 words each)
- Maximum 5 bullets per section
- Focus on Pakistani law context
- NO long paragraphs — bullets ONLY
- NO asterisks for bold — use plain text
- Total output must be under 200 words`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Video Summary Error, trying Groq fallback:", error.message);

    try {
      if (process.env.GROQ_API_KEY) {
        const groqResponse = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a legal assistant for Pakistani lawyers. Generate VERY concise video summaries. Use short bullet points (max 15 words each). Sections: Quick Summary, Key Points, Relevant Statutes, Actionable Takeaways. Max 200 words total. No paragraphs."
            },
            {
              role: "user",
              content: `Summarize this legal video in short bullets:\nTitle: ${videoTitle}\nChannel: ${channelName || 'Unknown'}\nDescription: ${videoDescription || 'No description.'}`
            }
          ]
        }, {
          headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 20000
        });

        if (groqResponse.data?.choices?.[0]?.message?.content) {
          return groqResponse.data.choices[0].message.content;
        }
      }
      throw new Error("Groq fallback failed");
    } catch (groqError) {
      console.error("Groq Video Summary Fallback Error:", groqError.message);
      throw new Error(`AI Summary unavailable: ${error.message}`);
    }
  }
};

const analyzeCaseRequest = async (requestData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an AI Legal Intake Specialist for a Pakistani Law Portal.
    Analyze the following case request details and provide a structured JSON response.

    Case Title: ${requestData.title}
    Description: ${requestData.description}
    Category (provided by user): ${requestData.category || 'Not specified'}
    Location: ${requestData.location}

    Your analysis must include:
    1. predictedCategory: Choose the most relevant legal domain (e.g., Criminal Law, Property Law, Family Law, Cyber Crime, Corporate Law, Civil Law).
    2. predictedPriority: Detect the urgency level (urgent, normal, high risk).
    3. aiSummary: Convert the long description into a 1-2 sentence professional legal summary.
    4. aiKeywords: List 3-5 relevant legal keywords.

    Output ONLY the JSON object. Example:
    {
      "predictedCategory": "Property Law",
      "predictedPriority": "high risk",
      "aiSummary": "Inheritance-related property dispute involving unlawful occupation of land by a relative.",
      "aiKeywords": ["Inheritance", "Property Dispute", "Encroachment"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Attempt to extract JSON if there's markdown formatting
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini AI Analysis Error:", error);
    // Return fallback analysis if AI fails
    return {
      predictedCategory: requestData.category || "General Law",
      predictedPriority: "normal",
      aiSummary: requestData.description.substring(0, 100) + "...",
      aiKeywords: ["Legal Request"]
    };
  }
};

module.exports = {
  getChatResponse,
  generateLegalDocument,
  refineLegalDocument,
  generateVideoSummary,
  analyzeCaseRequest,
};
