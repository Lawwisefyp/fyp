

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");


const PPC_FILE = path.join(__dirname, "ppc 1860.txt");
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
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
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




const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function parseSections(rawText) {
  const lines = rawText.split(/\r?\n/);
  const sections = [];

 
  const sectionStart = /^(\d+[\w-]*)\.\s+(.+)/;

 
  const chapterHeader = /^CHAPTER\s+/i;

  let currentChapter = "Introduction";
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (chapterHeader.test(trimmed)) {
      currentChapter = trimmed;
      continue;
    }

    const match = trimmed.match(sectionStart);
    if (match) {
      
      if (currentSection) {
        currentSection.content = currentSection.content.trim();
        if (currentSection.content.length > 20) {
          sections.push(currentSection);
        }
      }

    
      currentSection = {
        id: `ppc_section_${match[1].toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        sectionNumber: match[1],
        title: match[2].trim(),
        chapter: currentChapter,
        content: `Section ${match[1]}: ${match[2].trim()}\n`,
      };
    } else if (currentSection && trimmed.length > 0) {
      
      currentSection.content += trimmed + "\n";
    }
  }

  
  if (currentSection) {
    currentSection.content = currentSection.content.trim();
    if (currentSection.content.length > 20) {
      sections.push(currentSection);
    }
  }

  return sections;
}


async function embedTexts(texts) {
  return await geminiEmbeddingFunction.generate(texts);
}


async function main() {
  console.log("📖 Reading PPC file...");
  if (!fs.existsSync(PPC_FILE)) {
    console.error(`❌ File not found: ${PPC_FILE}`);
    process.exit(1);
  }
  const rawText = fs.readFileSync(PPC_FILE, "utf-8");

  console.log("✂️  Parsing sections...");
  const sections = parseSections(rawText);
  console.log(`   Found ${sections.length} sections.`);

  console.log("🗃️  Connecting to Chroma DB...");
  const collection = await chroma.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: geminiEmbeddingFunction,
  });

  const existingCount = await collection.count();
  console.log(
    `   Collection "${COLLECTION_NAME}" currently has ${existingCount} documents.`,
  );

  console.log(`🚀 Starting ingestion in batches of ${BATCH_SIZE}...`);
  let ingested = 0;
  let skipped = 0;

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);

  
    const texts = batch.map((s) => s.content);
    const ids = batch.map((s) => s.id);
    const metadatas = batch.map((s) => ({
      source: "Pakistan Penal Code 1860",
      section: s.sectionNumber,
      title: s.title,
      chapter: s.chapter,
    }));

    try {
      console.log(
        `   Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(sections.length / BATCH_SIZE)} ` +
          `(sections ${batch[0].sectionNumber}–${batch[batch.length - 1].sectionNumber})...`,
      );

      const embeddings = await embedTexts(texts);

      await collection.upsert({
        ids,
        embeddings,
        documents: texts,
        metadatas,
      });

      ingested += batch.length;
      console.log(`   ✅ Upserted ${ingested}/${sections.length} sections.`);
    } catch (err) {
      console.error(
        `   ❌ Error on batch starting at section ${batch[0].sectionNumber}:`,
        err.message,
      );
      skipped += batch.length;
    }

    
    if (i + BATCH_SIZE < sections.length) {
      await sleep(4500); 
    }
  }

  const finalCount = await collection.count();
  console.log("\n🎉 Ingestion complete!");
  console.log(`   Ingested : ${ingested} sections`);
  console.log(`   Skipped  : ${skipped} sections`);
  console.log(`   Total docs in collection: ${finalCount}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
