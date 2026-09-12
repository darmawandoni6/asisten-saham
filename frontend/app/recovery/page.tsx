'use client';

import { Topbar } from '@/components/Topbar';
import { AverageDownCalculatorCard } from '@/components/recovery/AverageDownCalculatorCard';
import { RecoveryAISummaryCard } from '@/components/recovery/RecoveryAISummaryCard';
import { RecoveryDiagnosisCard } from '@/components/recovery/RecoveryDiagnosisCard';
import { RecoveryEmptyState } from '@/components/recovery/RecoveryEmptyState';
import { RecoveryScenariosGrid } from '@/components/recovery/RecoveryScenariosGrid';
import { RecoveryStockSelector } from '@/components/recovery/RecoveryStockSelector';
import { ScenarioDiscussionModal } from '@/components/recovery/ScenarioDiscussionModal';
import { useRecovery } from '@/hooks/useRecovery';
import { useRecoveryDiscussion } from '@/hooks/useRecoveryDiscussion';

export default function RecoveryPage() {
  const {
    holdings,
    selectedTicker,
    data,
    isLoading,
    isRegenerating,
    calcMode,
    setCalcMode,
    calcBuyPrice,
    setCalcBuyPrice,
    calcAddLot,
    setCalcAddLot,
    calcTargetAvg,
    setCalcTargetAvg,
    calcBudget,
    setCalcBudget,
    calcResult,
    loadData,
    selectStock,
    regenerateRecommendation,
  } = useRecovery();

  const {
    activeScenarioModal,
    discussionData,
    isDiscussionLoading,
    chatHistory,
    customQuestion,
    isSubmittingQuestion,
    retryingIndex,
    setCustomQuestion,
    openDiscussion,
    closeDiscussion,
    askQuestion,
    retryDeepDive,
    retryQuestion,
    clearChatHistory,
  } = useRecoveryDiscussion(selectedTicker);

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Recovery Engine (Floating Loss Assessment)"
        subtitle="Analisis penyelamatan saham floating loss & kalkulator average down presisi"
        onRefresh={loadData}
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
        {/* Ticker Selector & Kas Summary */}
        <RecoveryStockSelector
          holdings={holdings}
          selectedTicker={selectedTicker}
          cashBalance={data?.cashBalance}
          onSelectStock={selectStock}
        />

        {/* Empty State when no stocks require recovery */}
        {holdings.length === 0 && !isLoading && <RecoveryEmptyState />}

        {data && (
          <>
            {/* 1. Diagnosis Kerugian Card */}
            <RecoveryDiagnosisCard data={data} />

            {/* 2. AI Summary Card */}
            <RecoveryAISummaryCard
              ticker={selectedTicker}
              aiRecommendation={data.aiRecommendation}
              isRegenerating={isRegenerating}
              onRegenerate={regenerateRecommendation}
            />

            {/* 3. Skenario Penyelamatan AI — 3 Kartu */}
            <RecoveryScenariosGrid
              scenarios={data.scenarios}
              aiRecommendation={data.aiRecommendation}
              onOpenDiscussion={openDiscussion}
            />

            {/* 4. Kalkulator Penambahan Lot & Averaging (3 Mode) */}
            <AverageDownCalculatorCard
              data={data}
              calcMode={calcMode}
              setCalcMode={setCalcMode}
              calcBuyPrice={calcBuyPrice}
              setCalcBuyPrice={setCalcBuyPrice}
              calcAddLot={calcAddLot}
              setCalcAddLot={setCalcAddLot}
              calcTargetAvg={calcTargetAvg}
              setCalcTargetAvg={setCalcTargetAvg}
              calcBudget={calcBudget}
              setCalcBudget={setCalcBudget}
              calcResult={calcResult}
            />
          </>
        )}
      </div>

      {/* Modal Diskusi / Bedah Logika Skenario AI */}
      <ScenarioDiscussionModal
        isOpen={Boolean(activeScenarioModal)}
        selectedTicker={selectedTicker}
        discussionData={discussionData}
        isLoading={isDiscussionLoading}
        chatHistory={chatHistory}
        customQuestion={customQuestion}
        isSubmittingQuestion={isSubmittingQuestion}
        retryingIndex={retryingIndex}
        onClose={closeDiscussion}
        onAskQuestion={askQuestion}
        onRetryDeepDive={retryDeepDive}
        onRetryQuestion={retryQuestion}
        onClearChatHistory={clearChatHistory}
        onChangeCustomQuestion={setCustomQuestion}
      />
    </main>
  );
}
