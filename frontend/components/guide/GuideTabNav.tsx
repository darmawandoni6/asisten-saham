'use client';

import { BookOpen, CheckSquare, Clock, Compass, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { GuideTab } from '@/hooks/useGuide';

interface GuideTabNavProps {
  activeTab: GuideTab;
  onSelectTab: (tab: GuideTab) => void;
}

const GUIDE_TABS = [
  { id: 'FLOW' as const, label: '1. Siklus Rutinitas 17:30', icon: Clock },
  { id: 'FEATURES' as const, label: '2. Panduan 4 Fitur', icon: Compass },
  {
    id: 'STATUS' as const,
    label: '3. Kamus Lengkap & Glosarium',
    icon: BookOpen,
  },
  { id: 'RULES' as const, label: '4. SOP Anti-Nyangkut', icon: ShieldAlert },
  {
    id: 'CHECKLIST' as const,
    label: '5. Checklist Pemula',
    icon: CheckSquare,
  },
];

export function GuideTabNav({ activeTab, onSelectTab }: GuideTabNavProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-1">
      {GUIDE_TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            onClick={() => onSelectTab(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              isActive
                ? 'bg-slate-900 text-white shadow-2xs hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
