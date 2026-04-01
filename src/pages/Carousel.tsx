import { useState, useMemo, useEffect } from 'react';
import { deriveColorSystem } from '@/lib/color-utils';
import { FONT_PAIRS, createDefaultSlides } from '@/lib/carousel-types';
import type { BrandConfig, SlideData } from '@/lib/carousel-types';
import BrandForm from '@/components/carousel/BrandForm';
import SlideEditor from '@/components/carousel/SlideEditor';
import CarouselPreview from '@/components/carousel/CarouselPreview';

export default function Carousel() {
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
