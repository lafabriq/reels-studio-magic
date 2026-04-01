import { useState, useRef, useCallback } from 'react';
import type { SlideData } from '@/lib/carousel-types';

const REPO = 'lafabriq/reels-studio-magic';
const DISPATCH_TOKEN = 'ghu_YHDAKNEo1GvaX2gtc82vFd8mj2QzLH1bz8te';
const POLL_INTERVAL = 6_000;
const MAX_POLLS = 60; // 6 minutes max

type Status = 'idle' | 'dispatching' | 'processing' | 'done' | 'error';

export function useReelToCarousel() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const abortRef = useRef(false);

  const stop = useCallback(() => {
    abortRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = undefined;
  }, []);

  const process = useCallback(async (
    reelUrl: string,
    onSlides: (slides: SlideData[]) => void,
  ) => {
    stop();
    abortRef.current = false;
    setStatus('dispatching');
    setError('');
    setTranscript('');

    const requestId = `c${Date.now()}`;

    // 1. Trigger workflow
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DISPATCH_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'reel_to_carousel',
          client_payload: { reel_url: reelUrl, request_id: requestId },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Dispatch failed (${res.status}): ${text.slice(0, 200)}`);
      }
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Не удалось запустить обработку');
      return;
    }

    // 2. Poll for result
    setStatus('processing');
    let polls = 0;

    pollRef.current = setInterval(async () => {
      if (abortRef.current) { stop(); return; }
      polls++;
      if (polls > MAX_POLLS) {
        stop();
        setStatus('error');
        setError('Таймаут: обработка заняла слишком много времени');
        return;
      }

      try {
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/contents/results/carousel-${requestId}.json`,
          { headers: { Accept: 'application/vnd.github.v3+json' } },
        );

        if (res.status === 404) return; // not ready yet

        if (!res.ok) return; // transient error, keep polling

        const data = await res.json();
        const content = JSON.parse(atob(data.content.replace(/\n/g, '')));

        stop();

        if (content.error) {
          setStatus('error');
          setError(content.error);
          return;
        }

        if (content.transcript) setTranscript(content.transcript);
        if (content.slides && content.slides.length > 0) {
          onSlides(content.slides);
          setStatus('done');
        } else {
          setStatus('error');
          setError('Получен пустой результат');
        }
      } catch {
        // keep polling on parse errors
      }
    }, POLL_INTERVAL);
  }, [stop]);

  return { status, error, transcript, process, stop };
}
