'use client';

import { useEffect } from 'react';

import { Topbar } from '@/components/Topbar';
import { ScreenerCardView } from '@/components/screener/ScreenerCardView';
import { ScreenerChartModal } from '@/components/screener/ScreenerChartModal';
import { ScreenerCustomAnalyzer } from '@/components/screener/ScreenerCustomAnalyzer';
import { ScreenerEmptyState } from '@/components/screener/ScreenerEmptyState';
import { ScreenerKamusModal } from '@/components/screener/ScreenerKamusModal';
import { ScreenerPhilosophyCard } from '@/components/screener/ScreenerPhilosophyCard';
import { ScreenerTableView } from '@/components/screener/ScreenerTableView';
import { ScreenerToolbar } from '@/components/screener/ScreenerToolbar';
import { useScreener } from '@/hooks/useScreener';
import { useScreenerDiscussion } from '@/hooks/useScreenerDiscussion';

export default function ScreenerPage() {
  const {
    activeTab,
    setActiveTab,
    items,
    searchQuery,
    setSearchQuery,
    isScanning,
    isKamusOpen,
    setIsKamusOpen,
    sortField,
    sortDirection,
    handleSort,
    setSortField,
    setSortDirection,
    viewMode,
    setViewMode,
    selectedChartTicker,
    setSelectedChartTicker,
    maxPriceFilter,
    setMaxPriceFilter,
    customTickerInput,
    setCustomTickerInput,
    isAnalyzingCustom,
    customFeedback,
    setCustomFeedback,
    loadScreener,
    handleRunScan,
    handleAnalyzeCustomTicker,
    filteredItems,
    sortedItems,
  } = useScreener();

  const {
    discussions,
    activeCardDiscussionTicker,
    expandedTableTicker,
    handleSendDiscussionQuestion,
    handleClearChatHistory,
    setInputQuestion,
    toggleCardDiscussion,
    toggleTableExpand,
    resetDiscussions,
  } = useScreenerDiscussion();

  useEffect(() => {
    loadScreener();
  }, [loadScreener]);

  const onRunScan = () => {
    handleRunScan(() => {
      resetDiscussions();
    });
  };

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Pusat Rekomendasi Saham & Watchlist Terkurasi (EOD)"
        subtitle="Daftar saham pilihan berbasis evaluasi teknikal objektif pasca penutupan bursa (17:30 WIB)"
        onRefresh={loadScreener}
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
        {/* Custom On-Demand Stock Analyzer */}
        <ScreenerCustomAnalyzer
          customTickerInput={customTickerInput}
          setCustomTickerInput={setCustomTickerInput}
          isAnalyzingCustom={isAnalyzingCustom}
          customFeedback={customFeedback}
          setCustomFeedback={setCustomFeedback}
          handleAnalyzeCustomTicker={handleAnalyzeCustomTicker}
        />

        {/* Toolbar & Strategy/Price Filter Bar */}
        <ScreenerToolbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalItemsCount={items.length}
          filteredItemsCount={filteredItems.length}
          isScanning={isScanning}
          handleRunScan={onRunScan}
          setIsKamusOpen={setIsKamusOpen}
          maxPriceFilter={maxPriceFilter}
          setMaxPriceFilter={setMaxPriceFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortField={sortField}
          sortDirection={sortDirection}
          setSortField={setSortField}
          setSortDirection={setSortDirection}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Content Section: Cards vs Table vs Empty State */}
        {sortedItems.length > 0 ? (
          viewMode === 'cards' ? (
            <ScreenerCardView
              items={sortedItems}
              activeDiscussionTicker={activeCardDiscussionTicker}
              discussions={discussions}
              onToggleDiscussion={toggleCardDiscussion}
              onOpenChart={ticker => setSelectedChartTicker(ticker)}
              onOpenKamus={() => setIsKamusOpen(true)}
              onSendQuestion={handleSendDiscussionQuestion}
              onClearHistory={handleClearChatHistory}
              onInputChange={setInputQuestion}
            />
          ) : (
            <ScreenerTableView
              items={sortedItems}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              expandedTicker={expandedTableTicker}
              onToggleExpand={toggleTableExpand}
              discussions={discussions}
              onOpenChart={ticker => setSelectedChartTicker(ticker)}
              onOpenKamus={() => setIsKamusOpen(true)}
              onSendQuestion={handleSendDiscussionQuestion}
              onClearHistory={handleClearChatHistory}
              onInputChange={setInputQuestion}
            />
          )
        ) : (
          <ScreenerEmptyState isScanning={isScanning} onRunScan={onRunScan} />
        )}

        {/* Screener Philosophy Info Box */}
        <ScreenerPhilosophyCard />
      </div>

      {/* Modal Interactive Candlestick Chart */}
      <ScreenerChartModal ticker={selectedChartTicker} onClose={() => setSelectedChartTicker(null)} />

      {/* Modal Bantuan Cepat: Kamus Badge Screener */}
      <ScreenerKamusModal isOpen={isKamusOpen} onClose={() => setIsKamusOpen(false)} />
    </main>
  );
}
