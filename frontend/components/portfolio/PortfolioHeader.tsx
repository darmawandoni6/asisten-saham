'use client';

import { Plus, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';

interface PortfolioHeaderProps {
  cashBalance: number;
  onOpenEditBalance: () => void;
  onOpenAddHolding: () => void;
}

export function PortfolioHeader({ cashBalance, onOpenEditBalance, onOpenAddHolding }: PortfolioHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Daftar Trading Plan Aktif</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Setiap posisi diproteksi dengan batas risiko terukur dan trailing stop otomatis
        </p>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Wallet className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="block text-[10px] leading-tight font-semibold text-slate-400">Saldo Kas RDN</span>
            <span className="font-mono text-xs leading-tight font-bold text-slate-800">
              {formatRupiah(cashBalance)}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenEditBalance}
            className="ml-1 h-6 rounded-lg border-emerald-200 bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            ✏️ Edit
          </Button>
        </div>

        <Button
          type="button"
          variant="emerald"
          size="sm"
          onClick={onOpenAddHolding}
          className="gap-2 rounded-xl text-xs font-semibold shadow-2xs"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Saham Baru</span>
        </Button>
      </div>
    </div>
  );
}
