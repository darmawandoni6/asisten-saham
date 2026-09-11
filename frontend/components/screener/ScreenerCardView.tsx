'use client';

import { ScreenerDiscussionState } from '@/hooks/useScreenerDiscussion';
import { ScreenerItem } from '@/types';

import { ScreenerCardItem } from './ScreenerCardItem';

interface ScreenerCardViewProps {
  items: ScreenerItem[];
  activeDiscussionTicker: string | null;
  discussions: Record<string, ScreenerDiscussionState>;
  onToggleDiscussion: (ticker: string) => void;
  onOpenChart: (ticker: string) => void;
  onOpenKamus: () => void;
  onSendQuestion: (ticker: string, questionText?: string) => void;
  onClearHistory: (ticker: string) => void;
  onInputChange: (ticker: string, text: string) => void;
}

export function ScreenerCardView({
  items,
  activeDiscussionTicker,
  discussions,
  onToggleDiscussion,
  onOpenChart,
  onOpenKamus,
  onSendQuestion,
  onClearHistory,
  onInputChange,
}: ScreenerCardViewProps) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <ScreenerCardItem
          key={item.ticker}
          item={item}
          index={idx}
          isDiscussionActive={activeDiscussionTicker === item.ticker}
          discussion={
            discussions[item.ticker] || {
              isLoading: false,
              isSending: false,
              data: null,
              messages: [],
              inputQuestion: '',
              error: null,
            }
          }
          onToggleDiscussion={onToggleDiscussion}
          onOpenChart={onOpenChart}
          onOpenKamus={onOpenKamus}
          onSendQuestion={onSendQuestion}
          onClearHistory={onClearHistory}
          onInputChange={onInputChange}
        />
      ))}
    </div>
  );
}
