import { useState, useCallback } from "react";

export interface ReelData {
  videoUrl: string;
  filename?: string;
}

/**
 * URL Cloudflare Worker-прокси.
 *
 * Где взять:
 * 1. cloudflare.com → Workers & Pages → создай Worker из /worker/index.js
 * 2. Settings → Variables → Secret: IG_SESSION_ID = <sessionid из куки instagram.com>
 * 3. Скопируй URL вида https://xxx.workers.dev
 * 4. Запусти билд с VITE_WORKER_URL=https://xxx.workers.dev npm run build
 *    или добавь в GitHub Secrets: VITE_WORKER_URL
 */
const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

/**
 * Хук для загрузки прямой ссылки на видео из Instagram Reels.
 *
 * Схема: POST WORKER_URL → { videoUrl } → <video src={videoUrl}>
 *
 * Требует деплоя Cloudflare Worker (/worker/index.js).
 * Worker хранит Instagram sessionid как env secret и делает
 * server-side запрос к Instagram Mobile API.
 */
export function useReelFetcher() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReel = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      if (!WORKER_URL) {
        throw new Error(
          "Worker не настроен. Задеплой /worker/index.js на Cloudflare и добавь VITE_WORKER_URL в переменные окружения."
        );
      }

      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const json = await response.json() as { videoUrl?: string; error?: string };

      if (!response.ok || json.error) {
        throw new Error(json.error ?? `HTTP ${response.status}`);
      }

      if (!json.videoUrl) {
        throw new Error("Worker не вернул videoUrl");
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
