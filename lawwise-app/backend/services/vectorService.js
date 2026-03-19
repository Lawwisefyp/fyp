/**
 * vectorService.js
 * 
 * Handles interaction with Chroma DB and Google Gemini Embeddings.
 */
const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");


// server/services/vectorService.js
let chroma = null;
let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getChromaClient = () => {
  if (!chroma) {
    const CHROMA_URL = process.env.CHROMA_URL || "http://127.0.0.1:8000";
    const chromaUrl = new URL(CHROMA_URL);
    chroma = new ChromaClient({
      host: chromaUrl.hostname,
      port: parseInt(chromaUrl.port, 10) || 8000
    });
  }
  return chroma;
};

const geminiEmbeddingFunction = {
  generate: async (texts) => {
    try {
      const ai = getGenAI();
      const model = ai.getGenerativeModel({ model: "gemini-embedding-001" });
      const results = await Promise.all(
        texts.map((text) => model.embedContent(text)),
      );
      return results.map((r) => r.embedding.values);
    } catch (error) {
      console.error("Gemini Embedding Error:", error.message);
      return texts.map(() => new Array(768).fill(0));
    }
  },
};

const queryVectorStore = async (queryText, nResults = 5) => {
  try {
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({
      name: "legal_documents",
      embeddingFunction: geminiEmbeddingFunction,
    });

    const queryVectors = await geminiEmbeddingFunction.generate([queryText]);
    
    const results = await collection.query({
      queryEmbeddings: queryVectors,
      nResults: nResults,
    });

    return results.documents?.[0] || [];
  } catch (error) {
    console.error("Vector Store Query Error:", error.message);
    return [];
  }
};

module.exports = {
  queryVectorStore,
  geminiEmbeddingFunction,
  getChromaClient,
};
