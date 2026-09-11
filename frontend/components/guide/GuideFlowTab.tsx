'use client';

import { CheckCircle2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

const FLOW_STEPS = [
  {
    step: '01',
    numBg: 'bg-slate-100 text-slate-800',
    title: 'Bursa Tutup (17:30 WIB)',
    desc: 'Data closing harian BEI/IDX selesai dibentuk. Harga closing menjadi data paling valid karena mencerminkan konsensus akhir seluruh pelaku pasar.',
    badgeColor: 'text-emerald-700',
    badgeText: 'Data Closing Valid',
  },
  {
    step: '02',
    numBg: 'bg-emerald-100 text-emerald-800',
    title: 'Cek Smart Dashboard',
    desc: 'Buka Dashboard untuk melihat kartu aksi harian: Apakah ada saham berlabel Cut Loss (Merah), Take Profit (Hijau), atau Trailing Stop (Oranye)?',
    badgeColor: 'text-emerald-700',
    badgeText: 'Cek Warna Aksi',
  },
  {
    step: '03',
    numBg: 'bg-blue-100 text-blue-800',
    title: 'Evaluasi AI Copilot & Chart',
    desc: 'Klik AI Copilot untuk membaca ulasan teknikal berbasis MA20/50 & RSI. Buka Chart untuk melihat letak candle terhadap garis Target Price dan Stop Loss Anda.',
    badgeColor: 'text-blue-700',
    badgeText: 'Validasi Objektif',
  },
  {
    step: '04',
    numBg: 'bg-purple-100 text-purple-800',
    title: 'Pasang Order di Sekuritas',
    desc: 'Pasang antrean order jual/beli (Automatic Order / GTC) di aplikasi sekuritas Anda malam hari atau sebelum jam 09:00 WIB. Jam bursa cukup dipantau tanpa stres.',
    badgeColor: 'text-purple-700',
    badgeText: 'Eksekusi Tanpa Ragu',
  },
];

export function GuideFlowTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">Alur Kerja Harian Trader Disiplin</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Ikuti 4 langkah terstruktur setiap sore hari bursa (Senin s.d. Jumat)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {FLOW_STEPS.map(item => (
          <Card
            key={item.step}
            className="relative flex flex-col justify-between rounded-2xl border-slate-200 bg-white p-5 shadow-2xs"
          >
            <CardContent className="flex h-full flex-col justify-between p-0">
              <div>
                <div
                  className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl font-mono text-sm font-bold ${item.numBg}`}
                >
                  {item.step}
                </div>
                <h4 className="mb-1 text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
              </div>
              <div
                className={`mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold ${item.badgeColor}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{item.badgeText}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
