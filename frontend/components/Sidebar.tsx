"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Briefcase, 
  LifeBuoy, 
  Search, 
  BookOpen, 
  Sparkles,
  TrendingUp,
  ShieldAlert,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Smart Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Portofolio & Plan",
    href: "/portfolio",
    icon: Briefcase,
  },
  {
    label: "Recovery Engine",
    href: "/recovery",
    icon: LifeBuoy,
  },
  {
    label: "EOD Screener",
    href: "/screener",
    icon: Search,
  },
  {
    label: "Trading Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    label: "Panduan Cara Pakai",
    href: "/guide",
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm">
      <div>
        {/* Brand Logo & Name (Stockbit Clean Green Accent) */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 bg-white">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              Asisten Saham
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                IDX
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">EOD Decision Copilot</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-5 space-y-1">
          <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Menu Utama
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* EOD Session Schedule Box */}
        <div className="mx-3 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-700 text-xs font-bold mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Siklus Kerja EOD</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Evaluasi otomatis aktif setiap <span className="font-semibold text-slate-800">17:30 WIB</span> setelah penutupan bursa IDX untuk aksi esok hari.
          </p>
        </div>
      </div>

      {/* AI Copilot Status & Footer */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Copilot Active</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Gemini 2.0 Flash mengevaluasi closing bursa jam 17:30 WIB secara objektif.
          </p>
        </div>
      </div>
    </aside>
  );
}
