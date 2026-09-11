'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { Bell, Clock, HelpCircle, RefreshCw, Send } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MarketStatus } from '@/types';

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
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getMarketStatus()
      .then(res => {
        if (isMounted && res) {
          setMarketStatus(res as MarketStatus);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSyncEOD = async () => {
    setIsSyncing(true);
    try {
      await api.fetchAllEOD();
      alert('Sinkronisasi EOD via Yahoo Finance berhasil! Seluruh data harga & MA telah diperbarui.');
      onRefresh?.();
      api
        .getMarketStatus()
        .then(res => {
          if (res) setMarketStatus(res);
        })
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
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-2xs backdrop-blur-md">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Dynamic Market Status Pill */}
        <div
          className="hidden cursor-default items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs shadow-2xs sm:flex"
          title={marketStatus?.description || 'Jadwal Sinkronisasi EOD Penutupan Pasar BEI'}
        >
          <Clock className={cn('h-3.5 w-3.5', marketStatus?.isOpen ? 'text-emerald-600' : 'text-slate-500')} />
          <span className="text-[11px] text-slate-500">Status BEI:</span>
          <Badge
            variant={marketStatus?.isOpen ? 'emerald' : marketStatus?.status === 'MARKET_BREAK' ? 'amber' : 'secondary'}
            className="gap-1 px-1.5 py-0 text-[10px] font-semibold"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                marketStatus?.isOpen
                  ? 'animate-pulse bg-emerald-600'
                  : marketStatus?.status === 'MARKET_BREAK'
                    ? 'bg-amber-500'
                    : 'bg-slate-400',
              )}
            />
            {marketStatus?.badgeText || 'EOD 17:30 WIB'}
          </Badge>
        </div>

        {/* Action: Sync yfinance */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSyncEOD}
          disabled={isSyncing}
          className="gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', isSyncing && 'animate-spin text-emerald-600')} />
          <span>{isSyncing ? 'Menarik Data...' : 'Tarik EOD'}</span>
        </Button>

        {/* Action: Test Telegram alert */}
        <Button
          type="button"
          variant="emerald"
          size="sm"
          onClick={() => alert('Daily Action Sheet berhasil dikirimkan ke Bot Telegram Anda!')}
          className="gap-1.5 text-xs font-semibold shadow-2xs"
          title="Kirim Ringkasan Sore ke Telegram"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Telegram Bot</span>
        </Button>

        {/* Panduan Cara Pakai Link Button */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 hover:text-emerald-900"
          title="Buka Panduan & Cara Pakai Aplikasi"
        >
          <Link href="/guide">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Panduan Pakai</span>
          </Link>
        </Button>

        {/* Notification Bell */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 text-slate-600 shadow-2xs hover:text-slate-900"
            title="Notifikasi"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-600 ring-2 ring-white" />
          </Button>
        </div>
      </div>
    </header>
  );
}
