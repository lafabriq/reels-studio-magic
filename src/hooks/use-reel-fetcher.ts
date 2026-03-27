import { useState, useCallback } from "react";

export interface ReelData {
  videoUrl: string;
  audioUrl?: string;
  filename?: string;
}

// Public cobalt instance with CORS enabled (access-control-allow-origin: *)
const COBALT_API = "https://cobalt-backend.canine.tools/";
const TURNSTILE_SITEKEY = "0x4AAAAAABBCV3tPrCXT9h2H";

declare const turnstile: {
  render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  getResponse: (widgetId: string) => string | undefined;
};

/** Solve Cloudflare Turnstile invisibly and return the token */
function solveTurnstile(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a hidden container
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;bottom:0;right:0;width:0;height:0;overflow:hidden;";
    document.body.appendChild(container);

    const timeout = setTimeout(() => {
      try { turnstile.remove(widgetId); } catch {}
      container.remove();
      reject(new Error("Turnstile timeout — попробуй ещё раз"));
    }, 30000);

    let widgetId: string;
    try {
      widgetId = turnstile.render(container, {
        sitekey: TURNSTILE_SITEKEY,
        theme: "dark",
        size: "invisible",
        callback: (token: string) => {
          clearTimeout(timeout);
          try { turnstile.remove(widgetId); } catch {}
          container.remove();
          resolve(token);
        },
        "error-callback": () => {
          clearTimeout(timeout);
          try { turnstile.remove(widgetId); } catch {}
          container.remove();
          reject(new Error("Ошибка проверки Cloudflare — попробуй ещё раз"));
        },
      });
    } catch (e) {
      clearTimeout(timeout);
      container.remove();
      reject(e);
    }
  });
}

/** Exchange Turnstile token for JWT bearer */
async function getJwt(): Promise<string> {
  const turnstileToken = await solveTurnstile();
  const res = await fetch(`${COBALT_API}session`, {
    method: "POST",
    headers: { "cf-turnstile-response": turnstileToken },
  });
  if (!res.ok) throw new Error(`Session HTTP ${res.status}`);
  const json = await res.json();
  if (!json.token) throw new Error("JWT не получен");
  return json.token as string;
}

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
      // Step 1: get JWT via Turnstile
      const jwt = await getJwt();

      // Step 2: call cobalt API
      const response = await fetch(COBALT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${jwt}`,
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
