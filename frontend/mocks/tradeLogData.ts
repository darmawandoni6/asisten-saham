import { TradeLogItem } from "@/types";

export const MOCK_TRADE_LOGS: TradeLogItem[] = [
  {
    id: 1,
    date: "2026-08-28",
    ticker: "AMMN.JK",
    action: "SELL",
    price: 9850,
    lot: 50,
    totalValue: 49250000,
    realizedPnl: 6500000,
    realizedPnlPct: 15.2,
    notes: "Take profit sesuai trading plan awal saat menyentuh resistance psikologis 10.000.",
    psychologyFlag: "DISCIPLINED",
  },
  {
    id: 2,
    date: "2026-08-15",
    ticker: "BREN.JK",
    action: "CUT_LOSS",
    price: 7800,
    lot: 30,
    totalValue: 23400000,
    realizedPnl: -2400000,
    realizedPnlPct: -9.3,
    notes: "Cut loss disiplin setelah breakdown dari support MA20. Mencegah kerugian lebih dalam.",
    psychologyFlag: "DISCIPLINED",
  },
  {
    id: 3,
    date: "2026-08-04",
    ticker: "CUAN.JK",
    action: "CUT_LOSS",
    price: 6400,
    lot: 40,
    totalValue: 25600000,
    realizedPnl: -4800000,
    realizedPnlPct: -15.79,
    notes: "Terbawa emosi membeli saat saham sedang ARA (auto reject atas), lalu panik menjual di ARB.",
    psychologyFlag: "FOMO_BUY",
  },
  {
    id: 4,
    date: "2026-07-22",
    ticker: "TLKM.JK",
    action: "SELL",
    price: 3100,
    lot: 120,
    totalValue: 37200000,
    realizedPnl: 2400000,
    realizedPnlPct: 6.89,
    notes: "Swing trade rebound dividen. Exit di target resistance 3.100.",
    psychologyFlag: "DISCIPLINED",
  },
  {
    id: 5,
    date: "2026-07-10",
    ticker: "KLBF.JK",
    action: "SELL",
    price: 1580,
    lot: 150,
    totalValue: 23700000,
    realizedPnl: -450000,
    realizedPnlPct: -1.86,
    notes: "Panik menjual saat candle merah intraday 15 menit, padahal support harian belum jebol.",
    psychologyFlag: "PANIC_SELL",
  }
];

export const MOCK_POST_MORTEM = {
  winRatePct: 60.0,
  totalRealizedPnl: 1250000,
  profitFactor: 1.16,
  totalTrades: 5,
  dominantPattern: "Impulsive FOMO pada Saham Volatil Tinggi",
  aiFeedback: "Dari 5 transaksi terakhir, Anda menunjukkan kedisiplinan yang sangat baik pada saham Big Caps (AMMN, TLKM) dengan win rate tinggi. Namun, Anda memiliki kebiasaan psikologis FOMO Buy pada saham third-liner/konglomerasi (seperti CUAN) saat running trade, yang memakan 65% dari total akumulasi profit Anda. Disarankan: Batasi porsi alokasi saham ber-beta tinggi maksimal 10% dari total portofolio dan dilarang mengejar harga di atas +8% intraday.",
  recommendations: [
    "Terapkan aturan 'Wait for Pullback' — jangan pernah buy order ketika harga sudah running > 5% dalam 1 sesi.",
    "Perketat stop-loss otomatis di broker untuk menghindari ragu cut-loss saat terjadi flash dump.",
    "Fokus pada strategi Swing MA20/MA50 yang terbukti memberikan profit rasio tertinggi pada track record Anda."
  ]
};
