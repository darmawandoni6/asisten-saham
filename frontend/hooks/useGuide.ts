'use client';

import { useState } from 'react';

export type GuideTab = 'FLOW' | 'FEATURES' | 'STATUS' | 'RULES' | 'CHECKLIST';

export interface ChecklistItem {
  id: number;
  title: string;
  desc: string;
  linkText: string;
  href: string;
}

export const GUIDE_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 1,
    title: 'Atur Saldo Kas RDN & Catat Saham Pertama di Portofolio',
    desc: 'Klik menu Portofolio, sesuaikan Saldo Kas RDN Anda via tombol [ ✏️ Edit ], lalu masukkan ticker saham IDX yang Anda miliki beserta Avg Beli, TP, dan SL.',
    linkText: 'Buka Portofolio',
    href: '/portfolio',
  },
  {
    id: 2,
    title: 'Buka Smart Dashboard dan Periksa Kartu Aksi',
    desc: 'Lihat ringkasan total portofolio Anda dan periksa status warna saham yang baru saja Anda masukkan.',
    linkText: 'Buka Dashboard',
    href: '/',
  },
  {
    id: 3,
    title: 'Buka Candlestick Chart Interaktif',
    desc: 'Di Dashboard atau Portofolio, klik tombol chart untuk melihat candlestick dan garis MA20/MA50.',
    linkText: 'Lihat di Dashboard',
    href: '/',
  },
  {
    id: 4,
    title: 'Jalankan Scan Peluang Pasar di EOD Screener',
    desc: "Buka menu EOD Screener lalu klik tombol 'Scan EOD'. Terapkan Filter Anggaran (misal: ≤ Rp 2.000) dan ikuti SOP 4 Langkah untuk memilih saham dengan RRR ≥ 1:2.0.",
    linkText: 'Buka Screener',
    href: '/screener',
  },
  {
    id: 5,
    title: 'Uji Coba Pangkas / Jual Lot Saham di Portofolio',
    desc: 'Coba klik tombol [ 🏷️ Jual ] pada baris saham di Portofolio untuk melihat kalkulasi Realized PnL instan dan pemangkasan lot posisi secara otomatis.',
    linkText: 'Buka Portofolio',
    href: '/portfolio',
  },
];

export function useGuide() {
  const [activeTab, setActiveTab] = useState<GuideTab>('FLOW');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (id: number) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return {
    activeTab,
    setActiveTab,
    checkedItems,
    toggleCheck,
  };
}
