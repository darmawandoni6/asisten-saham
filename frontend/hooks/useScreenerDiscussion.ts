'use client';

import { useState } from 'react';

import { api } from '@/lib/api';
import { ScreenerChatMessage, ScreenerDiscussionResponse } from '@/types';

export interface ScreenerDiscussionState {
  isLoading: boolean;
  isSending: boolean;
  data: ScreenerDiscussionResponse | null;
  messages: ScreenerChatMessage[];
  inputQuestion: string;
  error: string | null;
}

export function useScreenerDiscussion() {
  const [discussions, setDiscussions] = useState<Record<string, ScreenerDiscussionState>>({});
  const [activeCardDiscussionTicker, setActiveCardDiscussionTicker] = useState<string | null>(null);
  const [expandedTableTicker, setExpandedTableTicker] = useState<string | null>(null);

  const initDiscussion = async (ticker: string, force = false) => {
    if (!ticker) return;
    const current = discussions[ticker];
    if (current?.data && !force && current.messages.length > 0) return;

    setDiscussions(prev => ({
      ...prev,
      [ticker]: {
        isLoading: true,
        isSending: false,
        data: prev[ticker]?.data || null,
        messages: prev[ticker]?.messages || [],
        inputQuestion: prev[ticker]?.inputQuestion || '',
        error: null,
      },
    }));

    try {
      const [history, discRes] = await Promise.all([
        api.getScreenerChatHistory(ticker).catch(() => []),
        api.discussScreener(ticker, {}).catch(() => null),
      ]);

      setDiscussions(prev => ({
        ...prev,
        [ticker]: {
          isLoading: false,
          isSending: false,
          data: discRes,
          messages: history && history.length > 0 ? history : [],
          inputQuestion: prev[ticker]?.inputQuestion || '',
          error: null,
        },
      }));
    } catch (err: unknown) {
      console.warn('Error initializing screener discussion:', err);
      setDiscussions(prev => ({
        ...prev,
        [ticker]: {
          isLoading: false,
          isSending: false,
          data: prev[ticker]?.data || null,
          messages: prev[ticker]?.messages || [],
          inputQuestion: prev[ticker]?.inputQuestion || '',
          error: err instanceof Error ? err.message : 'Gagal memuat analisis AI',
        },
      }));
    }
  };

  const handleSendDiscussionQuestion = async (ticker: string, questionText?: string) => {
    const q = (questionText || discussions[ticker]?.inputQuestion || '').trim();
    if (!q) return;

    // Optimistically update user message
    const tempUserMsg: ScreenerChatMessage = {
      ticker,
      role: 'user',
      message: q,
      createdAt: new Date().toISOString(),
    };

    setDiscussions(prev => ({
      ...prev,
      [ticker]: {
        ...(prev[ticker] || {
          isLoading: false,
          data: null,
          error: null,
        }),
        isSending: true,
        inputQuestion: '',
        messages: [...(prev[ticker]?.messages || []), tempUserMsg],
      },
    }));

    try {
      const res = await api.discussScreener(ticker, { question: q });
      if (res) {
        setDiscussions(prev => ({
          ...prev,
          [ticker]: {
            isLoading: false,
            isSending: false,
            data: res,
            messages: res.history || [
              ...(prev[ticker]?.messages || []),
              {
                ticker,
                role: 'assistant',
                message: res.answer,
                source: res.source,
                convictionScore: res.conviction_score,
                createdAt: new Date().toISOString(),
              },
            ],
            inputQuestion: '',
            error: null,
          },
        }));
      }
    } catch (err: unknown) {
      console.error('Error sending screener question:', err);
      setDiscussions(prev => ({
        ...prev,
        [ticker]: {
          ...(prev[ticker] || {
            isLoading: false,
            data: null,
            messages: [],
            inputQuestion: '',
          }),
          isSending: false,
          error: err instanceof Error ? err.message : 'Gagal mengirim pertanyaan ke AI',
        },
      }));
    }
  };

  const handleClearChatHistory = async (ticker: string) => {
    try {
      await api.clearScreenerChatHistory(ticker);
      setDiscussions(prev => ({
        ...prev,
        [ticker]: {
          ...(prev[ticker] || {
            isLoading: false,
            isSending: false,
            data: null,
            inputQuestion: '',
            error: null,
          }),
          messages: [],
        },
      }));
      initDiscussion(ticker, true);
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  const setInputQuestion = (ticker: string, question: string) => {
    setDiscussions(prev => ({
      ...prev,
      [ticker]: {
        ...(prev[ticker] || {
          isLoading: false,
          isSending: false,
          data: null,
          messages: [],
          error: null,
        }),
        inputQuestion: question,
      },
    }));
  };

  const toggleCardDiscussion = (ticker: string) => {
    const nextTicker = activeCardDiscussionTicker === ticker ? null : ticker;
    setActiveCardDiscussionTicker(nextTicker);
    if (nextTicker) {
      initDiscussion(nextTicker);
    }
  };

  const toggleTableExpand = (ticker: string) => {
    const nextTicker = expandedTableTicker === ticker ? null : ticker;
    setExpandedTableTicker(nextTicker);
    if (nextTicker) {
      initDiscussion(nextTicker);
    }
  };

  const resetDiscussions = () => {
    setDiscussions({});
  };

  return {
    discussions,
    activeCardDiscussionTicker,
    setActiveCardDiscussionTicker,
    expandedTableTicker,
    setExpandedTableTicker,
    initDiscussion,
    handleSendDiscussionQuestion,
    handleClearChatHistory,
    setInputQuestion,
    toggleCardDiscussion,
    toggleTableExpand,
    resetDiscussions,
  };
}
