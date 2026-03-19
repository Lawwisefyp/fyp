const express = require("express");
const router = express.Router();
const {
  generateLegalDocument,
  refineLegalDocument,
} = require("../services/aiService");
const { Document, Packer, Paragraph, TextRun } = require("docx");

router.post("/refine", async (req, res) => {
  const { originalContent, instruction, docType } = req.body;

  if (!originalContent || !instruction || !docType) {
    return res.status(400).json({
      error: "originalContent, instruction, and docType are required",
    });
  }

  try {
    const content = await refineLegalDocument(
      originalContent,
      instruction,
      docType,
    );
    res.json({ content });
  } catch (error) {
    console.error("Refine API Error:", error);
    res.status(500).json({ error: "Failed to refine document" });
  }
});

router.post("/", async (req, res) => {
  const { docType, userInputs } = req.body;

  if (!docType || !userInputs) {
    return res
      .status(400)
      .json({ error: "docType and userInputs are required" });
  }

  try {
    const content = await generateLegalDocument(docType, userInputs);
    res.json({ content });
  } catch (error) {
    console.error("Draft API Error:", error);
    res.status(500).json({ error: "Failed to generate document" });
  }
});

router.post("/download", async (req, res) => {
  const { content, title } = req.body;

  // Basic markdown to DOCX parser
  const paragraphs = content.split("\n").map((line) => {
    // If empty line, just return an empty paragraph for spacing
    if (!line.trim()) return new Paragraph({ children: [new TextRun("")] });

    // Parse **bold** syntax into segmented TextRuns
    const runs = [];
    const parts = line.split(/(\*\*.*?\*\*)/g);

    parts.forEach((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
      } else if (part) {
        runs.push(new TextRun({ text: part }));
      }
    });

    return new Paragraph({ children: runs });
  });

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  const buffer = await Packer.toBuffer(doc);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${title || "document"}.docx`,
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  res.send(buffer);
});

module.exports = router;
