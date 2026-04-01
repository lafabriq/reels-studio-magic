import { useState } from 'react';
import type { SlideData, FeatureItem, StepItem } from '@/lib/carousel-types';

type Props = {
  slides: SlideData[];
  onChange: (slides: SlideData[]) => void;
};

const inputClass =
  'w-full bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,22%)] rounded-lg px-3 py-2 text-sm text-[hsl(210,20%,92%)] placeholder-[hsl(215,15%,40%)] outline-none focus:border-[hsl(175,80%,50%)] transition-colors';
const labelClass = 'text-xs font-medium text-[hsl(215,15%,50%)] uppercase tracking-widest';
const miniInputClass =
  'flex-1 bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,20%)] rounded px-2 py-1.5 text-xs text-[hsl(210,20%,92%)] outline-none focus:border-[hsl(175,80%,50%)] transition-colors';

const SLIDE_LABELS: Record<string, string> = {
  hero: '🎯 Hero',
  problem: '⚠️ Problem',
  solution: '💡 Solution',
  features: '✨ Features',
  details: '📋 Details',
  howto: '🔧 How-to',
  cta: '🚀 CTA',
};

export default function SlideEditor({ slides, onChange }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const updateSlide = (index: number, patch: Partial<SlideData>) => {
    const updated = slides.map((s, i) => i === index ? { ...s, ...patch } : s);
    onChange(updated);
  };

  const updateFeature = (slideIdx: number, featIdx: number, patch: Partial<FeatureItem>) => {
    const slide = slides[slideIdx];
    const features = (slide.features ?? []).map((f, i) => i === featIdx ? { ...f, ...patch } : f);
    updateSlide(slideIdx, { features });
  };

  const addFeature = (slideIdx: number) => {
    const slide = slides[slideIdx];
    const features = [...(slide.features ?? []), { icon: '⭐', label: 'New feature', description: 'Description' }];
    updateSlide(slideIdx, { features });
  };

  const removeFeature = (slideIdx: number, featIdx: number) => {
    const slide = slides[slideIdx];
    const features = (slide.features ?? []).filter((_, i) => i !== featIdx);
    updateSlide(slideIdx, { features });
  };

  const updateStep = (slideIdx: number, stepIdx: number, patch: Partial<StepItem>) => {
    const slide = slides[slideIdx];
    const steps = (slide.steps ?? []).map((s, i) => i === stepIdx ? { ...s, ...patch } : s);
    updateSlide(slideIdx, { steps });
  };

  const addStep = (slideIdx: number) => {
    const slide = slides[slideIdx];
    const steps = [...(slide.steps ?? []), { title: 'New step', description: 'Description' }];
    updateSlide(slideIdx, { steps });
  };

  const removeStep = (slideIdx: number, stepIdx: number) => {
    const slide = slides[slideIdx];
    const steps = (slide.steps ?? []).filter((_, i) => i !== stepIdx);
    updateSlide(slideIdx, { steps });
  };

  const updatePill = (slideIdx: number, pillIdx: number, val: string) => {
    const slide = slides[slideIdx];
    const pills = (slide.pills ?? []).map((p, i) => i === pillIdx ? val : p);
    updateSlide(slideIdx, { pills });
  };

  const addPill = (slideIdx: number) => {
    const slide = slides[slideIdx];
    updateSlide(slideIdx, { pills: [...(slide.pills ?? []), 'New pill'] });
  };

  const removePill = (slideIdx: number, pillIdx: number) => {
    const slide = slides[slideIdx];
    updateSlide(slideIdx, { pills: (slide.pills ?? []).filter((_, i) => i !== pillIdx) });
  };

  return (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-[hsl(210,20%,92%)] mb-3">Слайды</h3>

      {slides.map((slide, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={slide.id} className="rounded-lg overflow-hidden border border-[hsl(220,15%,18%)]">
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[hsl(220,15%,14%)]"
              style={{ background: isOpen ? 'hsl(220,15%,14%)' : 'hsl(220,18%,10%)' }}
            >
              <span className="text-sm font-medium text-[hsl(210,20%,92%)]">
                {idx + 1}. {SLIDE_LABELS[slide.type] ?? slide.type}
              </span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M6 9l6 6 6-6" stroke="hsl(215,15%,50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: 'hsl(220,15%,14%)' }}>
                {/* Tag */}
                <div className="space-y-1">
                  <label className={labelClass}>Tag</label>
                  <input
                    className={inputClass}
                    value={slide.tag}
                    onChange={e => updateSlide(idx, { tag: e.target.value })}
                  />
                </div>

                {/* Heading */}
                <div className="space-y-1">
                  <label className={labelClass}>Заголовок</label>
                  <textarea
                    className={inputClass + ' resize-none'}
                    rows={2}
                    value={slide.heading}
                    onChange={e => updateSlide(idx, { heading: e.target.value })}
                  />
                </div>

                {/* Body (not for features/howto) */}
                {slide.type !== 'features' && slide.type !== 'howto' && (
                  <div className="space-y-1">
                    <label className={labelClass}>Описание</label>
                    <textarea
                      className={inputClass + ' resize-none'}
                      rows={3}
                      value={slide.body}
                      onChange={e => updateSlide(idx, { body: e.target.value })}
                    />
                  </div>
                )}

                {/* CTA Text */}
                {slide.type === 'cta' && (
                  <div className="space-y-1">
                    <label className={labelClass}>Текст кнопки</label>
                    <input
                      className={inputClass}
                      value={slide.ctaText ?? ''}
                      onChange={e => updateSlide(idx, { ctaText: e.target.value })}
                    />
                  </div>
                )}

                {/* Pills */}
                {(slide.type === 'problem' || slide.type === 'details') && (
                  <div className="space-y-2">
                    <label className={labelClass}>Pills</label>
                    {(slide.pills ?? []).map((pill, pi) => (
                      <div key={pi} className="flex gap-2 items-center">
                        <input
                          className={miniInputClass}
                          value={pill}
                          onChange={e => updatePill(idx, pi, e.target.value)}
                        />
                        <button
                          onClick={() => removePill(idx, pi)}
                          className="text-red-400 text-xs hover:text-red-300 shrink-0"
                        >✕</button>
                      </div>
                    ))}
                    <button
                      onClick={() => addPill(idx)}
                      className="text-xs text-[hsl(175,80%,50%)] hover:underline"
                    >+ добавить pill</button>
                  </div>
                )}

                {/* Features */}
                {slide.type === 'features' && (
                  <div className="space-y-3">
                    <label className={labelClass}>Фичи</label>
                    {(slide.features ?? []).map((f, fi) => (
                      <div key={fi} className="space-y-1.5 p-2 rounded bg-[hsl(220,15%,12%)]">
                        <div className="flex gap-2">
                          <input
                            className={miniInputClass + ' !w-12 !flex-none text-center'}
                            value={f.icon}
                            onChange={e => updateFeature(idx, fi, { icon: e.target.value })}
                            maxLength={2}
                          />
                          <input
                            className={miniInputClass}
                            value={f.label}
                            onChange={e => updateFeature(idx, fi, { label: e.target.value })}
                            placeholder="Label"
                          />
                          <button
                            onClick={() => removeFeature(idx, fi)}
                            className="text-red-400 text-xs hover:text-red-300 shrink-0"
                          >✕</button>
                        </div>
                        <input
                          className={miniInputClass}
                          value={f.description}
                          onChange={e => updateFeature(idx, fi, { description: e.target.value })}
                          placeholder="Description"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addFeature(idx)}
                      className="text-xs text-[hsl(175,80%,50%)] hover:underline"
                    >+ добавить фичу</button>
                  </div>
                )}

                {/* Steps */}
                {slide.type === 'howto' && (
                  <div className="space-y-3">
                    <label className={labelClass}>Шаги</label>
                    {(slide.steps ?? []).map((s, si) => (
                      <div key={si} className="space-y-1.5 p-2 rounded bg-[hsl(220,15%,12%)]">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-[hsl(175,80%,50%)] font-mono w-6 text-center shrink-0">
                            {String(si + 1).padStart(2, '0')}
                          </span>
                          <input
                            className={miniInputClass}
                            value={s.title}
                            onChange={e => updateStep(idx, si, { title: e.target.value })}
                            placeholder="Step title"
                          />
                          <button
                            onClick={() => removeStep(idx, si)}
                            className="text-red-400 text-xs hover:text-red-300 shrink-0"
                          >✕</button>
                        </div>
                        <input
                          className={miniInputClass + ' ml-8'}
                          value={s.description}
                          onChange={e => updateStep(idx, si, { description: e.target.value })}
                          placeholder="Description"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addStep(idx)}
                      className="text-xs text-[hsl(175,80%,50%)] hover:underline"
                    >+ добавить шаг</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
