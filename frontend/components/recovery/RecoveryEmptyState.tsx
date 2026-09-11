'use client';

import Link from 'next/link';

import { ArrowRight, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function RecoveryEmptyState() {
  return (
    <Card className="mx-auto mt-6 flex max-w-lg flex-col items-center justify-center rounded-2xl border-slate-200 bg-white p-12 text-center shadow-2xs">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <h3 className="mb-1.5 text-base font-bold text-slate-900">Semua Posisi Portofolio Terpantau Aman</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
        Tidak ada saham yang mengalami floating loss dalam atau memerlukan Recovery Mode (&gt;10% floating loss). Fitur
        kalkulator average down presisi dan diagnosa penyelamatan modal akan otomatis aktif saat ada saham yang
        membutuhkan evaluasi recovery.
      </p>
      <Button asChild variant="default" className="gap-2 rounded-xl">
        <Link href="/portfolio">
          <span>Buka Portofolio &amp; Trading Plan</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
}
