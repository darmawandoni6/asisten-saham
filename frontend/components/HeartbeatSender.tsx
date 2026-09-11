'use client';

import { useEffect } from 'react';

import { api } from '@/lib/api';

export function HeartbeatSender() {
  useEffect(() => {
    const sendHeartbeat = () => {
      api.sendHeartbeat().catch(() => {});
    };

    // Initial heartbeat
    sendHeartbeat();

    // Heartbeat every 15 seconds
    const interval = setInterval(sendHeartbeat, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
