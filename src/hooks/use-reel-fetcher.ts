import { useState, useCallback } from "react";

export interface ReelData {
  videoUrl: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * Хук для получения прямой ссылки на видео из Instagram Reels.
 *
 * Схема: sessionid из localStorage → POST /api/reel → { videoUrl }
 *
 * sessionid сохраняется компонентом InstagramLogin после логина.
 */
export function useReelFetcher() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReel = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    const sessionid = localStorage.getItem("ig_sessionid");
    if (!sessionid) {
      setError("Сначала войди в Instagram — форма выше");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/reel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, sessionid }),
      });

      const json = await res.json() as { videoUrl?: string; error?: string };

      if (!res.ok || !json.videoUrl) {
        if (res.status === 401) {
          localStorage.removeItem("ig_sessionid");
        }
        throw new Error(json.error ?? `Ошибка ${res.status}`);
      }

      setData({ videoUrl: json.videoUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { fetchReel, reset, isLoading, data, error };
}
