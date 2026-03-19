"use client";

import DraftingBox from "../../components/DraftingBox";

export default function DraftingPage() {
  return (
    <div
      style={{
        height: "calc(100vh - 80px)",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "88%",
          height: "100%",
          maxHeight: "calc(100vh - 128px)",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow:
            "0 25px 60px -10px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DraftingBox />
      </div>
    </div>
  );
}
