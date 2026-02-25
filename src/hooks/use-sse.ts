"use client";

import { useState, useEffect, useCallback } from "react";

export type SSEStatus = "idle" | "connected" | "complete" | "error";

export function useSSE<T>(url: string | null) {
  const [events, setEvents] = useState<T[]>([]);
  const [status, setStatus] = useState<SSEStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    if (!url) return;

    setStatus("connected");
    setEvents([]);
    setError(null);

    const abortController = new AbortController();

    fetch(url, { method: "POST", signal: abortController.signal })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          setStatus("error");
          setError(`HTTP ${response.status}`);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop()!;

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "complete") {
                setStatus("complete");
              } else if (data.type === "error") {
                setStatus("error");
                setError(data.message);
              } else {
                setEvents((prev) => [...prev, data as T]);
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }

        // Stream ended without explicit complete event
        setStatus((prev) => (prev === "connected" ? "complete" : prev));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => abortController.abort();
  }, [url]);

  return { events, status, error, start };
}
