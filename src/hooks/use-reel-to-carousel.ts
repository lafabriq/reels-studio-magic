import { useState, useCallback, useRef } from 'react';
import type { SlideData } from '@/lib/carousel-types';

const COBALT_API = 'https://cobalt-backend.canine.tools';
const TURNSTILE_SITEKEY = '0x4AAAAAABBCV3tPrCXT9h2H';

type Status = 'idle' | 'turnstile' | 'fetching-video' | 'downloading' | 'transcribing' | 'generating' | 'done' | 'error';

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        size?: string;
        appearance?: string;
      }) => string;
      remove: (id: string) => void;
    };
  }
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

  /** Get Turnstile token via invisible widget */
  const getTurnstileToken = (): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!window.turnstile) {
        reject(new Error('Turnstile не загружен — попробуй обновить страницу'));
        return;
      }

      // Create a hidden container for the widget
      let container = document.getElementById('turnstile-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'turnstile-container';
        container.style.display = 'none';
        document.body.appendChild(container);
      }
      container.innerHTML = '';

      const widgetId = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITEKEY,
        callback: (token: string) => {
          window.turnstile?.remove(widgetId);
          resolve(token);
        },
        'error-callback': () => {
          window.turnstile?.remove(widgetId);
          reject(new Error('Turnstile verification failed'));
        },
        size: 'invisible',
        appearance: 'interaction-only',
      });
    });

  /** Get JWT session from cobalt */
  const getJwt = async (turnstileToken: string): Promise<string> => {
    const res = await fetch(`${COBALT_API}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        turnstileResponse: turnstileToken,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Cobalt session error (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.token) return data.token;
    if (data.jwt) return data.jwt;
    throw new Error('Cobalt не вернул JWT токен');
  };

  /** Get video URL from cobalt */
  const getVideoUrl = async (reelUrl: string, jwt: string): Promise<string> => {
    const res = await fetch(COBALT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        url: reelUrl,
        videoQuality: '720',
        filenameStyle: 'basic',
        downloadMode: 'auto',
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Cobalt error (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json();

    if (data.status === 'tunnel' || data.status === 'redirect') {
      return data.url;
    }
    if (data.status === 'error') {
      throw new Error(data.error?.code || 'Cobalt вернул ошибку');
    }
    throw new Error(`Неожиданный ответ cobalt: ${data.status}`);
  };

  const process = useCallback(async (
    reelUrl: string,
    onSlides: (slides: SlideData[]) => void,
  ) => {
    abortRef.current = false;
    setError('');
    setTranscript('');
    setProgress(0);

    try {
      // Step 1: Turnstile
      setStatus('turnstile');
      setProgress(5);
      const turnstileToken = await getTurnstileToken();
      if (abortRef.current) return;

      // Step 2: Get JWT
      setProgress(10);
      const jwt = await getJwt(turnstileToken);
      if (abortRef.current) return;

      // Step 3: Get video URL
      setStatus('fetching-video');
      setProgress(15);
      const videoUrl = await getVideoUrl(reelUrl, jwt);
      if (abortRef.current) return;

      // Step 4: Transcribe with browser Whisper
      setStatus('transcribing');
      setProgress(30);

      const { pipeline } = await import('@huggingface/transformers');
      if (abortRef.current) return;

      setProgress(40);

      const transcriber = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny',
        { dtype: 'q8', device: 'wasm' },
      );
      if (abortRef.current) return;

      setProgress(55);

      // Fetch video and decode audio
      const resp = await fetch(videoUrl, { mode: 'cors' });
      if (!resp.ok) throw new Error(`Не удалось скачать видео: HTTP ${resp.status}`);
      const audioBuffer = await resp.arrayBuffer();
      if (abortRef.current) return;

      setProgress(65);

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const decoded = await audioCtx.decodeAudioData(audioBuffer);
      const audioData = decoded.getChannelData(0);
      audioCtx.close();
      if (abortRef.current) return;

      setProgress(75);

      const result = await transcriber(audioData, {
        language: 'russian',
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      });

      const text = Array.isArray(result)
        ? result.map((r: { text: string }) => r.text).join(' ')
        : (result as { text: string }).text;

      const finalTranscript = text.trim();
      if (!finalTranscript) throw new Error('Речь не распознана — возможно в рилсе только музыка');

      setTranscript(finalTranscript);
      if (abortRef.current) return;

      // Step 5: Generate slides from transcript
      setStatus('generating');
      setProgress(90);

      const { textToSlides } = await import('@/lib/text-to-slides');
      const slides = textToSlides(finalTranscript);

      if (slides.length > 0) {
        onSlides(slides);
        setStatus('done');
        setProgress(100);
      } else {
        throw new Error('Не удалось сгенерировать слайды из транскрипта');
      }
    } catch (e: unknown) {
      if (abortRef.current) return;
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }, []);

  return { status, error, transcript, progress, process, stop };
}
