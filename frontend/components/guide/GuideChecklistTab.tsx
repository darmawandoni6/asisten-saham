'use client';

import Link from 'next/link';

import { ArrowRight, CheckSquare, Square } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { GUIDE_CHECKLIST_ITEMS } from '@/hooks/useGuide';

interface GuideChecklistTabProps {
  checkedItems: Record<number, boolean>;
  onToggleCheck: (id: number) => void;
}

export function GuideChecklistTab({ checkedItems, onToggleCheck }: GuideChecklistTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">Checklist Memulai Aplikasi Asisten Saham</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Centang setiap langkah setelah Anda mencobanya untuk memastikan Anda menguasai seluruh alur aplikasi
        </p>
      </div>

      <Card className="space-y-3 rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
        <CardContent className="space-y-3 p-0">
          {GUIDE_CHECKLIST_ITEMS.map(item => {
            const isDone = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => onToggleCheck(item.id)}
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition-all ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button type="button" className="mt-0.5 text-emerald-600 focus:outline-none">
                    {isDone ? (
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                  <div>
                    <h4 className={`text-xs font-bold ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {item.title}
                    </h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                </div>

                <Link
                  href={item.href}
                  onClick={e => e.stopPropagation()}
                  className="flex shrink-0 items-center gap-1 self-center text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>{item.linkText}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
