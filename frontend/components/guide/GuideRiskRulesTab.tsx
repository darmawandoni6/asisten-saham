'use client';

import { Card, CardContent } from '@/components/ui/card';

const RISK_RULES = [
  {
    num: '#1',
    numBg: 'bg-emerald-100 text-emerald-800',
    title: 'No Plan, No Trade',
    desc: 'Jangan pernah membeli satu lot saham pun sebelum menentukan level Target Price dan batas Stop Loss yang terukur. Beli berdasarkan analisa teknikal atau valuasi, bukan rumor grup chat.',
  },
  {
    num: '#2',
    numBg: 'bg-rose-100 text-rose-800',
    title: 'Patuhi Stop Loss Tanpa Kompromi',
    desc: 'Cut loss 5%–7% sangat mudah dikembalikan oleh satu kali transaksi profit berikutnya. Namun floating loss 50% membutuhkan kenaikan 100% hanya untuk balik modal (*Break-Even*).',
  },
  {
    num: '#3',
    numBg: 'bg-blue-100 text-blue-800',
    title: 'Kunci Profit Bertahap (Scale-Out)',
    desc: 'Saat saham naik menyentuh target, segera jual 50% posisi Anda. Hal ini menjamin bahwa apapun yang terjadi di masa depan, transaksi tersebut berakhir sebagai transaksi yang menghasilkan uang.',
  },
  {
    num: '#4',
    numBg: 'bg-purple-100 text-purple-800',
    title: 'Jangan Average Down Membabi Buta',
    desc: 'Menambah lot pada saham yang sedang terjun bebas hanya mempercepat kehabisan modal (*catching a falling knife*). Hanya lakukan average down jika dihitung dengan kalkulator presisi di area Support Mayor.',
  },
];

export function GuideRiskRulesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">4 Aturan Emas Trading Disiplin (Anti-Nyangkut)</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Prinsip manajemen risiko yang diterapkan oleh trader profesional di seluruh dunia
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {RISK_RULES.map(rule => (
          <Card key={rule.num} className="space-y-2 rounded-2xl border-slate-200 bg-white p-5 shadow-2xs">
            <CardContent className="space-y-2 p-0">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${rule.numBg}`}
              >
                {rule.num}
              </span>
              <h4 className="text-sm font-bold text-slate-900">{rule.title}</h4>
              <p className="text-xs leading-relaxed text-slate-600">{rule.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
