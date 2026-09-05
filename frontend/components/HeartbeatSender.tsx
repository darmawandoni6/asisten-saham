"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

export function HeartbeatSender() {
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch("/api/v1/system/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {
        // Fallback to absolute URL if needed
        fetch("http://localhost:8000/api/v1/system/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      });
    };

    // Initial heartbeat
    sendHeartbeat();

    // Heartbeat every 15 seconds
    const interval = setInterval(sendHeartbeat, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
