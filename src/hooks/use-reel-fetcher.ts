import { useState, useCallback, useRef } from "react";

export type ReelData = {
  videoUrl: string;
};

// Build-time env vars — baked into the static JS bundle
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
const API_BASE = (import.meta.env.VITE_API_URL ?? "") as string;

/** GitHub repo used for repository_dispatch and result Gist */
const GITHUB_REPO = "lafabriq/reels-studio-magic";

/**
 * Operating mode (resolved once at module load):
 * - "github-actions" — trigger workflow via GitHub API, poll result Gist
 * - "vercel"         — POST /api/reel with sessionid from localStorage
 * - "none"           — not configured, show setup prompt
 */
export type FetcherMode = "github-actions" | "vercel" | "none";

export const fetcherMode: FetcherMode = GITHUB_TOKEN
  ? "github-actions"
  : API_BASE
  ? "vercel"
  : "none";

// ---------------------------------------------------------------------------
// GitHub Actions mode helpers
// ---------------------------------------------------------------------------

type GistFile = { content?: string };
type GistResponse = { files: Record<string, GistFile> };
type GistListItem = { id: string; description: string };

async function findResultGist(token: string): Promise<string | null> {
  const res = await fetch("https://api.github.com/gists?per_page=50", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return null;
  const list = (await res.json()) as GistListItem[];
  return list.find((g) => g.description === "reels-studio-result")?.id ?? null;
}

async function pollForResult(
  token: string,
  requestId: string,
  signal: AbortSignal,
): Promise<string> {
  // Wait up to 30 s for the Gist to appear (created on first workflow run)
  let gistId: string | null = null;
  for (let attempt = 0; attempt < 15 && !signal.aborted; attempt++) {
    await new Promise<void>((r) => setTimeout(r, 3000));
    gistId = await findResultGist(token);
    if (gistId) break;
  }

  if (!gistId) {
    throw new Error(
      "Gist с результатами не найден. Убедись что VITE_GITHUB_TOKEN имеет доступ к Gist.",
    );
  }

  // Poll Gist for the specific request (up to 2 min)
  for (let i = 0; i < 60 && !signal.aborted; i++) {
    await new Promise<void>((r) => setTimeout(r, 2000));
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      signal,
    });
    if (res.ok) {
      const gist = (await res.json()) as GistResponse;
      const content = gist.files["result.json"]?.content;
      if (content) {
        const result = JSON.parse(content) as {
          req?: string;
          url?: string;
          error?: string;
        };
        if (result.req === requestId) {
          if (result.error) throw new Error(result.error);
          if (result.url) return result.url;
        }
      }
    }
  }
  throw new Error("Timeout: GitHub Actions не завершился за 2 минуты");
}

// ---------------------------------------------------------------------------
// Hook
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
      if (fetcherMode === "none") {
        throw new Error(
          "Бэкенд не настроен — добавь GitHub Secrets согласно README",
        );
      }

      if (fetcherMode === "github-actions") {
        const requestId = Math.random().toString(36).slice(2, 10);

        const dispatchRes = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              "Content-Type": "application/json",
              Accept: "application/vnd.github.v3+json",
            },
            body: JSON.stringify({
              event_type: "get_reel",
              client_payload: { reel_url: url, request_id: requestId },
            }),
            signal: ctrl.signal,
          },
        );

        if (!dispatchRes.ok) {
          const txt = await dispatchRes.text().catch(() => "");
          throw new Error(
            `Ошибка запуска workflow (${dispatchRes.status}): ${txt}`,
          );
        }

        const videoUrl = await pollForResult(GITHUB_TOKEN!, requestId, ctrl.signal);
        setData({ videoUrl });
      } else {
        // Vercel / same-origin API mode
        const sessionid = localStorage.getItem("ig_sessionid");
        if (!sessionid) {
          throw new Error("Сначала войди в Instagram — форма выше");
        }

        const res = await fetch(`${API_BASE}/api/reel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, sessionid }),
          signal: ctrl.signal,
        });

        const json = (await res.json()) as { videoUrl?: string; error?: string };

        if (!res.ok || !json.videoUrl) {
          if (res.status === 401) localStorage.removeItem("ig_sessionid");
          throw new Error(json.error ?? `Ошибка ${res.status}`);
        }

        setData({ videoUrl: json.videoUrl });
      }
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
