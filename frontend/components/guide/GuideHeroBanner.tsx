'use client';

import Link from 'next/link';

import { Briefcase, Search, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function GuideHeroBanner() {
  return (
    <Card className="rounded-2xl border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-0 shadow-2xs">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-2">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 rounded-full border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold tracking-wider text-emerald-800 uppercase"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              Filosofi EOD Decision Copilot
            </Badge>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              Trading Disiplin Tanpa Emosi Jam Bursa
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 md:text-sm">
              Mayoritas trader merugi karena membuat keputusan saat pasar sedang bergejolak (FOMO, panik, dan ragu cut
              loss). Asisten Saham didesain untuk menganalisis pasar <strong>pasca-penutupan bursa (17:30 WIB)</strong>{' '}
              saat pikiran tenang dan data harian sudah valid, sehingga esok pagi Anda cukup mengeksekusi rencana tanpa
              ragu.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row md:flex-col">
            <Button
              asChild
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500"
            >
              <Link href="/portfolio">
                <Briefcase className="h-4 w-4" />
                <span>Mulai Input Saham</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex items-center justify-center gap-2 rounded-xl border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
            >
              <Link href="/screener">
                <Search className="h-4 w-4 text-emerald-600" />
                <span>Scan Peluang EOD</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
