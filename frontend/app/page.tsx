"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { PortfolioSummaryCards } from "@/components/PortfolioSummaryCards";
import { ActionCard } from "@/components/ActionCard";
import { DailyActionSheet } from "@/components/DailyActionSheet";
import { CandlestickChart } from "@/components/CandlestickChart";
import { AICopilotPanel } from "@/components/AICopilotPanel";
import { EditBalanceModal } from "@/components/EditBalanceModal";
import { Holding, PortfolioSummary } from "@/types";
import { api } from "@/lib/api";
import { PlusCircle, TrendingUp, Layers } from "lucide-react";

const INITIAL_SUMMARY: PortfolioSummary = {
  totalEquity: 0,
  totalCost: 0,
  floatingPnl: 0,
  floatingPnlPct: 0.0,
  cashBalance: 0,
  totalLots: 0,
  actionCounts: {
    sellCutLoss: 0,
    takeProfit: 0,
    holdMonitor: 0,
    trailingStopWarning: 0,
    recoveryMode: 0,
  }
};

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>(INITIAL_SUMMARY);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [activeModal, setActiveModal] = useState<"chart" | "ai" | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboard();
      if (data) {
        setHoldings(data.holdings || []);
        setSummary(data.summary || INITIAL_SUMMARY);
      }
    } catch (err) {
      console.warn("Backend API offline:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleOpenChart = (holding: Holding) => {
    setSelectedHolding(holding);
    setActiveModal("chart");
  };

  const handleOpenAI = (holding: Holding) => {
    setSelectedHolding(holding);
    setActiveModal("ai");
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-16">
      <Topbar 
        title="Smart Decision Dashboard (EOD Analysis)" 
        subtitle="Rekomendasi objektif Hold / Sell / Buy berdasarkan data closing 17:30 WIB"
        onRefresh={loadDashboard}
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Summary Metrics */}
        <PortfolioSummaryCards 
          summary={summary} 
          onEditCashBalance={() => setIsBalanceModalOpen(true)}
        />

        {/* 1. Core Feature: Smart Action Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Smart Action Cards</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold">
                  {holdings.length} Saham Terpantau
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kartu ringkasan status harian dengan 5 indikator warna tegas (Cut Loss, Take Profit, Hold, Trailing Stop, Recovery)
              </p>
            </div>
          </div>

          {holdings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {holdings.map((holding) => (
                <ActionCard
                  key={holding.id}
                  holding={holding}
                  onSelectStock={handleOpenChart}
                  onOpenAI={handleOpenAI}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-2xs flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Belum Ada Saham di Portofolio
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5">
                Mulai masukkan trading plan pertama Anda (Ticker, Avg Price Beli, Lot, Target Price, dan Stop Loss) untuk memantau status aksi harian.
              </p>
              <Link
                href="/portfolio"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Saham Pertama</span>
              </Link>
            </div>
          )}
        </div>

        {/* 2. Daily Action Sheet */}
        {holdings.length > 0 && (
          <div>
            <DailyActionSheet 
              holdings={holdings} 
              onOpenStock={handleOpenAI}
            />
          </div>
        )}
      </div>

      {/* Modal / Dialog for Chart */}
      {activeModal === "chart" && selectedHolding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <CandlestickChart
              ticker={selectedHolding.ticker}
              candles={[]}
              holding={selectedHolding}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {/* Modal / Dialog for AI Copilot */}
      {activeModal === "ai" && selectedHolding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8">
            <AICopilotPanel
              holding={selectedHolding}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {/* Modal Edit Cash Balance */}
      <EditBalanceModal
        isOpen={isBalanceModalOpen}
        currentBalance={summary.cashBalance || 0}
        onClose={() => setIsBalanceModalOpen(false)}
        onSuccess={(newBalance) => {
          setSummary((prev) => ({
            ...prev,
            cashBalance: newBalance,
          }));
          loadDashboard();
        }}
      />
    </main>
  );
}
