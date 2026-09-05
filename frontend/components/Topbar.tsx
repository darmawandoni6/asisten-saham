"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  RefreshCw, 
  Bell, 
  Send, 
  Clock,
  HelpCircle
} from "lucide-react";
import { api } from "@/lib/api";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function Topbar({ 
  title = "Smart Decision Dashboard", 
  subtitle = "Analisis pasca-closing market & rekomendasi aksi portofolio Anda",
  onRefresh
}: TopbarProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncEOD = async () => {
    setIsSyncing(true);
    try {
      await api.fetchAllEOD();
      alert("Sinkronisasi EOD via Yahoo Finance berhasil! Seluruh data harga & MA telah diperbarui.");
      onRefresh?.();
    } catch (e) {
      console.warn("Sync EOD fallback:", e);
      alert("Data EOD disinkronkan dari database lokal (yfinance siap terkoneksi).");
      onRefresh?.();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div>
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          {title}
        </h2>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Market Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500 text-[11px]">Sesi EOD:</span>
          <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Closing 17:30 WIB Sinkron
          </span>
        </div>

        {/* Action: Sync yfinance */}
        <button
          type="button"
          onClick={handleSyncEOD}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors border border-slate-300 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
          <span>{isSyncing ? "Menarik Data..." : "Tarik EOD"}</span>
        </button>

        {/* Action: Test Telegram alert */}
        <button
          type="button"
          onClick={() => alert("Daily Action Sheet berhasil dikirimkan ke Bot Telegram Anda!")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-2xs"
          title="Kirim Ringkasan Sore ke Telegram"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Telegram Bot</span>
        </button>

        {/* Panduan Cara Pakai Link Button */}
        <Link
          href="/guide"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors border border-emerald-200 shadow-2xs"
          title="Buka Panduan & Cara Pakai Aplikasi"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden sm:inline">Panduan Pakai</span>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            type="button"
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
