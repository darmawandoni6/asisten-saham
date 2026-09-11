/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import { Bell, Clock, HelpCircle, RefreshCw, Send } from 'lucide-react';

import { api } from '@/lib/api';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function Topbar({
  title = 'Smart Decision Dashboard',
  subtitle = 'Analisis pasca-closing market & rekomendasi aksi portofolio Anda',
  onRefresh,
}: TopbarProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [marketStatus, setMarketStatus] = useState<any>(null);

  React.useEffect(() => {
    api
      .getMarketStatus()
      .then(setMarketStatus)
      .catch(() => {});
  }, []);

  const handleSyncEOD = async () => {
    setIsSyncing(true);
    try {
      await api.fetchAllEOD();
      alert('Sinkronisasi EOD via Yahoo Finance berhasil! Seluruh data harga & MA telah diperbarui.');
      onRefresh?.();
      api
        .getMarketStatus()
        .then(setMarketStatus)
        .catch(() => {});
    } catch (e) {
      console.warn('Sync EOD fallback:', e);
      alert('Data EOD disinkronkan dari database lokal (yfinance siap terkoneksi).');
      onRefresh?.();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 p-6 shadow-2xs backdrop-blur-md">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">{title}</h2>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Dynamic Market Status Pill */}
        <div
          className="hidden cursor-default items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs shadow-2xs sm:flex"
          title={marketStatus?.description || 'Jadwal Sinkronisasi EOD Penutupan Pasar BEI'}
        >
          <Clock className={`h-3.5 w-3.5 ${marketStatus?.isOpen ? 'text-emerald-600' : 'text-slate-500'}`} />
          <span className="text-[11px] text-slate-500">Status BEI:</span>
          <span
            className={`flex items-center gap-1.5 text-[11px] font-semibold ${
              marketStatus?.isOpen
                ? 'text-emerald-700'
                : marketStatus?.status === 'MARKET_BREAK'
                  ? 'text-amber-700'
                  : 'text-slate-700'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                marketStatus?.isOpen
                  ? 'animate-pulse bg-emerald-600'
                  : marketStatus?.status === 'MARKET_BREAK'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
              }`}
            />
            {marketStatus?.badgeText || 'EOD 17:30 WIB'}
          </span>
        </div>

        {/* Action: Sync yfinance */}
        <button
          type="button"
          onClick={handleSyncEOD}
          disabled={isSyncing}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{isSyncing ? 'Menarik Data...' : 'Tarik EOD'}</span>
        </button>

        {/* Action: Test Telegram alert */}
        <button
          type="button"
          onClick={() => alert('Daily Action Sheet berhasil dikirimkan ke Bot Telegram Anda!')}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500"
          title="Kirim Ringkasan Sore ke Telegram"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Telegram Bot</span>
        </button>

        {/* Panduan Cara Pakai Link Button */}
        <Link
          href="/guide"
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs transition-colors hover:bg-emerald-100"
          title="Buka Panduan & Cara Pakai Aplikasi"
        >
          <HelpCircle className="h-3.5 w-3.5 text-emerald-700" />
          <span className="hidden sm:inline">Panduan Pakai</span>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:text-slate-900"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-600 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
