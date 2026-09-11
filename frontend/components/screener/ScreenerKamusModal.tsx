'use client';

import Link from 'next/link';

import { ArrowRight, BookOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScreenerKamusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScreenerKamusModal({ isOpen, onClose }: ScreenerKamusModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        {/* Modal Header */}
        <DialogHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Kamus Strategi, AI Score &amp; Risk:Reward
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Panduan formula teknikal, arti AI Score, dan matematika probabilitas Risk:Reward
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body (Scrollable) */}
        <ScrollArea className="max-h-[70vh] p-5">
          <div className="space-y-4 text-xs">
            {/* 1. Risk to Reward Ratio (RRR) Section */}
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-100 font-mono text-xs font-bold text-emerald-900"
                >
                  🎯 RISK : REWARD RATIO (RRR)
                </Badge>
                <span className="text-[11px] font-bold text-emerald-800">Matematika Ketahanan Modal</span>
              </div>
              <strong className="block text-sm text-slate-900">
                Kunci Profit Konsisten: Mengapa RRR &ge; 1 : 2.0 Sangat Krusial?
              </strong>
              <p className="leading-relaxed text-slate-700">
                RRR membandingkan <strong>berapa rupiah risiko yang Anda korbankan (Stop Loss)</strong> terhadap{' '}
                <strong>berapa rupiah potensi keuntungan yang Anda incar (Target TP)</strong>.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
                <div className="space-y-1 rounded-lg border border-emerald-200 bg-white p-2.5 text-[11px]">
                  <span className="block font-bold text-slate-900">📐 Rumus Sederhana:</span>
                  <p className="font-mono text-slate-600">1 : (Target TP - Entry) / (Entry - Stop Loss)</p>
                  <span className="block text-[10px] font-medium text-emerald-800">
                    Contoh: Beli 1.000, SL 950 (-5%), TP 1.100 (+10%) &rarr; <strong>RRR = 1 : 2.0</strong>
                  </span>
                </div>

                <div className="space-y-1 rounded-lg border border-emerald-200 bg-white p-2.5 text-[11px]">
                  <span className="block font-bold text-slate-900">🏆 Simulasi Win-Rate 40%:</span>
                  <p className="text-slate-600">
                    Dari 10 trade: <strong>6x Rugi (-Rp 300)</strong> vs <strong>4x Cuan (+Rp 400)</strong>.
                  </p>
                  <span className="block text-[10px] font-bold text-emerald-800">
                    Hasil Akhir: Portofolio Tetap Untung Bersih +Rp 100!
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <Badge variant="secondary" className="bg-emerald-200/80 font-bold text-emerald-950">
                  &ge; 1 : 2.0 (Sangat Layak)
                </Badge>
                <Badge variant="secondary" className="bg-amber-100 font-medium text-amber-900">
                  1 : 1.5 (Cukup Layak)
                </Badge>
                <Badge variant="secondary" className="bg-rose-100 font-medium text-rose-800">
                  &lt; 1 : 1.0 (Hindari / Tidak Sepadan)
                </Badge>
              </div>
            </div>

            {/* 2. Skor Perhatian & Keyakinan Beli (1-10) Section */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold tracking-wider text-slate-900 uppercase">
                  ⭐ SKOR PERHATIAN &amp; KEYAKINAN BELI (1 – 10)
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Skala Keputusan Beli 09:00 WIB</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Skor Perhatian mengukur <strong>tingkat keyakinan dan kesiapan aksi beli</strong> pada pembukaan market
                esok pagi (09:00 WIB), memadukan kematangan teknikal MA/RSI dengan rasio Risk:Reward (RRR).
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-snug text-amber-950">
                ⚠️ <strong>ATURAN DISIPLIN:</strong> Skor 10/10 menandakan setup paling prima untuk langsung dipasang
                antrean beli. Namun tetap patuhi SOP pembukaan 09:00 WIB dan pasang Stop Loss otomatis di sekuritas.
              </div>
              <div className="grid grid-cols-1 gap-2 pt-1 text-xs sm:grid-cols-3">
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5">
                  <strong className="block font-black text-emerald-900">🔥 Skor 10/10 (Wajib Beli Besok)</strong>
                  <span className="mt-0.5 block text-[11px] leading-snug text-emerald-950">
                    Setup Sempurna (Breakout/Rebound Valid, RRR &ge; 1:2.0, Volume Akumulasi).
                  </span>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                  <strong className="block font-bold text-blue-900">⚡ Skor 8 – 9/10 (Siaga 1 Beli)</strong>
                  <span className="mt-0.5 block text-[11px] leading-snug text-blue-950">
                    Sangat Direkomendasikan (Tunggu konfirmasi candle 15 menit pertama 09:00–09:15 WIB).
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <strong className="block font-bold text-slate-800">👀 Skor 6 – 7/10 (Layak Pantau)</strong>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-600">
                    Cocok untuk cicil akumulasi bertahap (DCA) di area Support Major.
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Strategy Badges */}
            <div className="space-y-3 pt-1">
              <span className="block text-xs font-bold tracking-wider text-slate-900 uppercase">
                🏷️ 3 Tipe Strategi Screener
              </span>

              {/* Oversold */}
              <div className="space-y-1.5 rounded-xl border border-purple-200 bg-purple-50/50 p-3.5">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-purple-200 bg-purple-100 font-mono text-xs font-bold text-purple-800"
                  >
                    OVERSOLD (Ungu)
                  </Badge>
                  <span className="text-xs font-semibold text-purple-700">RSI &lt; 35 • Support Mayor</span>
                </div>
                <strong className="block text-sm text-slate-900">Jenuh Jual Ekstrem (Buy on Weakness)</strong>
                <p className="leading-relaxed text-slate-600">
                  Harga sudah turun sangat dalam dan menyentuh lantai support kuat. Tekanan jual habis, ruang penurunan
                  terbatas.
                </p>
                <p className="pt-1 font-medium text-purple-900">
                  👉 <strong>Rekomendasi Aksi:</strong> Beli bertahap saat candle hijau/pantulan reversal muncul. Pasang
                  SL ketat di bawah support.
                </p>
              </div>

              {/* Breakout */}
              <div className="space-y-1.5 rounded-xl border border-blue-200 bg-blue-50/50 p-3.5">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-100 font-mono text-xs font-bold text-blue-800"
                  >
                    BREAKOUT (Biru)
                  </Badge>
                  <span className="text-xs font-semibold text-blue-700">Close &ge; MA20 • RSI &ge; 55</span>
                </div>
                <strong className="block text-sm text-slate-900">Momentum Tren Kenaikan Baru (Trend Following)</strong>
                <p className="leading-relaxed text-slate-600">
                  Harga menembus dan bertahan di atas MA20 dengan volume aktif. Fase sideways selesai dan tren
                  akselerasi dimulai.
                </p>
                <p className="pt-1 font-medium text-blue-900">
                  👉 <strong>Rekomendasi Aksi:</strong> <em>Buy on Momentum</em> untuk menunggangi tren akselerasi
                  jangka pendek.
                </p>
              </div>

              {/* Value */}
              <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-100 font-mono text-xs font-bold text-amber-800"
                  >
                    VALUE (Kuning Emas)
                  </Badge>
                  <span className="text-xs font-semibold text-amber-800">Support MA50 • Blue Chip</span>
                </div>
                <strong className="block text-sm text-slate-900">Akumulasi Sehat &amp; Valuasi Wajar</strong>
                <p className="leading-relaxed text-slate-600">
                  Saham berfundamental kuat (Blue Chip/LQ45) yang berkonsolidasi stabil di atas garis penopang MA50.
                </p>
                <p className="pt-1 font-medium text-amber-900">
                  👉 <strong>Rekomendasi Aksi:</strong> Cicil beli santai (*DCA*) untuk portofolio investasi jangka
                  menengah-panjang.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Modal Footer */}
        <DialogFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-3.5 px-5 text-xs text-slate-500 sm:justify-between">
          <Link href="/guide" className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800">
            <span>Buka Panduan &amp; SOP Lengkap</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-lg border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
