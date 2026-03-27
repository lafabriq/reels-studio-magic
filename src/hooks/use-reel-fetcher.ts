import { useState, useCallback } from "react";

export interface ReelData {
  videoUrl: string;
  audioUrl?: string;
  filename?: string;
}

const COBALT_API = "https://api.cobalt.tools/";

function translateError(code: string): string {
  const map: Record<string, string> = {
    "error.api.unreachable_service": "Instagram временно недоступен — попробуй позже",
    "error.api.fetch.short_link": "Не удалось расшифровать короткую ссылку",
    "error.api.link.unsupported": "Ссылка не поддерживается",
    "error.api.link.invalid": "Неверная ссылка на Reel",
    "error.api.content.unavailable": "Видео недоступно (приватный аккаунт?)",
    "error.api.content.too_long": "Видео слишком длинное",
    "error.api.rate_exceeded": "Слишком много запросов — подожди немного",
  };
  return map[code] ?? `Ошибка сервиса: ${code}`;
}

export function useReelFetcher() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReel = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(COBALT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Сервер вернул HTTP ${response.status}`);
      }

      const json = await response.json();

      if (json.status === "error") {
        throw new Error(translateError(json.error?.code ?? "unknown"));
      }

      if (json.status === "tunnel" || json.status === "redirect") {
        setData({ videoUrl: json.url, filename: json.filename });
        return;
      }

      if (json.status === "picker") {
        // picker — несколько вариантов (например, слайды), берём первый видео
        const videoItem = (json.picker as Array<{ type: string; url: string }>)?.find(
          (item) => item.type === "video"
        ) ?? json.picker?.[0];

        if (videoItem) {
          setData({
            videoUrl: videoItem.url,
            audioUrl: json.audio as string | undefined,
            filename: json.audioFilename as string | undefined,
          });
          return;
        }
        throw new Error("Видео не найдено в ответе");
      }

      throw new Error("Неизвестный формат ответа от сервиса");
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
