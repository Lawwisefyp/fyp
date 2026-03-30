require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");


const CONSTITUTION_FILE = path.join(__dirname, "THE CONSTITUTION OF THE ISLAMIC REP.txt");
const COLLECTION_NAME = "legal_documents";
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const BATCH_SIZE = 5;


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chromaUrl = new URL(CHROMA_URL);
const chroma = new ChromaClient({ 
    host: chromaUrl.hostname,
    port: parseInt(chromaUrl.port, 10) || 8000
});

const geminiEmbeddingFunction = {
  generate: async (texts) => {
    try {
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const results = await Promise.all(
        texts.map((text) => model.embedContent({ 
            content: { parts: [{ text }] },
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: 3072
        })),
      );
      return results.map((r) => r.embedding.values);
    } catch (error) {
      console.error("Gemini Embedding Error:", error.message);
      return texts.map(() => new Array(768).fill(0));
    }
  },
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));


function parseArticles(rawText) {
  const lines = rawText.split(/\r?\n/);
  const articles = [];

 
  const articleStart = /^\[?(\d+[A-Z]*)\.?\s+([^._\n]+)/;
  
  let currentPart = "Introductory";
  let currentChapter = "";
  let currentArticle = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    
    if (trimmed.match(/^Page \d+ of \d+/i)) continue;

    
    if (trimmed.startsWith("PART ")) {
        currentPart = trimmed;
        continue;
    }
    if (trimmed.startsWith("CHAPTER ")) {
        currentChapter = trimmed;
        continue;
    }

    const match = trimmed.match(articleStart);
  
    if (match && trimmed.length > 20) { 
      if (currentArticle) {
        articles.push(currentArticle);
      }
      currentArticle = {
        id: `const_article_${match[1].toLowerCase()}`,
        number: match[1],
        title: match[2].trim(),
        part: currentPart,
        chapter: currentChapter,
        content: `Article ${match[1]}: ${trimmed}\n`,
      };
    } else if (currentArticle) {
      currentArticle.content += trimmed + " ";
    }
  }

  if (currentArticle) articles.push(currentArticle);
  return articles;
}

async function main() {
  console.log("📖 Reading Constitution file...");
  if (!fs.existsSync(CONSTITUTION_FILE)) {
    console.error(`❌ File not found: ${CONSTITUTION_FILE}`);
    process.exit(1);
  }
  const rawText = fs.readFileSync(CONSTITUTION_FILE, "utf-8");

  console.log("✂️  Parsing Articles...");
  const docs = parseArticles(rawText);
  console.log(`   Found ${docs.length} Articles.`);

  console.log("🗃️  Connecting to Chroma DB...");
  const collection = await chroma.getOrCreateCollection({
    name: COLLECTION_NAME
  });

  console.log(`🚀 Ingesting in batches of ${BATCH_SIZE}...`);
  let ingested = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const texts = batch.map((d) => d.content);
    const ids = batch.map((d) => d.id);
    const metadatas = batch.map((d) => ({
      source: "The Constitution of the Islamic Republic of Pakistan, 1973",
      article: d.number,
      title: d.title,
      part: d.part,
      chapter: d.chapter,
    }));

    try {
      console.log(`   Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(docs.length / BATCH_SIZE)}...`);
      const embeddings = await geminiEmbeddingFunction.generate(texts);

      await collection.upsert({
        ids,
        embeddings,
        documents: texts,
        metadatas,
      });

      ingested += batch.length;
      console.log(`   ✅ Ingested ${ingested}/${docs.length} articles.`);
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }

    if (i + BATCH_SIZE < docs.length) await sleep(4000);
  }

  console.log("\n🎉 Done!");
}

main().catch(console.error);
