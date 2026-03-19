"use client";

import React, { useState, useEffect } from "react";
import {
  FileText, Download, Loader2, Plus, Info,
  User as UserIcon, Building2, Gavel, FileCheck, Bot, Zap
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type FieldType = "text" | "textarea";
interface Field { name: string; label: string; placeholder: string; type?: FieldType; optional?: boolean; }
interface DocSection { title: string; icon: React.ReactNode; fields: Field[]; }

const partyFields = (role: string): Field[] => [
  { name: `${role}Name`, label: "Full Name", placeholder: "e.g. Muhammad Usman", type: "text" },
  { name: `${role}Address`, label: "Address", placeholder: "Street, City", type: "text", optional: true },
  { name: `${role}ID`, label: "ID / Reference", placeholder: "e.g. National ID or Reg No.", type: "text", optional: true },
];

const docConfig: Record<string, DocSection[]> = {
  "Legal Notice": [
    { title: "Sender", icon: <UserIcon size={15} />, fields: partyFields("sender") },
    { title: "Receiver", icon: <Building2 size={15} />, fields: partyFields("receiver") },
    {
      title: "Notice Details", icon: <FileText size={15} />, fields: [
        { name: "matter", label: "Subject", placeholder: "e.g. Recovery of Outstanding Dues", type: "text" },
        { name: "details", label: "Background & Facts", placeholder: "Describe the incident or legal violation...", type: "textarea" },
        { name: "finalWarning", label: "Demand / Warning", placeholder: "If demands are not met within 15 days...", type: "textarea" },
      ]
    },
  ],
  Contract: [
    { title: "Party A", icon: <UserIcon size={15} />, fields: partyFields("partyA") },
    { title: "Party B", icon: <Building2 size={15} />, fields: partyFields("partyB") },
    {
      title: "Contract Terms", icon: <FileCheck size={15} />, fields: [
        { name: "financials", label: "Financial Terms", placeholder: "e.g. USD 5,000 monthly", type: "text" },
        { name: "duration", label: "Duration", placeholder: "e.g. 1 Jan 2024 for 2 years", type: "text" },
        { name: "liability", label: "Liability / Indemnification", placeholder: "Party B shall indemnify...", type: "textarea", optional: true },
        { name: "arbitration", label: "Arbitration / Dispute", placeholder: "Any dispute shall be referred to...", type: "textarea", optional: true },
      ]
    },
  ],
  Petition: [
    {
      title: "Court & Parties", icon: <Gavel size={15} />, fields: [
        { name: "court", label: "Court Name", placeholder: "e.g. High Court of Justice", type: "text" },
        ...partyFields("petitioner"),
        ...partyFields("respondent"),
      ]
    },
    {
      title: "Legal Grounds", icon: <FileText size={15} />, fields: [
        { name: "legalGrounds", label: "Cause of Action", placeholder: "That the respondent has failed to...", type: "textarea" },
        { name: "reliefDetails", label: "Relief Sought", placeholder: "It is prayed that...", type: "textarea" },
      ]
    },
  ],
  Affidavit: [
    { title: "Deponent", icon: <UserIcon size={15} />, fields: partyFields("deponent") },
    {
      title: "Affidavit Content", icon: <FileCheck size={15} />, fields: [
        { name: "headingJurisdiction", label: "Jurisdiction / Before Whom", placeholder: "Before the Notary Public...", type: "text" },
        { name: "details", label: "Declaration Statements", placeholder: "I solemnly affirm and declare that...", type: "textarea" },
        { name: "witnessInfo", label: "Witness Info", placeholder: "Identified by...", type: "textarea", optional: true },
      ]
    },
  ],
};

// Shared input style
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#f8fafc",
  border: "1.5px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 500,
  color: "#1e293b",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical" as const,
  minHeight: 90,
  lineHeight: 1.6,
};

export default function DraftingBox() {
  const docTypes = Object.keys(docConfig);
  const [docType, setDocType] = useState(docTypes[0]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [loading, setLoading] = useState(false);
  const [refinementText, setRefinementText] = useState("");
  const [refining, setRefining] = useState(false);

  useEffect(() => { setInputs({}); setGeneratedDoc(""); setRefinementText(""); }, [docType]);

  const handleInputChange = (name: string, value: string) =>
    setInputs((prev) => ({ ...prev, [name]: value }));

  const handleGenerate = async () => {
    setLoading(true); setGeneratedDoc("");
    try {
      const res = await axios.post("http://localhost:5001/api/draft", { docType, userInputs: inputs });
      setGeneratedDoc(res.data.content);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleRefine = async () => {
    if (!refinementText.trim()) return;
    setRefining(true);
    try {
      const res = await axios.post("http://localhost:5001/api/draft/refine", {
        originalContent: generatedDoc, instruction: refinementText, docType,
      });
      setGeneratedDoc(res.data.content);
      setRefinementText("");
    } catch { /* silent */ } finally { setRefining(false); }
  };

  const handleDownload = async () => {
    try {
      const res = await axios.post("http://localhost:5001/api/draft/download",
        { content: generatedDoc, title: `${docType}_${Date.now()}` },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${docType.replace(/ /g, "_")}.docx`);
      document.body.appendChild(link);
      link.click();
    } catch { /* silent */ }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", background: "#0f172a", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={19} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>AI Document Drafting</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>Professional Legal Instruments</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {generatedDoc && (
            <button
              onClick={handleDownload}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 16px", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em" }}
            >
              <Download size={14} />
              Download .docx
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(193,150,81,0.15)", border: "1px solid rgba(193,150,81,0.3)", borderRadius: 99, padding: "5px 12px" }}>
            <Zap size={11} color="#c19651" />
            <span style={{ fontSize: 10, fontWeight: 900, color: "#c19651", textTransform: "uppercase", letterSpacing: "0.2em" }}>Powered by RAG</span>
          </div>
        </div>
      </div>

      {/* ── Doc Type Tabs ── */}
      <div style={{ display: "flex", gap: 6, padding: "14px 28px", borderBottom: "1px solid #f1f5f9", background: "#fff", flexShrink: 0, overflowX: "auto" }}>
        {docTypes.map((t) => (
          <button
            key={t}
            onClick={() => setDocType(t)}
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              border: "1.5px solid",
              borderColor: docType === t ? "#0f172a" : "#e2e8f0",
              background: docType === t ? "#0f172a" : "transparent",
              color: docType === t ? "white" : "#64748b",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Body: Form + Preview ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden", minHeight: 0 }}>

        {/* LEFT: Form */}
        <div style={{ overflowY: "auto", padding: "24px 28px", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 28 }}>

          {docConfig[docType].map((section, sIdx) => (
            <div key={sIdx} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: "1.5px solid #f1f5f9" }}>
                <span style={{ color: "#c19651" }}>{section.icon}</span>
                <h3 style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#0f172a", margin: 0 }}>
                  {section.title}
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                {section.fields.map((field) => (
                  <div key={field.name} style={{ gridColumn: field.type === "textarea" ? "1 / -1" : "auto", display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#94a3b8" }}>
                        {field.label}
                      </label>
                      {field.optional && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.1em" }}>Optional</span>
                      )}
                    </div>
                    {field.type === "textarea" ? (
                      <textarea
                        value={inputs[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        style={textareaStyle}
                        onFocus={(e) => (e.target.style.borderColor = "#c19651")}
                        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                      />
                    ) : (
                      <input
                        type="text"
                        value={inputs[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = "#c19651")}
                        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || refining}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "16px",
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: loading || refining ? "not-allowed" : "pointer",
              opacity: loading || refining ? 0.7 : 1,
              transition: "all 0.15s",
              marginTop: 8,
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {loading ? "Generating..." : `Generate ${docType}`}
          </button>
        </div>

        {/* RIGHT: Preview */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

          {/* Preview header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <FileCheck size={16} color="#c19651" />
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", color: "#0f172a" }}>Document Preview</span>
          </div>

          {/* Preview content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", position: "relative" }}>

            <AnimatePresence>
              {!generatedDoc && !loading && !refining && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
                >
                  <FileText size={56} color="#e2e8f0" />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Fill the form and generate your document
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {(loading || refining) && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, zIndex: 20 }}>
                <Loader2 size={36} color="#c19651" className="animate-spin" />
                <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8" }}>
                  {refining ? "Refining document..." : "Generating draft..."}
                </p>
              </div>
            )}

            {generatedDoc && (
              <div
                style={{ fontSize: 14, lineHeight: 2, color: "#1e293b", fontFamily: "Georgia, serif", whiteSpace: "pre-wrap" }}
                className="prose prose-sm max-w-none"
              >
                {generatedDoc}
              </div>
            )}
          </div>

          {/* Refinement bar */}
          {generatedDoc && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ flexShrink: 0, borderTop: "1px solid #0F172A", padding: "16px 20px", background: "#fff" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Bot size={14} color="#c19651" />
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#0F172A" }}>
                  AI Refinement
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRefine()}
                  placeholder="e.g. Add a penalty clause for delays..."
                  style={{ ...inputStyle, flex: 1, height: 42 }}
                  onFocus={(e) => (e.target.style.borderColor = "#c19651")}
                  onBlur={(e) => (e.target.style.borderColor = "#0F172A")}
                />
                <button
                  onClick={handleRefine}
                  disabled={refining || !refinementText.trim()}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: refinementText.trim() && !refining ? "#c19651" : "#e2e8f0",
                    color: "white", border: "none", borderRadius: 10, padding: "0 18px",
                    fontSize: 12, fontWeight: 800, cursor: refinementText.trim() && !refining ? "pointer" : "not-allowed",
                    transition: "all 0.15s", letterSpacing: "0.05em", height: 42, whiteSpace: "nowrap",
                  }}
                >
                  {refining ? <Loader2 size={13} className="animate-spin" /> : <Info size={13} />}
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
