import React, { forwardRef } from 'react';
import type { SlideData, BrandConfig, FontPair } from '@/lib/carousel-types';
import type { ColorSystem } from '@/lib/color-utils';

type SlideProps = {
  slide: SlideData;
  brand: BrandConfig;
  colors: ColorSystem;
  fontPair: FontPair;
  index: number;
  total: number;
};

/* ── Sub-components ─────────────────────────────────────────── */

function ProgressBar({ index, total, isLight, primaryColor }: {
  index: number; total: number; isLight: boolean; primaryColor: string;
}) {
  const pct = ((index + 1) / total) * 100;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '16px 28px 20px', zIndex: 10,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        flex: 1, height: 3, borderRadius: 2, overflow: 'hidden',
        background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 2,
          background: isLight ? primaryColor : '#fff',
        }} />
      </div>
      <span style={{
        fontSize: 11, fontWeight: 500,
        color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
      }}>
        {index + 1}/{total}
      </span>
    </div>
  );
}

function SwipeArrow({ isLight }: { isLight: boolean }) {
  const bg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
  const stroke = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)';
  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, zIndex: 9,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(to right, transparent, ${bg})`,
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 6l6 6-6 6" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Tag({ text, color, bodyFont }: { text: string; color: string; bodyFont: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 600,
      letterSpacing: 2, color, marginBottom: 16,
      fontFamily: `'${bodyFont}', sans-serif`,
    }}>
      {text}
    </span>
  );
}

function LogoLockup({ brand, colors, fontPair, textColor }: {
  brand: BrandConfig; colors: ColorSystem; fontPair: FontPair; textColor: string;
}) {
  if (!brand.useInitialLogo) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: colors.primary, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 16, fontWeight: 600,
        fontFamily: `'${fontPair.heading}', serif`,
      }}>
        {brand.name.charAt(0).toUpperCase()}
      </div>
      <span style={{
        fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
        color: textColor, fontFamily: `'${fontPair.body}', sans-serif`,
      }}>
        {brand.name}
      </span>
    </div>
  );
}

/* ── Slide Content Renderers ────────────────────────────────── */

function HeroContent({ slide, brand, colors, fontPair, textColor, bodyColor, tagColor }: {
  slide: SlideData; brand: BrandConfig; colors: ColorSystem; fontPair: FontPair;
  textColor: string; bodyColor: string; tagColor: string;
}) {
  return (
    <>
      <LogoLockup brand={brand} colors={colors} fontPair={fontPair} textColor={textColor} />
      <Tag text={slide.tag} color={tagColor} bodyFont={fontPair.body} />
      <h2 style={{
        fontSize: 32, fontWeight: fontPair.headingWeight,
        letterSpacing: -0.5, lineHeight: 1.1,
        color: textColor, margin: '0 0 12px',
        fontFamily: `'${fontPair.heading}', serif`,
      }}>
        {slide.heading}
      </h2>
      <p style={{
        fontSize: 14, fontWeight: 400, lineHeight: 1.55,
        color: bodyColor, margin: 0,
        fontFamily: `'${fontPair.body}', sans-serif`,
      }}>
        {slide.body}
      </p>
    </>
  );
}

function ProblemContent({ slide, colors, fontPair, textColor, bodyColor, tagColor }: {
  slide: SlideData; colors: ColorSystem; fontPair: FontPair;
  textColor: string; bodyColor: string; tagColor: string;
}) {
  return (
    <>
      <div style={{ flex: 1 }} />
      <Tag text={slide.tag} color={tagColor} bodyFont={fontPair.body} />
      <h2 style={{
        fontSize: 28, fontWeight: fontPair.headingWeight,
        letterSpacing: -0.3, lineHeight: 1.15,
        color: textColor, margin: '0 0 12px',
        fontFamily: `'${fontPair.heading}', serif`,
      }}>
        {slide.heading}
      </h2>
      <p style={{
        fontSize: 14, fontWeight: 400, lineHeight: 1.55,
        color: bodyColor, margin: '0 0 16px',
        fontFamily: `'${fontPair.body}', sans-serif`,
      }}>
        {slide.body}
      </p>
      {slide.pills && slide.pills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {slide.pills.map((pill, i) => (
            <span key={i} style={{
              fontSize: 11, padding: '5px 12px',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
              color: '#6B6560', textDecoration: 'line-through',
              fontFamily: `'${fontPair.body}', sans-serif`,
            }}>
              {pill}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function SolutionContent({ slide, fontPair, textColor, tagColor }: {
  slide: SlideData; fontPair: FontPair; textColor: string; tagColor: string;
}) {
  return (
    <>
      <Tag text={slide.tag} color={tagColor} bodyFont={fontPair.body} />
      <h2 style={{
        fontSize: 30, fontWeight: fontPair.headingWeight,
        letterSpacing: -0.4, lineHeight: 1.12,
        color: textColor, margin: '0 0 20px',
        fontFamily: `'${fontPair.heading}', serif`,
      }}>
        {slide.heading}
      </h2>
      <div style={{
        padding: 16, background: 'rgba(0,0,0,0.15)',
        borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 6px',
          fontFamily: `'${fontPair.body}', sans-serif`,
        }}>
          Key insight
        </p>
        <p style={{
          fontSize: 15, color: '#fff', fontStyle: 'italic', lineHeight: 1.4, margin: 0,
          fontFamily: `'${fontPair.heading}', serif`,
        }}>
          {slide.body}
        </p>
      </div>
    </>
  );
}

function FeaturesContent({ slide, colors, fontPair, textColor, tagColor }: {
  slide: SlideData; colors: ColorSystem; fontPair: FontPair;
  textColor: string; tagColor: string;
}) {
  return (
    <>
      <Tag text={slide.tag} color={tagColor} bodyFont={fontPair.body} />
      <h2 style={{
        fontSize: 26, fontWeight: fontPair.headingWeight,
        letterSpacing: -0.3, lineHeight: 1.15,
        color: textColor, margin: '0 0 16px',
        fontFamily: `'${fontPair.heading}', serif`,
      }}>
        {slide.heading}
      </h2>
      {(slide.features ?? []).map((f, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 0',
          borderBottom: `1px solid ${colors.lightBorder}`,
        }}>
          <span style={{ color: colors.primary, fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>
            {f.icon}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color: colors.darkBg,
              fontFamily: `'${fontPair.body}', sans-serif`,
            }}>
              {f.label}
            </span>
            <span style={{
              fontSize: 12, color: '#8A8580',
              fontFamily: `'${fontPair.body}', sans-serif`,
            }}>
              {f.description}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

function DetailsContent({ slide, colors, fontPair, textColor, bodyColor, tagColor }: {
  slide: SlideData; colors: ColorSystem; fontPair: FontPair;
  textColor: string; bodyColor: string; tagColor: string;
}) {
  return (
    <>
      <div style={{ flex: 1 }} />
      <Tag text={slide.tag} color={tagColor} bodyFont={fontPair.body} />
      <h2 style={{
        fontSize: 28, fontWeight: fontPair.headingWeight,
        letterSpacing: -0.3, lineHeight: 1.15,
        color: textColor, margin: '0 0 12px',
        fontFamily: `'${fontPair.heading}', serif`,
      }}>
        {slide.heading}
      </h2>
      <p style={{
        fontSize: 14, fontWeight: 400, lineHeight: 1.55,
        color: bodyColor, margin: '0 0 16px',
        fontFamily: `'${fontPair.body}', sans-serif`,
      }}>
        {slide.body}
      </p>
      {slide.pills && slide.pills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {slide.pills.map((pill, i) => (
            <span key={i} style={{
              fontSize: 11, padding: '5px 12px',
              background: 'rgba(255,255,255,0.06)', borderRadius: 20,
              color: colors.light,
              fontFamily: `'${fontPair.body}', sans-serif`,
            }}>
              {pill}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function HowtoContent({ slide, colors, fontPair, textColor, tagColor }: {
  slide: SlideData; colors: ColorSystem; fontPair: FontPair;
  textColor: string; tagColor: string;
}) {
  return (
    <>
      <Tag text={slide.tag} color={tagColor} bodyFont={fontPair.body} />
      <h2 style={{
        fontSize: 26, fontWeight: fontPair.headingWeight,
        letterSpacing: -0.3, lineHeight: 1.15,
        color: textColor, margin: '0 0 16px',
        fontFamily: `'${fontPair.heading}', serif`,
      }}>
        {slide.heading}
      </h2>
      {(slide.steps ?? []).map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 0',
          borderBottom: `1px solid ${colors.lightBorder}`,
        }}>
          <span style={{
            fontSize: 26, fontWeight: 300, color: colors.primary,
            minWidth: 34, lineHeight: 1,
            fontFamily: `'${fontPair.heading}', serif`,
          }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color: colors.darkBg,
              fontFamily: `'${fontPair.body}', sans-serif`,
            }}>
              {s.title}
            </span>
            <span style={{
              fontSize: 12, color: '#8A8580',
              fontFamily: `'${fontPair.body}', sans-serif`,
            }}>
              {s.description}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

function CTAContent({ slide, brand, colors, fontPair, textColor, bodyColor, tagColor }: {
  slide: SlideData; brand: BrandConfig; colors: ColorSystem; fontPair: FontPair;
  textColor: string; bodyColor: string; tagColor: string;
}) {
  return (
    <>
      <LogoLockup brand={brand} colors={colors} fontPair={fontPair} textColor={textColor} />
      <Tag text={slide.tag} color={tagColor} bodyFont={fontPair.body} />
      <h2 style={{
        fontSize: 30, fontWeight: fontPair.headingWeight,
        letterSpacing: -0.4, lineHeight: 1.12,
        color: textColor, margin: '0 0 12px',
        fontFamily: `'${fontPair.heading}', serif`,
      }}>
        {slide.heading}
      </h2>
      <p style={{
        fontSize: 14, fontWeight: 400, lineHeight: 1.55,
        color: bodyColor, margin: '0 0 24px',
        fontFamily: `'${fontPair.body}', sans-serif`,
      }}>
        {slide.body}
      </p>
      {slide.ctaText && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', background: colors.lightBg,
          color: colors.dark, borderRadius: 28,
          fontFamily: `'${fontPair.body}', sans-serif`,
          fontWeight: 600, fontSize: 14,
        }}>
          {slide.ctaText}
        </div>
      )}
    </>
  );
}

/* ── Main Slide Component ───────────────────────────────────── */

const Slide = forwardRef<HTMLDivElement, SlideProps>(
  ({ slide, brand, colors, fontPair, index, total }, ref) => {
    const isLight = slide.bgMode === 'light';
    const isLast = index === total - 1;

    const bgStyle: React.CSSProperties = slide.bgMode === 'gradient'
      ? { background: colors.gradient }
      : { background: isLight ? colors.lightBg : colors.darkBg };

    const textColor = isLight ? colors.darkBg : '#ffffff';
    const bodyColor = isLight ? '#8A8580' : 'rgba(255,255,255,0.7)';
    const tagColor = isLight ? colors.primary
      : slide.bgMode === 'gradient' ? 'rgba(255,255,255,0.6)' : colors.light;

    const isCentered = slide.type === 'hero' || slide.type === 'cta' || slide.type === 'solution';

    const contentProps = { slide, brand, colors, fontPair, textColor, bodyColor, tagColor };

    return (
      <div ref={ref} style={{
        width: 420, height: 525, position: 'relative', overflow: 'hidden',
        fontFamily: `'${fontPair.body}', sans-serif`,
        flexShrink: 0, ...bgStyle,
      }}>
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: isCentered ? '56px 36px 52px' : '36px 36px 52px',
          justifyContent: isCentered ? 'center' : 'flex-end',
          boxSizing: 'border-box',
        }}>
          {slide.type === 'hero' && <HeroContent {...contentProps} />}
          {slide.type === 'problem' && <ProblemContent {...contentProps} />}
          {slide.type === 'solution' && <SolutionContent {...contentProps} />}
          {slide.type === 'features' && <FeaturesContent {...contentProps} />}
          {slide.type === 'details' && <DetailsContent {...contentProps} />}
          {slide.type === 'howto' && <HowtoContent {...contentProps} />}
          {slide.type === 'cta' && <CTAContent {...contentProps} />}
        </div>

        <ProgressBar index={index} total={total} isLight={isLight} primaryColor={colors.primary} />
        {!isLast && <SwipeArrow isLight={isLight} />}
      </div>
    );
  }
);

Slide.displayName = 'Slide';
export default Slide;
