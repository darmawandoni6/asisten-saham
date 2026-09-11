'use client';

import { Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';

export function ScreenerPhilosophyCard() {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-2xs">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
        <Filter className="h-4 w-4 text-emerald-600" />
        <span>Filosofi &amp; Disiplin Eksekusi Rekomendasi</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Daftar ini adalah <strong>watchlist intelijen terkurasi</strong> pasca penutupan pasar pukul 17:30 WIB. Setiap
        saham dilengkapi alasan teknikal objektif (*Why Buy*), hal wajib dipantau besok pagi (*Watch Trigger*), serta
        kalkulasi rasio *Risk/Reward* (RRR). Jangan langsung melakukan pembelian sebelum syarat pantauan jam 09:00 WIB
        terkonfirmasi di bursa.
      </p>
    </Card>
  );
}
