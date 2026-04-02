import { useState, useCallback, useRef } from 'react';
import type { SlideData } from '@/lib/carousel-types';

const API_URL = import.meta.env.VITE_API_URL || '';
const SESSION_KEY = 'ig_sessionid';

type Status =
  | 'idle'
  | 'logging-in'
  | 'fetching-video'
  | 'downloading'
  | 'loading-model'
  | 'transcribing'
  | 'generating'
  | 'done'
  | 'error';

/** Read sessionid from localStorage */
export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

/** Save sessionid to localStorage */
export function setSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

/** Clear sessionid */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Login to Instagram via /api/login → returns sessionid */
async function loginInstagram(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Ошибка входа (${res.status})`);
  if (!data.sessionid) throw new Error('Сервер не вернул sessionid');
  return data.sessionid;
}

/** Fetch video URL via /api/reel */
async function fetchVideoUrl(reelUrl: string, sessionid: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/reel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: reelUrl, sessionid }),
  });
  const data = await res.json();
  if (res.status === 401) {
    clearSession();
    throw new Error('Сессия Instagram истекла — войди снова');
  }
  if (!res.ok) throw new Error(data.error || `Ошибка получения видео (${res.status})`);
  if (!data.videoUrl) throw new Error('Сервер не вернул ссылку на видео');
  return data.videoUrl;
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

  /** Login and save session */
  const login = useCallback(async (username: string, password: string) => {
    setStatus('logging-in');
    setError('');
    try {
      const sessionid = await loginInstagram(username, password);
      setSessionId(sessionid);
      setStatus('idle');
      return true;
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Ошибка входа');
      return false;
    }
  }, []);

  // ── Main pipeline ─────────────────────────────────────────
  const process = useCallback(
    async (reelUrl: string, onSlides: (slides: SlideData[]) => void) => {
      abortRef.current = false;
      setError('');
      setTranscript('');
      setProgress(0);

      const sessionid = getSessionId();
      if (!sessionid) {
        setStatus('error');
        setError('Сначала войди в Instagram');
        return;
      }

      try {
        // 1. Get video URL from Instagram API
        setStatus('fetching-video');
        setProgress(10);
        const videoUrl = await fetchVideoUrl(reelUrl, sessionid);
        if (abortRef.current) return;

        // 2. Download video/audio
        setStatus('downloading');
        setProgress(20);
        const resp = await fetch(videoUrl);
        if (!resp.ok) throw new Error(`Не удалось скачать видео: HTTP ${resp.status}`);
        const buf = await resp.arrayBuffer();
        if (abortRef.current) return;
        setProgress(30);

        // 3. Decode PCM
        const ctx = new AudioContext({ sampleRate: 16000 });
        const decoded = await ctx.decodeAudioData(buf);
        const pcm = decoded.getChannelData(0);
        ctx.close();
        if (abortRef.current) return;

        // 4. Whisper
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

        // 5. Slides
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

  return { status, error, transcript, progress, process, stop, login };
}
