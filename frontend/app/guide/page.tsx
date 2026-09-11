'use client';

import { Topbar } from '@/components/Topbar';
import {
  GuideChecklistTab,
  GuideFeaturesTab,
  GuideFlowTab,
  GuideHeroBanner,
  GuideRiskRulesTab,
  GuideStatusDictionaryTab,
  GuideTabNav,
} from '@/components/guide';
import { useGuide } from '@/hooks/useGuide';

export default function GuidePage() {
  const { activeTab, setActiveTab, checkedItems, toggleCheck } = useGuide();

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Panduan Cara Pakai & SOP Trading"
        subtitle="Standar operasional prosedur trading EOD & panduan lengkap fitur Asisten Saham"
      />

      <div className="mx-auto w-full max-w-6xl space-y-8 p-6">
        {/* Hero Banner: EOD Philosophy */}
        <GuideHeroBanner />

        {/* Tab Navigation */}
        <GuideTabNav activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Tab 1: Siklus Rutinitas 17:30 */}
        {activeTab === 'FLOW' && <GuideFlowTab />}

        {/* Tab 2: Panduan 4 Fitur Utama & SOP Screener */}
        {activeTab === 'FEATURES' && <GuideFeaturesTab />}

        {/* Tab 3: Kamus Lengkap Badge & Glosarium */}
        {activeTab === 'STATUS' && <GuideStatusDictionaryTab />}

        {/* Tab 4: SOP Anti-Nyangkut (Risk Rules) */}
        {activeTab === 'RULES' && <GuideRiskRulesTab />}

        {/* Tab 5: Checklist Pemula */}
        {activeTab === 'CHECKLIST' && <GuideChecklistTab checkedItems={checkedItems} onToggleCheck={toggleCheck} />}
      </div>
    </main>
  );
}
