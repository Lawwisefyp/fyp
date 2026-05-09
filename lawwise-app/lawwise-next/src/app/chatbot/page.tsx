"use client";

import ChatBox from "@/components/ChatBox";
import LawyerSidebar from "@/components/LawyerSidebar";
import "../../styles/LawyerCaseHistory.css"; // Ensure dashboard styles are loaded

export default function ChatbotPage() {
  return (
    <div className="dashboard-body">
      <LawyerSidebar />
      <div className="dashboard-main" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 80px)' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
           <ChatBox />
        </div>
      </div>
    </div>
  );
}
