import { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import Slide from './Slide';
import type { SlideData, BrandConfig, FontPair } from '@/lib/carousel-types';
import type { ColorSystem } from '@/lib/color-utils';

type Props = {
  slides: SlideData[];
  brand: BrandConfig;
  colors: ColorSystem;
  fontPair: FontPair;
};

export default function CarouselPreview({ slides, brand, colors, fontPair }: Props) {
  const total = slides.length;
  const [current, setCurrent] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [exporting, setExporting] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setScale(Math.min(1, w / 424));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStartX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX === null) return;
    setDragOffset(e.clientX - dragStartX);
  };
  const handlePointerUp = () => {
    if (dragStartX === null) return;
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset < 0 && current < total - 1) setCurrent(c => c + 1);
      if (dragOffset > 0 && current > 0) setCurrent(c => c - 1);
    }
    setDragStartX(null);
    setDragOffset(0);
  };

  const translateX = -current * 420 + (dragStartX !== null ? dragOffset : 0);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await document.fonts.ready;
      for (let i = 0; i < slideRefs.current.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const dataUrl = await toPng(el, {
          width: 420, height: 525,
          pixelRatio: 1080 / 420,
          cacheBust: true,
        });
        const link = document.createElement('a');
        link.download = `slide_${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-4">
      {/* IG Frame */}
      <div style={{
        width: 420, transformOrigin: 'top center',
        transform: `scale(${scale})`,
        marginBottom: `${(690 * scale) - 690}px`,
      }}>
        <div style={{
          width: 420, background: '#fff', borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: colors.primary, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 600,
            }}>
              {brand.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>
                {brand.handle}
              </span>
              <span style={{ fontSize: 11, color: '#8e8e8e' }}>
                Sponsored
              </span>
            </div>
          </div>

          {/* Viewport */}
          <div
            style={{
              width: 420, height: 525, overflow: 'hidden', position: 'relative',
              cursor: 'grab', touchAction: 'pan-y',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div style={{
              display: 'flex', width: total * 420,
              transform: `translateX(${translateX}px)`,
              transition: dragStartX !== null ? 'none' : 'transform 0.3s ease',
            }}>
              {slides.map((slide, i) => (
                <Slide
                  key={slide.id}
                  ref={el => { slideRefs.current[i] = el; }}
                  slide={slide}
                  brand={brand}
                  colors={colors}
                  fontPair={fontPair}
                  index={i}
                  total={total}
                />
              ))}
            </div>
          </div>

          {/* Dots */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 4,
            padding: '10px 0',
          }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? 8 : 6, height: i === current ? 8 : 6,
                  borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: i === current ? colors.primary : '#dbdbdb',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 14px 8px', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {/* Heart */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#262626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Comment */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#262626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Share */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <line x1="22" y1="2" x2="11" y2="13" stroke="#262626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="#262626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            {/* Bookmark */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="#262626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Caption */}
          <div style={{ padding: '4px 14px 14px' }}>
            <p style={{ fontSize: 13, color: '#262626', margin: 0, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600 }}>{brand.handle}</span>
              {' '}✨ Swipe through for the full story
            </p>
            <p style={{ fontSize: 11, color: '#8e8e8e', margin: '6px 0 0', textTransform: 'uppercase' }}>
              2 hours ago
            </p>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="px-6 py-3 text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
        style={{
          background: colors.gradient,
          color: '#fff',
          border: 'none',
          cursor: exporting ? 'wait' : 'pointer',
        }}
      >
        {exporting ? 'Экспорт…' : `Скачать все ${total} слайдов (1080×1350)`}
      </button>
    </div>
  );
}
