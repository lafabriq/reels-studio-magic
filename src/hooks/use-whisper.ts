import { useState, useCallback, useRef } from 'react';

type WhisperState = {
  status: 'idle' | 'loading-model' | 'transcribing' | 'done' | 'error';
  progress: number;
  transcript: string;
  error: string | null;
};

/**
 * Hook for running Whisper speech-to-text entirely in the browser
 * via @huggingface/transformers (WebAssembly / WebGPU).
 */
export function useWhisper() {
  const [state, setState] = useState<WhisperState>({
    status: 'idle',
    progress: 0,
    transcript: '',
    error: null,
  });
  const abortRef = useRef(false);

  const transcribe = useCallback(async (audioSource: string | File) => {
    abortRef.current = false;
    setState({ status: 'loading-model', progress: 0, transcript: '', error: null });

    try {
      // Dynamic import to avoid loading the huge module at startup
      const { pipeline } = await import('@huggingface/transformers');

      if (abortRef.current) return '';

      setState(s => ({ ...s, progress: 10 }));

      // Use whisper-tiny for speed (~40MB download). Multilingual for Russian.
      const transcriber = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny',
        {
          dtype: 'q8',
          device: 'wasm',
        },
      );

      if (abortRef.current) return '';

      setState(s => ({ ...s, status: 'transcribing', progress: 50 }));

      // Get audio data
      let audioData: string | Float32Array;

      if (audioSource instanceof File) {
        audioData = await fileToFloat32(audioSource);
      } else {
        // It's a URL — fetch the video and decode audio
        audioData = await urlToFloat32(audioSource);
      }

      if (abortRef.current) return '';

      setState(s => ({ ...s, progress: 70 }));

      const result = await transcriber(audioData, {
        language: 'russian',
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      });

      const text = Array.isArray(result)
        ? result.map(r => r.text).join(' ')
        : (result as { text: string }).text;

      setState({ status: 'done', progress: 100, transcript: text.trim(), error: null });
      return text.trim();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState(s => ({ ...s, status: 'error', error: msg }));
      return '';
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({ status: 'idle', progress: 0, transcript: '', error: null });
  }, []);

  return { ...state, transcribe, reset };
}

/** Convert an audio/video File to Float32Array at 16kHz (Whisper's required format) */
async function fileToFloat32(file: File): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();
  return decodeToFloat32(arrayBuffer);
}

/** Fetch a video/audio URL and decode to Float32Array at 16kHz */
async function urlToFloat32(url: string): Promise<Float32Array> {
  const resp = await fetch(url, { mode: 'cors' });
  if (!resp.ok) throw new Error(`Не удалось скачать аудио: HTTP ${resp.status}`);
  const arrayBuffer = await resp.arrayBuffer();
  return decodeToFloat32(arrayBuffer);
}

/** Decode any audio buffer to mono Float32Array at 16000Hz */
async function decodeToFloat32(buffer: ArrayBuffer): Promise<Float32Array> {
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 16000 });
  const decoded = await audioCtx.decodeAudioData(buffer);
  const channelData = decoded.getChannelData(0); // mono
  audioCtx.close();
  return channelData;
}
