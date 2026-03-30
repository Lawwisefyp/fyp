require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");


const PPC_FILE = path.join(__dirname, "ppc 1860.txt");
const CONSTITUTION_FILE = path.join(__dirname, "THE CONSTITUTION OF THE ISLAMIC REP.txt");
const COLLECTION_NAME = "legal_kb";
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const BATCH_SIZE = 10; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chroma = new ChromaClient({ host: "localhost", port: 8000 });


const geminiEmbeddingFunction = {
  generate: async (texts) => {
    try {
      const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = ai.getGenerativeModel({ model: "gemini-embedding-001" });
      const results = await Promise.all(
        texts.map((text) => model.embedContent(text)),
      );
      return results.map((r) => r.embedding.values);
    } catch (error) {
      console.error("Gemini Embedding Error:", error.message);
      return texts.map(() => new Array(3072).fill(0));
    }
  },
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));



function parsePPC(rawText) {
  const lines = rawText.split(/\r?\n/);
  const sections = [];
  const sectionStart = /^(\d+[\w-]*)\.\s+(.+)/;
  const chapterHeader = /^CHAPTER\s+/i;
  let currentChapter = "Introduction";
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (chapterHeader.test(trimmed)) { currentChapter = trimmed; continue; }
    const match = trimmed.match(sectionStart);
    if (match) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        id: `ppc_section_${match[1].toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        number: match[1],
        title: match[2].trim(),
        chapter: currentChapter,
        content: `Section ${match[1]}: ${match[2].trim()}\n`,
      };
    } else if (currentSection && trimmed.length > 0) {
      currentSection.content += trimmed + "\n";
    }
  }
  if (currentSection) sections.push(currentSection);
  return sections;
}

function parseConstitution(rawText) {
  const lines = rawText.split(/\r?\n/);
  const articles = [];
  const articleStart = /^\[?(\d+[A-Z]*)\.?\s+([^._\n]+)/;
  let currentPart = "Introductory";
  let currentChapter = "";
  let currentArticle = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.match(/^Page \d+ of \d+/i)) continue;
    if (trimmed.startsWith("PART ")) { currentPart = trimmed; continue; }
    if (trimmed.startsWith("CHAPTER ")) { currentChapter = trimmed; continue; }
    const match = trimmed.match(articleStart);
    if (match && trimmed.length > 20) {
      if (currentArticle) articles.push(currentArticle);
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
  console.log("🔥 Reseting Collection...");
  try {
    await chroma.deleteCollection({ name: COLLECTION_NAME });
    console.log("   ✅ Deleted old collection.");
  } catch (e) {
    console.log("   ⚠️ No existing collection to delete.");
  }

 
  const collection = await chroma.createCollection({ 
    name: COLLECTION_NAME,
    embeddingFunction: geminiEmbeddingFunction
  });

  const files = [
    { name: "PPC 1860", path: PPC_FILE, parser: parsePPC, source: "Pakistan Penal Code 1860" },
    { name: "Constitution 1973", path: CONSTITUTION_FILE, parser: parseConstitution, source: "Constitution of Pakistan 1973" }
  ];

  for (const file of files) {
    console.log(`📖 Processing ${file.name}...`);
    if (!fs.existsSync(file.path)) {
        console.error(`❌ File not found: ${file.path}`);
        continue;
    }
    const rawText = fs.readFileSync(file.path, "utf-8");
    const docs = file.parser(rawText);
    
    
    const idCounts = {};
    for (const doc of docs) {
      if (idCounts[doc.id]) {
        idCounts[doc.id]++;
        doc.id = `${doc.id}_dup_${idCounts[doc.id]}`;
      } else {
        idCounts[doc.id] = 1;
      }
    }
    
    console.log(`   Found ${docs.length} units.`);

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      const texts = batch.map((d) => d.content);
      const ids = batch.map((d) => d.id);
      const metadatas = batch.map((d) => ({
        source: file.source,
        number: d.number,
        title: d.title,
        chapter: d.chapter || "",
        part: d.part || "",
      }));

      console.log(`   [${file.name}] Ingesting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(docs.length / BATCH_SIZE)}...`);
      const embeddings = await geminiEmbeddingFunction.generate(texts);
      await collection.upsert({ ids, embeddings, documents: texts, metadatas });

    
      if (i + BATCH_SIZE < docs.length) await sleep(5000);
    }
  }

  console.log("\n🎉 Rebuild Complete!");
}

main().catch(console.error);
