import type { BrandConfig, FontPairKey } from '@/lib/carousel-types';
import { FONT_PAIRS } from '@/lib/carousel-types';

type Props = {
  brand: BrandConfig;
  onChange: (brand: BrandConfig) => void;
};

const inputClass =
  'w-full bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,22%)] rounded-lg px-3 py-2 text-sm text-[hsl(210,20%,92%)] placeholder-[hsl(215,15%,40%)] outline-none focus:border-[hsl(175,80%,50%)] transition-colors';
const labelClass = 'text-xs font-medium text-[hsl(215,15%,50%)] uppercase tracking-widest';

export default function BrandForm({ brand, onChange }: Props) {
  const set = <K extends keyof BrandConfig>(key: K, val: BrandConfig[K]) =>
    onChange({ ...brand, [key]: val });

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-[hsl(210,20%,92%)]">Бренд</h3>

      <div className="space-y-1.5">
        <label className={labelClass}>Название</label>
        <input className={inputClass} value={brand.name} onChange={e => set('name', e.target.value)} placeholder="Your Brand" />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Instagram handle</label>
        <input className={inputClass} value={brand.handle} onChange={e => set('handle', e.target.value)} placeholder="@yourbrand" />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Основной цвет</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={brand.primaryColor}
            onChange={e => set('primaryColor', e.target.value)}
            className="w-10 h-10 rounded-lg border-0 cursor-pointer p-0"
          />
          <input
            className={inputClass}
            value={brand.primaryColor}
            onChange={e => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) set('primaryColor', v);
            }}
            placeholder="#6C63FF"
            maxLength={7}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Шрифтовая пара</label>
        <select
          className={inputClass}
          value={brand.fontPair}
          onChange={e => set('fontPair', e.target.value as FontPairKey)}
        >
          {(Object.entries(FONT_PAIRS) as [FontPairKey, typeof FONT_PAIRS[FontPairKey]][]).map(([key, fp]) => (
            <option key={key} value={key}>{fp.label} — {fp.heading} + {fp.body}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="logo-toggle"
          checked={brand.useInitialLogo}
          onChange={e => set('useInitialLogo', e.target.checked)}
          className="w-4 h-4 rounded accent-[hsl(175,80%,50%)]"
        />
        <label htmlFor="logo-toggle" className="text-sm text-[hsl(210,20%,85%)] cursor-pointer">
          Показывать логотип (инициал)
        </label>
      </div>
    </div>
  );
}
