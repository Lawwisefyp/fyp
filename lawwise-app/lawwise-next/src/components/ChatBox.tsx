"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Info, Scale, Zap, BookOpen, Shield, MessageSquare, Bot, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface Message {
  role: "user" | "ai";
  content: string;
  context?: {
    local: string[];
    external: {
      title: string;
      citation: string;
      snippet: string;
      url: string;
    }[];
  };
}

const CHIPS = [
  { icon: BookOpen, text: "Explain tenant rights and eviction laws" },
  { icon: Shield, text: "What constitutes a valid contract?" },
  { icon: MessageSquare, text: "How do I file a civil lawsuit?" },
  { icon: Scale, text: "Difference between civil and criminal law" },
];

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    inputRef.current?.focus();
    const newMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5001/api/chat", {
        message: trimmed,
        history: messages,
      });
      setMessages([...newMessages, { role: "ai", content: res.data.response, context: res.data.context }]);
    } catch {
      setMessages([...newMessages, { role: "ai", content: "I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: "1px solid #f1f5f9",
          background: "#0f172a",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Scale size={19} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
              Lawwise AI
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
              Legal Intelligence Assistant
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(193,150,81,0.15)",
            border: "1px solid rgba(193,150,81,0.3)",
            borderRadius: 99,
            padding: "5px 12px",
          }}
        >
          <Zap size={11} color="#c19651" />
          <span style={{ fontSize: 10, fontWeight: 900, color: "#c19651", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Powered by RAG
          </span>
        </div>
      </div>

      {/* ── Messages / Welcome ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", scrollBehavior: "smooth" }}>
        {isEmpty ? (
          /* WELCOME */
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 32px",
              textAlign: "center",
              gap: 36,
            }}
          >
            <div>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 22,
                  background: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 20px 40px rgba(15,23,42,0.22)",
                }}
              >
                <Scale size={32} color="white" />
              </div>
              <h1
                style={{
                  fontSize: "2.4rem",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  margin: "0 0 12px",
                }}
              >
                How can I help you today?
              </h1>
              <p style={{ color: "#94a3b8", fontSize: 15, fontWeight: 500, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
                Ask any legal question and I will provide clear, informed guidance.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                width: "100%",
                maxWidth: 560,
              }}
            >
              {CHIPS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  style={{
                    textAlign: "left",
                    padding: "16px 18px",
                    background: "#f8fafc",
                    border: "2px solid #e2e8f0",
                    borderRadius: 16,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#c19651";
                    (e.currentTarget as HTMLButtonElement).style.background = "#fffbf5";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                    (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                  }}
                >
                  <Icon size={16} color="#c19651" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155", lineHeight: 1.4 }}>{text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* CONVERSATION */
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 28 }}>
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: "flex",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: msg.role === "user" ? "#0f172a" : "#f1f5f9",
                      border: msg.role === "user" ? "none" : "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 900,
                      color: msg.role === "user" ? "white" : "#64748b",
                      flexShrink: 0,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {msg.role === "user" ? "You" : <Bot size={16} color="#c19651" />}
                  </div>

                  {/* Bubble */}
                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "14px 20px",
                      borderRadius: msg.role === "user" ? "20px 4px 20px 20px" : "4px 20px 20px 20px",
                      background: msg.role === "user" ? "#0f172a" : "#f8fafc",
                      border: msg.role === "user" ? "none" : "1px solid #e2e8f0",
                      color: msg.role === "user" ? "white" : "#1e293b",
                      fontSize: 14.5,
                      lineHeight: 1.8,
                    }}
                  >
                    {msg.role === "user" ? (
                      <p style={{ margin: 0, fontWeight: 500 }}>{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-strong:text-amber-600 prose-headings:text-slate-900 prose-headings:font-black prose-p:my-1 prose-li:my-0.5">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]} 
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            u: ({node, ...props}: any) => (
                              <u 
                                style={{ 
                                  textDecoration: "none", 
                                  borderBottom: "2.5px solid #c19651", 
                                  paddingBottom: "1px",
                                  fontWeight: 700,
                                  color: "#c19651"
                                }} 
                                {...props} 
                              />
                            ),
                            h3: ({node, ...props}: any) => (
                              <h3 
                                style={{ 
                                  borderLeft: "4px solid #c19651", 
                                  paddingLeft: "12px", 
                                  margin: "24px 0 12px", 
                                  fontWeight: 900, 
                                  color: "#0f172a",
                                  fontSize: "1.1rem",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em"
                                }} 
                                {...props} 
                              />
                            ),
                            "law-statute": ({node, name, url, children, ...props}: any) => (
                              <span style={{ color: "#c19651" }} {...props}>
                                {children}
                              </span>
                            ),
                            "law-penalty": ({node, children, ...props}: any) => (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                  display: "inline-block",
                                  color: "#c19651",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.02em",
                                  borderBottom: "2px solid #c19651",
                                  margin: "0 4px"
                                }}
                                {...props}
                              >
                                {children}
                              </motion.span>
                            ),
                            "law-details": ({node, children, ...props}: any) => {
                              // We use a small internal state-like behavior via CSS/Framer
                              return (
                                <motion.div
                                  initial={{ height: 65 }}
                                  whileHover={{ height: "auto" }}
                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  style={{
                                    overflow: "hidden",
                                    position: "relative",
                                    background: "#f8fafc",
                                    border: "1px dashed #cbd5e1",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    margin: "12px 0",
                                    cursor: "pointer"
                                  }}
                                  {...props}
                                >
                                  <div style={{ fontSize: "0.95em", color: "#475569", fontStyle: "italic" }}>
                                    {children}
                                  </div>
                                  <motion.div 
                                    initial={{ opacity: 1 }}
                                    whileHover={{ opacity: 0 }}
                                    style={{
                                      position: "absolute",
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      height: "32px",
                                      background: "linear-gradient(transparent, #f8fafc)",
                                      pointerEvents: "none"
                                    }}
                                  />
                                </motion.div>
                              );
                            }
                          } as any}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Sources */}
                    {msg.role === "ai" && msg.context?.external && msg.context.external.length > 0 && (
                      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                        <p style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                          <Info size={10} />
                          International Case Laws
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {msg.context.external.map((res, i) => (
                            <a
                              key={i}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 12px",
                                background: "white",
                                borderRadius: 10,
                                border: "1px solid #e2e8f0",
                                textDecoration: "none",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#0f172a",
                                transition: "border-color 0.15s",
                              }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.title}</span>
                              {res.citation && (
                                <span style={{ marginLeft: 10, flexShrink: 0, fontSize: 9, fontWeight: 900, background: "rgba(193,150,81,0.1)", color: "#c19651", padding: "2px 8px", borderRadius: 99 }}>
                                  {res.citation}
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={16} color="#c19651" />
                </div>
                <div style={{ padding: "14px 20px", borderRadius: "4px 20px 20px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
                  <Loader2 size={15} color="#c19651" className="animate-spin" />
                  <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px 28px 20px",
          borderTop: "1px solid #f1f5f9",
          background: "#fff",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#f8fafc",
              border: "2px solid #e2e8f0",
              borderRadius: 20,
              padding: "8px 8px 8px 20px",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#c19651";
              (e.currentTarget as HTMLDivElement).style.background = "#fff";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 4px rgba(193,150,81,0.1)";
            }}
            onBlur={(e) => {
              if (!(e.currentTarget as HTMLDivElement).contains(e.relatedTarget)) {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLDivElement).style.background = "#f8fafc";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask a legal question..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 15,
                fontWeight: 500,
                color: "#1e293b",
                padding: "6px 0",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: input.trim() && !loading ? "#c19651" : "#cbd5e1",
                color: "white",
                border: "none",
                borderRadius: 13,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 800,
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                flexShrink: 0,
                letterSpacing: "0.02em",
              }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>Send</span>
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 9, color: "#cbd5e1", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", margin: 0 }}>
            For informational purposes only · Not a substitute for professional legal advice
          </p>
        </div>
      </div>
    </div>
  );
}
