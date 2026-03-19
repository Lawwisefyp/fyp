"use client";

import React from "react";
import { MessageSquare, FileText, Gavel, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: MessageSquare, label: "Legal Chatbot", path: "/chatbot" },
    { icon: FileText, label: "Legal Drafting", path: "/ai-drafting" },
    // { icon: Gavel, label: "Case Law Search", path: "/search" },
  ];

  return (
    <div className="w-64 h-[calc(100vh-80px)] bg-slate-50 p-6 flex flex-col gap-8 fixed left-0 top-[80px] border-r border-slate-200 shadow-sm z-40">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg">
          <Gavel size={24} color="white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          AI Tools
        </h1>
      </div>

      <nav className="flex-1 flex flex-col gap-3 mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
              pathname === item.path
                ? "bg-slate-200 text-slate-900 shadow-sm border border-slate-300"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {pathname === item.path && (
              <motion.div
                layoutId="active-tab"
                className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 rounded-r-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <item.icon
              size={22}
              className={`transition-transform duration-300 group-hover:scale-110 ${pathname === item.path ? "text-slate-800" : "text-slate-400"}`}
            />
            <span className="font-bold tracking-wide text-sm">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* <div className="flex flex-col gap-2 border-t border-[#f5ebe0] pt-6">
        <button className="flex items-center gap-3 p-3 text-slate-500 hover:text-[#6d4c41] hover:bg-[#fcf8f3] rounded-xl transition-all">
          <Settings size={20} />
          <span className="text-sm font-semibold">Settings</span>
        </button>
        <button className="flex items-center gap-3 p-3 text-[#a67c52] hover:text-[#8d6e63] hover:bg-[#fcf8f3] rounded-xl transition-all">
          <LogOut size={20} />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div> */}
    </div>
  );
}
