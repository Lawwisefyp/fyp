"use client";

import DraftingBox from "../../components/DraftingBox";
import LawyerSidebar from "../../components/LawyerSidebar";
import "../../styles/LawyerCaseHistory.css";

export default function DraftingPage() {
  return (
    <div className="dashboard-body">
      <LawyerSidebar />
      <div className="dashboard-main" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 80px)' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
           <DraftingBox />
        </div>
      </div>
    </div>
  );
}
