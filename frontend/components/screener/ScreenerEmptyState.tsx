'use client';

import { Inbox, Loader2, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ScreenerEmptyStateProps {
  isScanning: boolean;
  onRunScan: () => void;
}

export function ScreenerEmptyState({ isScanning, onRunScan }: ScreenerEmptyStateProps) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-12 text-center text-slate-400 shadow-2xs">
      <Inbox className="mx-auto mb-2 h-10 w-10 text-slate-300" />
      <p className="text-sm font-bold text-slate-800">Belum Ada Hasil Rekomendasi</p>
      <p className="mx-auto mt-1 mb-5 max-w-md text-xs text-slate-500">
        Klik tombol &quot;Scan EOD (Top 10)&quot; untuk memindai 35+ saham teraktif BEI dan menghasilkan 10 rekomendasi
        terbaik pasca penutupan pasar.
      </p>
      <Button
        type="button"
        variant="emerald"
        size="sm"
        onClick={onRunScan}
        disabled={isScanning}
        className="gap-2 rounded-xl text-xs font-semibold shadow-2xs"
      >
        {isScanning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memindai Saham BEI...</span>
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            <span>Jalankan Scan EOD Sekarang</span>
          </>
        )}
      </Button>
    </Card>
  );
}
