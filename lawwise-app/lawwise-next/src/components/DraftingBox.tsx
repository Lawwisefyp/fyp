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

const partyFields = (roleId: string, displayName?: string): Field[] => {
  const prefix = (displayName || roleId).charAt(0).toUpperCase() + (displayName || roleId).slice(1);
  return [
    { name: `${roleId}Name`, label: `${prefix} Full Name`, placeholder: `Full Name`, type: "text" },
    { name: `${roleId}Address`, label: `${prefix} Address`, placeholder: "Address Details", type: "text", optional: true },
    { name: `${roleId}ID`, label: `${prefix} ID / Reference`, placeholder: `CNIC or Reg No.`, type: "text", optional: true },
  ];
};

const DOC_CATEGORIES = [
  {
    label: "A. Pre-Litigation Documents",
    items: ["Legal Notice", "Affidavit", "Undertaking", "Agreement"]
  },
  {
    label: "B. Civil Court Documents",
    items: ["Plaint", "Written Statement", "CMA", "Affidavit in Evidence"]
  },
  {
    label: "C. Criminal Law Documents",
    items: ["Bail Application", "Criminal Complaint", "FIR format"]
  },
  {
    label: "D. Constitutional / High Court",
    items: ["Writ Petition"]
  },
  {
    label: "E. Property & Business Documents",
    items: ["Sale Agreement", "Rent Agreement", "Power of Attorney", "Partnership Deed"]
  }
];

const docConfig: Record<string, DocSection[]> = {
  "Legal Notice": [
    { title: "Sender", icon: <UserIcon size={15} />, fields: partyFields("sender") },
    { title: "Receiver", icon: <Building2 size={15} />, fields: partyFields("receiver") },
    {
      title: "Notice Details", icon: <FileText size={15} />, fields: [
        { name: "matter", label: "Subject", placeholder: "Subject of Notice", type: "text" },
    { name: "details", label: "Background & Facts", placeholder: "Incident details...", type: "textarea" },
    { name: "finalWarning", label: "Demand / Warning", placeholder: "Final ultimatum...", type: "textarea" },
      ]
    },
  ],
  "Affidavit": [
    { title: "Deponent", icon: <UserIcon size={15} />, fields: partyFields("deponent") },
    {
      title: "Affidavit Content", icon: <FileCheck size={15} />, fields: [
        { name: "headingJurisdiction", label: "Jurisdiction / Before Whom", placeholder: "Court / Office name", type: "text" },
    { name: "details", label: "Declaration Statements", placeholder: "Statements of facts...", type: "textarea" },
    { name: "witnessInfo", label: "Witness Info", placeholder: "Witness details", type: "textarea", optional: true },
      ]
    },
  ],
  "Undertaking": [
    { title: "Parties", icon: <UserIcon size={15} />, fields: [...partyFields("undertaker", "Undertaker"), ...partyFields("recipient", "Recipient")] },
    {
      title: "Terms", icon: <FileCheck size={15} />, fields: [
        { name: "terms", label: "Terms of Undertaking", placeholder: "Terms...", type: "textarea" },
    { name: "liability", label: "Liability / Consequences", placeholder: "Consequences of breach", type: "textarea", optional: true },
      ]
    },
  ],
  "Agreement": [
    { title: "Party A", icon: <UserIcon size={15} />, fields: partyFields("partyA", "Party A") },
    { title: "Party B", icon: <Building2 size={15} />, fields: partyFields("partyB", "Party B") },
    {
      title: "Contract Terms", icon: <FileCheck size={15} />, fields: [
        { name: "purpose", label: "Purpose", placeholder: "Purpose of agreement", type: "text" },
    { name: "financials", label: "Financial Terms", placeholder: "Amount/Payment terms", type: "text" },
    { name: "duration", label: "Duration", placeholder: "Effective date & period", type: "text" },
    { name: "arbitration", label: "Arbitration / Dispute", placeholder: "Dispute resolution clause", type: "textarea", optional: true },
      ]
    },
  ],
  "Plaint": [
    {
      title: "Court & Parties", icon: <Gavel size={15} />, fields: [
        { name: "court", label: "Court Name", placeholder: "Full court name", type: "text" },
        ...partyFields("plaintiff"),
        ...partyFields("defendant"),
      ]
    },
    {
      title: "Legal Details", icon: <FileText size={15} />, fields: [
        { name: "facts", label: "Facts of the Case", placeholder: "Facts of dispute...", type: "textarea" },
        { name: "causeOfAction", label: "Cause of Action", placeholder: "When/where action arose...", type: "textarea" },
        { name: "jurisdiction", label: "Jurisdiction Paragraph", placeholder: "Legal jurisdiction...", type: "textarea" },
        { name: "valuation", label: "Valuation of Suit", placeholder: "Value for court fee", type: "text" },
        { name: "relief", label: "Relief / Prayer", placeholder: "Relief sought...", type: "textarea" },
      ]
    },
  ],
  "Written Statement": [
    {
      title: "Court & Parties", icon: <Gavel size={15} />, fields: [
        { name: "court", label: "Court Name", placeholder: "Full court name", type: "text" },
        ...partyFields("plaintiff"),
        ...partyFields("defendant"),
      ]
    },
    {
      title: "Response", icon: <FileText size={15} />, fields: [
        { name: "preliminaryObjections", label: "Preliminary Objections", placeholder: "Objections...", type: "textarea" },
        { name: "paragraphReply", label: "Paragraph-wise Reply", placeholder: "Reply to paragraphs...", type: "textarea" },
        { name: "prayer", label: "Prayer", placeholder: "Dismissal request...", type: "textarea" },
      ]
    },
  ],
  "CMA": [
    {
      title: "Case Details", icon: <Gavel size={15} />, fields: [
        { name: "court", label: "Court Name", placeholder: "Court office", type: "text" },
        { name: "caseNo", label: "Case Number", placeholder: "Case number/year", type: "text" },
        ...partyFields("applicant", "Applicant"),
        ...partyFields("respondent", "Respondent"),
      ]
    },
    {
      title: "Application", icon: <FileText size={15} />, fields: [
        { name: "purpose", label: "Purpose / Relief", placeholder: "Application purpose", type: "text" },
        { name: "grounds", label: "Grounds / Facts", placeholder: "Factual grounds...", type: "textarea" },
        { name: "prayer", label: "Prayer", placeholder: "Prayer...", type: "textarea" },
      ]
    },
  ],
  "Affidavit in Evidence": [
    { title: "Deponent Info", icon: <UserIcon size={15} />, fields: partyFields("deponent") },
    {
      title: "Case Info", icon: <Gavel size={15} />, fields: [
        { name: "court", label: "Court Name", placeholder: "Full court name", type: "text" },
        { name: "caseTitle", label: "Case Title (A vs B)", placeholder: "Party names", type: "text" },
      ]
    },
    {
      title: "Statements", icon: <FileCheck size={15} />, fields: [
        { name: "statements", label: "Factual Statements", placeholder: "Your statements...", type: "textarea" },
      ]
    },
  ],
  "Bail Application": [
    {
      title: "Case Details", icon: <Gavel size={15} />, fields: [
        { name: "court", label: "Court Name", placeholder: "e.g. Session Court", type: "text" },
        { name: "firNo", label: "FIR Number", placeholder: "e.g. 123/24", type: "text" },
        { name: "station", label: "Police Station", placeholder: "e.g. North Cantonment", type: "text" },
        { name: "offences", label: "Offences (Sections)", placeholder: "e.g. 302/34 PPC", type: "text" },
        ...partyFields("applicant"),
      ]
    },
    {
      title: "Grounds", icon: <FileText size={15} />, fields: [
        { name: "grounds", label: "Grounds for Bail", placeholder: "Factual grounds...", type: "textarea" },
        { name: "prayer", label: "Prayer", placeholder: "Bail request...", type: "textarea" },
      ]
    },
  ],
  "Criminal Complaint": [
    {
      title: "Parties", icon: <Gavel size={15} />, fields: [
        { name: "court", label: "Court Name", placeholder: "e.g. Judicial Magistrate", type: "text" },
        ...partyFields("complainant"),
        ...partyFields("accused"),
      ]
    },
    {
      title: "Incident", icon: <FileText size={15} />, fields: [
        { name: "offenceFacts", label: "Facts of Offence", placeholder: "Offence details...", type: "textarea" },
        { name: "prayer", label: "Prayer", placeholder: "Summoning request...", type: "textarea" },
      ]
    },
  ],
  "FIR format": [
    {
      title: "Basics", icon: <Building2 size={15} />, fields: [
        { name: "station", label: "Police Station", placeholder: "Station name", type: "text" },
        { name: "district", label: "District", placeholder: "District name", type: "text" },
        { name: "informant", label: "Informant Name", placeholder: "Informant's name", type: "text" },
      ]
    },
    {
      title: "Occurrence", icon: <FileText size={15} />, fields: [
        { name: "occurrenceDetails", label: "Details of Occurrence", placeholder: "Time, place, event...", type: "textarea" },
        { name: "accusedDescription", label: "Accused Description", placeholder: "Physical features...", type: "textarea", optional: true },
      ]
    },
  ],
  "Writ Petition": [
    {
      title: "Court & Parties", icon: <Gavel size={15} />, fields: [
        { name: "highCourt", label: "High Court (e.g. Lahore)", placeholder: "Court branch", type: "text" },
        ...partyFields("petitioner"),
        ...partyFields("respondents"),
      ]
    },
    {
      title: "Grounds", icon: <FileText size={15} />, fields: [
        { name: "facts", label: "Facts giving rise to Petition", placeholder: "Relevant facts...", type: "textarea" },
        { name: "grounds", label: "Legal Grounds", placeholder: "Legal grounds...", type: "textarea" },
        { name: "relief", label: "Relief Sought", placeholder: "Relief details...", type: "textarea" },
      ]
    },
  ],
  "Sale Agreement": [
    { title: "Parties", icon: <UserIcon size={15} />, fields: [...partyFields("seller", "Seller"), ...partyFields("buyer", "Buyer")] },
    {
      title: "Property & Price", icon: <Building2 size={15} />, fields: [
        { name: "propertyDetails", label: "Property Details", placeholder: "Area, boundaries, address...", type: "textarea" },
        { name: "price", label: "Consideration Price", placeholder: "e.g. PKR 1,000,000", type: "text" },
        { name: "paymentTerms", label: "Payment Terms", placeholder: "Installments, token money...", type: "textarea" },
      ]
    },
  ],
  "Rent Agreement": [
    { title: "Parties", icon: <UserIcon size={15} />, fields: [...partyFields("landlord", "Landlord"), ...partyFields("tenant", "Tenant")] },
    {
      title: "Property & Rent", icon: <Building2 size={15} />, fields: [
        { name: "propertyDetails", label: "Property Details", placeholder: "Shop No. 1, Block A...", type: "textarea" },
        { name: "rent", label: "Monthly Rent", placeholder: "e.g. PKR 25,000", type: "text" },
        { name: "deposit", label: "Security Deposit", placeholder: "e.g. PKR 50,000", type: "text" },
        { name: "period", label: "Agreement Period", placeholder: "e.g. 11 months", type: "text" },
      ]
    },
  ],
  "Power of Attorney": [
    { title: "Parties", icon: <UserIcon size={15} />, fields: [...partyFields("principal", "Principal"), ...partyFields("attorney", "Attorney")] },
    {
      title: "Powers", icon: <FileCheck size={15} />, fields: [
        { name: "powers", label: "Powers Granted", placeholder: "To sell, to appear in court, etc.", type: "textarea" },
        { name: "terms", label: "Special Terms / Duration", placeholder: "Specific conditions if any...", type: "textarea", optional: true },
      ]
    },
  ],
  "Partnership Deed": [
    { title: "Business Info", icon: <Building2 size={15} />, fields: [
      { name: "firmName", label: "Firm Name", placeholder: "e.g. ABC Associates", type: "text" },
      { name: "nature", label: "Nature of Business", placeholder: "e.g. Trading and Services", type: "text" },
    ] },
    {
      title: "Terms", icon: <FileCheck size={15} />, fields: [
        { name: "partners", label: "Partners & Contributions", placeholder: "Partner names & shares", type: "textarea" },
        { name: "profitSharing", label: "Profit / Loss Sharing", placeholder: "Sharing ratio/terms", type: "text" },
        { name: "dissolution", label: "Dissolution Terms", placeholder: "Termination terms...", type: "textarea", optional: true },
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
  const [docType, setDocType] = useState("Legal Notice");
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
        </div>
      </div>

      {/* ── Doc Type Category Selection ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 28px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Select Document Category:</span>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 400,
            padding: "10px 16px",
            borderRadius: 12,
            border: "1.5px solid #e2e8f0",
            background: "white",
            color: "#0f172a",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            outline: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            transition: "all 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#c19651")}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        >
          {DOC_CATEGORIES.map((cat) => (
            <optgroup key={cat.label} label={cat.label}>
              {cat.items.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c19651" }}></div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{docType}</span>
        </div>
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
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#c19651", textTransform: "uppercase", letterSpacing: "0.1em" }}>Optional</span>
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
