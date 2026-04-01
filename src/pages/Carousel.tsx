import { useState, useMemo, useEffect } from 'react';
import { deriveColorSystem } from '@/lib/color-utils';
import { FONT_PAIRS, createDefaultSlides } from '@/lib/carousel-types';
import { textToSlides } from '@/lib/text-to-slides';
import type { BrandConfig, SlideData } from '@/lib/carousel-types';
import BrandForm from '@/components/carousel/BrandForm';
import SlideEditor from '@/components/carousel/SlideEditor';
import CarouselPreview from '@/components/carousel/CarouselPreview';

export default function Carousel() {
  const [reelText, setReelText] = useState('');
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

  const handleGenerate = () => {
    const generated = textToSlides(reelText);
    if (generated.length > 0) setSlides(generated);
  };

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
          {/* Reel Text Input */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold" style={{ color: 'hsl(210,20%,92%)' }}>
              Текст рилса
            </h3>
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
              onClick={handleGenerate}
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
