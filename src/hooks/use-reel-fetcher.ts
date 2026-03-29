import { useState, useCallback, useRef } from "react";

export type ReelData = {
  videoUrl: string;
};

const REPO = "lafabriq/reels-studio-magic";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main`;

// GitHub dispatch token — stored in localStorage under "gh_token"
// Set via URL hash: #setup/<token>  (done once by the developer)
export function getGhToken(): string {
  return localStorage.getItem("gh_token") ?? (import.meta.env.VITE_GITHUB_TOKEN as string ?? "");
}

export type FetcherMode = "ready" | "no-token" | "no-session";

export function getFetcherMode(): FetcherMode {
  if (!getGhToken()) return "no-token";
  return "ready"; // session check is deferred to runtime
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function dispatch(eventType: string, payload: Record<string, unknown>): Promise<void> {
  const token = getGhToken();
  const res = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({ event_type: eventType, client_payload: payload }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Workflow dispatch failed (${res.status}): ${txt.slice(0, 200)}`);
  }
}

type ResultFile = Record<string, unknown>;

export async function pollResult(
  resultPath: string,
  signal: AbortSignal,
  timeoutMs = 120_000,
): Promise<ResultFile> {
  const url = `${RAW_BASE}/${resultPath}`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline && !signal.aborted) {
    await new Promise<void>((r) => setTimeout(r, 3000));
    try {
      const res = await fetch(`${url}?nocache=${Date.now()}`, { signal });
      if (res.ok) {
        return (await res.json()) as ResultFile;
      }
    } catch {
      // 404 = not ready yet, keep polling
    }
  }
  throw new Error("Timeout: GitHub Actions не завершился за 2 минуты");
}

// ---------------------------------------------------------------------------
// useReelFetcher
// ---------------------------------------------------------------------------

export function useReelFetcher() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchReel = useCallback(async (url: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const token = getGhToken();
      if (!token) {
        throw new Error("GitHub токен не настроен. Обратитесь к разработчику.");
      }

      const requestId = Math.random().toString(36).slice(2, 10);
      await dispatch("get_reel", { reel_url: url, request_id: requestId });

      const result = await pollResult(
        `results/reel-${requestId}.json`,
        ctrl.signal,
      );

      if (result.error) throw new Error(result.error as string);
      if (!result.url) throw new Error("Видео не найдено");

      setData({ videoUrl: result.url as string });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setData(null);
    setError(null);
  }, []);

  return { fetchReel, reset, isLoading, data, error };
}
