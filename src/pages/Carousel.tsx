import { useState, useMemo, useEffect } from 'react';
import { deriveColorSystem } from '@/lib/color-utils';
import { FONT_PAIRS, createDefaultSlides } from '@/lib/carousel-types';
import { textToSlides } from '@/lib/text-to-slides';
import { useReelToCarousel } from '@/hooks/use-reel-to-carousel';
import type { BrandConfig, SlideData } from '@/lib/carousel-types';
import BrandForm from '@/components/carousel/BrandForm';
import SlideEditor from '@/components/carousel/SlideEditor';
import CarouselPreview from '@/components/carousel/CarouselPreview';

const STATUS_LABELS: Record<string, string> = {
  dispatching: 'Запускаем обработку…',
  processing: 'Скачиваем и транскрибируем рилс…',
  done: 'Готово!',
  error: 'Ошибка',
};

export default function Carousel() {
  const [reelUrl, setReelUrl] = useState('');
  const [reelText, setReelText] = useState('');
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const { status, error: pipelineError, transcript, process: processReel, stop } = useReelToCarousel();
  const [brand, setBrand] = useState<BrandConfig>({
    name: 'Your Brand',
    handle: '@yourbrand',
    primaryColor: '#6C63FF',
    useInitialLogo: true,
    fontPair: 'modern',
  });

  const [slides, setSlides] = useState<SlideData[]>(createDefaultSlides);

  const colors = useMemo(() => deriveColorSystem(brand.primaryColor), [brand.primaryColor]);
  const fontPair = FONT_PAIRS[brand.fontPair];

  // Load Google Fonts dynamically
  useEffect(() => {
    const id = 'carousel-google-fonts';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = fontPair.googleUrl;
    return () => { /* keep link alive — changing href is enough */ };
  }, [fontPair.googleUrl]);

  const isValidUrl = /instagram\.com\/(reel|p)\//.test(reelUrl);
  const isProcessing = status === 'dispatching' || status === 'processing';

  const handleUrlSubmit = () => {
    if (!isValidUrl || isProcessing) return;
    processReel(reelUrl, setSlides);
  };

  const handleTextGenerate = () => {
    const generated = textToSlides(reelText);
    if (generated.length > 0) setSlides(generated);
  };

  // When pipeline returns transcript, also set it in text field
  useEffect(() => {
    if (transcript) setReelText(transcript);
  }, [transcript]);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(220,20%,7%)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'hsl(220,15%,18%)' }}>
        <a
          href={import.meta.env.BASE_URL || '/'}
          className="text-xs tracking-[0.3em] lowercase select-none"
          style={{ color: 'hsl(215,15%,50%)' }}
        >
          la content fabrique
        </a>
        <h1 className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'hsl(210,20%,92%)' }}>
          Carousel Generator
        </h1>
        <div className="w-24" />
      </header>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-[1400px] mx-auto">
        {/* Left — Editor */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-6 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(220,15%,22%) transparent' }}
        >
          {/* Reel Input */}
          <div className="space-y-3">
            {/* Mode tabs */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'hsl(220,15%,12%)' }}>
              <button
                onClick={() => setMode('url')}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: mode === 'url' ? 'hsl(220,15%,18%)' : 'transparent',
                  color: mode === 'url' ? 'hsl(175,80%,50%)' : 'hsl(215,15%,50%)',
                }}
              >
                🔗 Ссылка на рилс
              </button>
              <button
                onClick={() => setMode('text')}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: mode === 'text' ? 'hsl(220,15%,18%)' : 'transparent',
                  color: mode === 'text' ? 'hsl(175,80%,50%)' : 'hsl(215,15%,50%)',
                }}
              >
                📝 Текст
              </button>
            </div>

            {mode === 'url' ? (
              <>
                <p className="text-xs" style={{ color: 'hsl(215,15%,50%)' }}>
                  Вставь ссылку на Instagram Reel — видео скачается, транскрибируется и превратится в карусель автоматически
                </p>
                <input
                  type="url"
                  value={reelUrl}
                  onChange={e => setReelUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/ABC123..."
                  disabled={isProcessing}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                  style={{
                    background: 'hsl(220,15%,14%)',
                    border: '1px solid hsl(220,15%,22%)',
                    color: 'hsl(210,20%,92%)',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(175,80%,50%)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(220,15%,22%)'}
                  onKeyDown={e => { if (e.key === 'Enter') handleUrlSubmit(); }}
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!isValidUrl || isProcessing}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                  style={{
                    background: isValidUrl && !isProcessing ? 'hsl(175,80%,50%)' : 'hsl(220,15%,18%)',
                    color: isValidUrl && !isProcessing ? 'hsl(220,20%,7%)' : 'hsl(215,15%,40%)',
                    cursor: isValidUrl && !isProcessing ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isProcessing ? '⏳ Обрабатывается…' : '🎬 Создать карусель из рилса'}
                </button>

                {/* Status */}
                {status !== 'idle' && (
                  <div
                    className="rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: status === 'error' ? 'hsl(0,60%,15%)' : status === 'done' ? 'hsl(140,40%,15%)' : 'hsl(220,15%,14%)',
                      color: status === 'error' ? 'hsl(0,80%,70%)' : status === 'done' ? 'hsl(140,60%,70%)' : 'hsl(175,80%,50%)',
                      border: `1px solid ${status === 'error' ? 'hsl(0,40%,25%)' : status === 'done' ? 'hsl(140,30%,25%)' : 'hsl(220,15%,22%)'}`,
                    }}
                  >
                    {status === 'error' ? `❌ ${pipelineError}` : STATUS_LABELS[status] || ''}
                    {isProcessing && (
                      <span className="block mt-1" style={{ color: 'hsl(215,15%,50%)' }}>
                        Обычно занимает 2–4 минуты…
                      </span>
                    )}
                    {!isProcessing && (
                      <button
                        onClick={() => { stop(); setReelUrl(''); }}
                        className="mt-1 underline"
                        style={{ color: 'hsl(215,15%,50%)' }}
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-xs" style={{ color: 'hsl(215,15%,50%)' }}>
                  Вставь текст или транскрипт рилса — слайды сгенерируются автоматически
                </p>
                <textarea
                  value={reelText}
                  onChange={e => setReelText(e.target.value)}
                  placeholder={"Вставьте сюда текст рилса...\n\nНапример:\nЭто не извинение. Проехали, давай забудем. Это просто шутка..."}
                  rows={6}
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-colors"
                  style={{
                    background: 'hsl(220,15%,14%)',
                    border: '1px solid hsl(220,15%,22%)',
                    color: 'hsl(210,20%,92%)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(175,80%,50%)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(220,15%,22%)'}
                />
                <button
                  onClick={handleTextGenerate}
                  disabled={!reelText.trim()}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                  style={{
                    background: reelText.trim() ? 'hsl(175,80%,50%)' : 'hsl(220,15%,18%)',
                    color: reelText.trim() ? 'hsl(220,20%,7%)' : 'hsl(215,15%,40%)',
                    cursor: reelText.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  🎨 Сгенерировать карусель
                </button>
              </>
            )}
          </div>

          <div className="h-px" style={{ background: 'hsl(220,15%,18%)' }} />

          <BrandForm brand={brand} onChange={setBrand} />
          <div className="h-px" style={{ background: 'hsl(220,15%,18%)' }} />
          <SlideEditor slides={slides} onChange={setSlides} />
        </div>

        {/* Right — Preview */}
        <div className="flex-1 lg:sticky lg:top-6 lg:self-start">
          <CarouselPreview
            slides={slides}
            brand={brand}
            colors={colors}
            fontPair={fontPair}
          />
        </div>
      </div>
    </div>
  );
}
