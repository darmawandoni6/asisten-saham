'use client';

import { useCallback, useRef, useState } from 'react';

import { api } from '@/lib/api';
import { RecoveryChatMessage, RecoveryDiscussion } from '@/types';

export interface RecoveryChatItem {
  role: 'user' | 'assistant';
  text: string;
  source?: string;
}

export interface UseRecoveryDiscussionReturn {
  activeScenarioModal: string | null;
  discussionData: RecoveryDiscussion | null;
  isDiscussionLoading: boolean;
  chatHistory: RecoveryChatItem[];
  customQuestion: string;
  isSubmittingQuestion: boolean;
  retryingIndex: number | null;
  setCustomQuestion: React.Dispatch<React.SetStateAction<string>>;
  openDiscussion: (scenarioId: string) => Promise<void>;
  closeDiscussion: () => void;
  askQuestion: (questionText: string) => Promise<void>;
  retryDeepDive: () => Promise<void>;
  retryQuestion: (assistantIdx: number) => Promise<void>;
  clearChatHistory: () => Promise<void>;
}

export function useRecoveryDiscussion(selectedTicker: string): UseRecoveryDiscussionReturn {
  const [activeScenarioModal, setActiveScenarioModal] = useState<string | null>(null);
  const [discussionData, setDiscussionData] = useState<RecoveryDiscussion | null>(null);
  const [isDiscussionLoading, setIsDiscussionLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<RecoveryChatItem[]>([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [retryingIndex, setRetryingIndex] = useState<number | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const openDiscussion = useCallback(
    async (scenarioId: string) => {
      if (!selectedTicker) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const requestId = ++latestRequestIdRef.current;
      setActiveScenarioModal(scenarioId);
      setIsDiscussionLoading(true);
      setChatHistory([]);
      setCustomQuestion('');
      try {
        const [res, history] = await Promise.all([
          api.discussRecovery(selectedTicker, { scenario_id: scenarioId, provider: '9router' }),
          api.getRecoveryChatHistory(selectedTicker, scenarioId).catch(() => []),
        ]);
        if (requestId === latestRequestIdRef.current) {
          if (res) {
            setDiscussionData(res);
          }
          if (history && history.length > 0) {
            setChatHistory(
              history.map((item: RecoveryChatMessage) => ({
                role: item.role,
                text: item.message,
                source: item.source,
              })),
            );
          }
        }
      } catch (err) {
        console.warn('Error loading scenario discussion:', err);
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsDiscussionLoading(false);
        }
      }
    },
    [selectedTicker],
  );

  const closeDiscussion = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    latestRequestIdRef.current++;
    setActiveScenarioModal(null);
    setDiscussionData(null);
    setChatHistory([]);
    setCustomQuestion('');
  }, []);

  const retryDeepDive = useCallback(async () => {
    if (!activeScenarioModal || isDiscussionLoading || !selectedTicker) return;
    setIsDiscussionLoading(true);
    try {
      const res = await api.discussRecovery(selectedTicker, {
        scenario_id: activeScenarioModal,
        provider: '9router',
        force_refresh: true,
      });
      if (res) {
        setDiscussionData(res);
      }
    } catch (err) {
      console.warn('Error retrying deep dive:', err);
    } finally {
      setIsDiscussionLoading(false);
    }
  }, [activeScenarioModal, isDiscussionLoading, selectedTicker]);

  const retryQuestion = useCallback(
    async (assistantIdx: number) => {
      if (retryingIndex !== null || isSubmittingQuestion || !activeScenarioModal || !selectedTicker) return;
      let questionText = '';
      for (let i = assistantIdx - 1; i >= 0; i--) {
        if (chatHistory[i].role === 'user') {
          questionText = chatHistory[i].text;
          break;
        }
      }
      if (!questionText) return;

      setRetryingIndex(assistantIdx);
      try {
        const res = await api.discussRecovery(selectedTicker, {
          scenario_id: activeScenarioModal,
          user_question: questionText,
          provider: '9router',
          force_refresh: true,
        });
        if (res && res.answer) {
          setChatHistory(prev => {
            const next = [...prev];
            next[assistantIdx] = {
              role: 'assistant',
              text: res.answer || '',
              source: res.source,
            };
            return next;
          });
        }
      } catch (err) {
        console.warn('Retry question error:', err);
      } finally {
        setRetryingIndex(null);
      }
    },
    [activeScenarioModal, chatHistory, isSubmittingQuestion, retryingIndex, selectedTicker],
  );

  const askQuestion = useCallback(
    async (questionText: string) => {
      if (!questionText.trim() || isSubmittingQuestion || !activeScenarioModal || !selectedTicker) return;
      const q = questionText.trim();
      setCustomQuestion('');
      setChatHistory(prev => [...prev, { role: 'user', text: q }]);
      setIsSubmittingQuestion(true);
      try {
        const res = await api.discussRecovery(selectedTicker, {
          scenario_id: activeScenarioModal,
          user_question: q,
          provider: '9router',
        });
        if (res && res.answer) {
          setChatHistory(prev => [...prev, { role: 'assistant', text: res.answer || '', source: res.source }]);
        }
      } catch {
        setChatHistory(prev => [
          ...prev,
          { role: 'assistant', text: 'Maaf, terjadi kendala saat memproses pertanyaan Anda. Silakan coba lagi.' },
        ]);
      } finally {
        setIsSubmittingQuestion(false);
      }
    },
    [activeScenarioModal, isSubmittingQuestion, selectedTicker],
  );

  const clearChatHistory = useCallback(async () => {
    if (!activeScenarioModal || !selectedTicker) return;
    try {
      await api.clearRecoveryChatHistory(selectedTicker, activeScenarioModal);
      setChatHistory([]);
    } catch (err) {
      console.warn('Error clearing chat history:', err);
    }
  }, [activeScenarioModal, selectedTicker]);

  return {
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
  };
}
