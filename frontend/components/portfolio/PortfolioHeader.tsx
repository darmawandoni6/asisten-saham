'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PortfolioHeaderProps {
  onOpenAddHolding: () => void;
  totalHoldings: number;
}

export function PortfolioHeader({ onOpenAddHolding, totalHoldings }: PortfolioHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-base font-bold text-slate-900">Daftar Trading Plan Aktif</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Kelola parameter trading plan, target profit, stop loss, dan aksi jual untuk {totalHoldings} saham aktif
        </p>
      </div>

      <Button
        type="button"
        variant="emerald"
        size="sm"
        onClick={onOpenAddHolding}
        className="gap-2 self-start rounded-xl text-xs font-semibold shadow-2xs sm:self-auto"
      >
        <Plus className="h-4 w-4" />
        <span>Tambah Saham Baru</span>
      </Button>
    </div>
  );
}
