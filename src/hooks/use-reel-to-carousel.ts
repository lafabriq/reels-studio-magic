import { useState, useCallback, useRef } from 'react';
import type { SlideData } from '@/lib/carousel-types';

const COBALT_API = 'https://cobalt-backend.canine.tools';

type Status =
  | 'idle'
  | 'turnstile'
  | 'fetching-video'
  | 'downloading'
  | 'loading-model'
  | 'transcribing'
  | 'generating'
  | 'done'
  | 'error';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: string | HTMLElement,
        opts: Record<string, unknown>,
      ) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

/** Wait until `window.turnstile` is available (script loaded). */
function waitForTurnstile(ms = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const start = Date.now();
    const iv = setInterval(() => {
      if (window.turnstile) { clearInterval(iv); resolve(); return; }
      if (Date.now() - start > ms) {
        clearInterval(iv);
        reject(new Error(
          'Скрипт Turnstile не загрузился. Открой страницу в обычном браузере (Chrome / Firefox) и обнови её.'
        ));
      }
    }, 200);
  });
}

/** Fetch Turnstile sitekey from cobalt API server info. */
async function fetchSitekey(): Promise<string> {
  const res = await fetch(COBALT_API, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`cobalt API недоступен (${res.status})`);
  const data = await res.json();
  const key = data?.cobalt?.turnstileSitekey;
  if (!key) throw new Error('cobalt не сообщил Turnstile sitekey');
  return key;
}

export function useReelToCarousel() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);

  const stop = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setProgress(0);
  }, []);

  // ── Turnstile ──────────────────────────────────────────────
  const getTurnstileToken = async (): Promise<string> => {
    await waitForTurnstile();

    const sitekey = await fetchSitekey();

    return new Promise((resolve, reject) => {
      // Container MUST be in the layout flow — not display:none and not 0×0.
      // Turnstile invisible widget needs ≥1×1 visible pixel.
      let container = document.getElementById('cf-turnstile');
      if (!container) {
        container = document.createElement('div');
        container.id = 'cf-turnstile';
        container.style.cssText =
          'position:fixed;bottom:0;right:0;width:65px;height:65px;overflow:hidden;z-index:99999;opacity:0.01;pointer-events:none';
        document.body.appendChild(container);
      }
      container.innerHTML = '';

      const timer = setTimeout(() => {
        reject(new Error(
          'Turnstile таймаут. Открой страницу в обычном браузере (Chrome или Firefox) вместо встроенного.'
        ));
      }, 20_000);

      try {
        window.turnstile!.render(container, {
          sitekey,
          callback: (token: string) => {
            clearTimeout(timer);
            resolve(token);
          },
          'error-callback': (code: string) => {
            clearTimeout(timer);
            reject(new Error(
              `Turnstile ошибка [${code || '?'}]. Попробуй в Chrome/Firefox.`
            ));
          },
          'expired-callback': () => {
            clearTimeout(timer);
            reject(new Error('Turnstile токен истёк — попробуй ещё раз'));
          },
          size: 'compact',
          theme: 'dark',
          appearance: 'interaction-only',
          retry: 'auto',
          'retry-interval': 2000,
        });
      } catch (e) {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  };

  // ── Cobalt JWT ─────────────────────────────────────────────
  const getJwt = async (turnstileToken: string): Promise<string> => {
    const res = await fetch(`${COBALT_API}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ turnstileResponse: turnstileToken }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Cobalt session error (${res.status}): ${t.slice(0, 150)}`);
    }
    const d = await res.json();
    return d.token || d.jwt || (() => { throw new Error('Cobalt не вернул JWT'); })();
  };

  // ── Cobalt audio URL ──────────────────────────────────────
  const getAudioUrl = async (reelUrl: string, jwt: string): Promise<string> => {
    const res = await fetch(COBALT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ url: reelUrl, downloadMode: 'audio', audioFormat: 'wav' }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Cobalt ошибка (${res.status}): ${t.slice(0, 150)}`);
    }
    const d = await res.json();
    if (d.status === 'tunnel' || d.status === 'redirect') return d.url;
    if (d.status === 'error') {
      const c = d.error?.code || 'unknown';
      if (c.includes('video.unavailable') || c.includes('post.unavailable'))
        throw new Error('Видео недоступно — возможно, аккаунт приватный или ссылка неверна');
      throw new Error(`Cobalt: ${c}`);
    }
    throw new Error(`Cobalt: неожиданный ответ "${d.status}"`);
  };

  // ── Main pipeline ─────────────────────────────────────────
  const process = useCallback(
    async (reelUrl: string, onSlides: (slides: SlideData[]) => void) => {
      abortRef.current = false;
      setError('');
      setTranscript('');
      setProgress(0);

      try {
        // 1. Turnstile
        setStatus('turnstile');
        setProgress(5);
        const token = await getTurnstileToken();
        if (abortRef.current) return;

        // 2. JWT
        setProgress(10);
        const jwt = await getJwt(token);
        if (abortRef.current) return;

        // 3. Audio URL
        setStatus('fetching-video');
        setProgress(15);
        const audioUrl = await getAudioUrl(reelUrl, jwt);
        if (abortRef.current) return;

        // 4. Download
        setStatus('downloading');
        setProgress(20);
        const resp = await fetch(audioUrl, { mode: 'cors' });
        if (!resp.ok) throw new Error(`Не удалось скачать аудио: HTTP ${resp.status}`);
        const buf = await resp.arrayBuffer();
        if (abortRef.current) return;
        setProgress(30);

        // 5. Decode PCM
        const ctx = new AudioContext({ sampleRate: 16000 });
        const decoded = await ctx.decodeAudioData(buf);
        const pcm = decoded.getChannelData(0);
        ctx.close();
        if (abortRef.current) return;

        // 6. Whisper
        setStatus('loading-model');
        setProgress(35);
        const { pipeline } = await import('@huggingface/transformers');
        if (abortRef.current) return;
        setProgress(45);
        const asr = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
          dtype: 'q8', device: 'wasm',
        });
        if (abortRef.current) return;

        setStatus('transcribing');
        setProgress(60);
        const raw = await asr(pcm, {
          language: 'russian', task: 'transcribe',
          chunk_length_s: 30, stride_length_s: 5, return_timestamps: false,
        });
        const text = (Array.isArray(raw)
          ? raw.map((r: { text: string }) => r.text).join(' ')
          : (raw as { text: string }).text
        ).trim();
        if (!text) throw new Error('Речь не распознана — возможно, в рилсе только музыка');
        setTranscript(text);
        if (abortRef.current) return;

        // 7. Slides
        setStatus('generating');
        setProgress(90);
        const { textToSlides } = await import('@/lib/text-to-slides');
        const slides = textToSlides(text);
        if (slides.length > 0) {
          onSlides(slides);
          setStatus('done');
          setProgress(100);
        } else {
          throw new Error('Не удалось сгенерировать слайды');
        }
      } catch (e: unknown) {
        if (abortRef.current) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
      }
    },
    [],
  );

  return { status, error, transcript, progress, process, stop };
}
