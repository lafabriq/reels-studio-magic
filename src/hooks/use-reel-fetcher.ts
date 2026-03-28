import { useState, useCallback } from "react";

export interface ReelData {
  embedUrl: string;
  shortcode: string;
  originalUrl: string;
}

/**
 * Извлекает shortcode из любой ссылки на Instagram Reel или пост.
 *
 * Поддерживает форматы:
 *   https://www.instagram.com/reel/SHORTCODE/
 *   https://www.instagram.com/p/SHORTCODE/
 *   https://instagram.com/reel/SHORTCODE
 */
function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Хук для встраивания видео из Instagram Reels через официальный embed.
 *
 * Схема: URL → shortcode → https://www.instagram.com/reel/{shortcode}/embed/
 *
 * Не требует бэкенда, API ключей или аутентификации.
 * Instagram официально предоставляет embed-систему для публичных постов.
 */
export function useReelFetcher() {
  const [data, setData] = useState<ReelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReel = useCallback((url: string) => {
    setError(null);
    setData(null);

    const shortcode = extractShortcode(url.trim());

    if (!shortcode) {
      setError(
        "Неверная ссылка. Вставь ссылку вида instagram.com/reel/XXXXX/ или instagram.com/p/XXXXX/"
      );
      return;
    }

    setData({
      embedUrl: `https://www.instagram.com/reel/${shortcode}/embed/`,
      shortcode,
      originalUrl: url.trim(),
    });
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { fetchReel, reset, isLoading: false, data, error };
}
