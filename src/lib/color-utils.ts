export function hexToHSL(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

export function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHSL(hex);
  return hslToHex(h, s, Math.min(100, l + amount));
}

export function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHSL(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

export type ColorSystem = {
  primary: string;
  light: string;
  dark: string;
  lightBg: string;
  lightBorder: string;
  darkBg: string;
  gradient: string;
};

export function deriveColorSystem(primaryHex: string): ColorSystem {
  const [h] = hexToHSL(primaryHex);
  const isWarm = (h >= 0 && h <= 60) || h >= 300;
  const light = lighten(primaryHex, 20);
  const dark = darken(primaryHex, 30);
  const lightBg = isWarm ? '#FAF8F5' : '#F5F7FA';
  const lightBorder = isWarm ? '#EDE9E3' : '#E5E8ED';
  const darkBg = isWarm ? '#1A1918' : '#0F172A';
  const gradient = `linear-gradient(165deg, ${dark} 0%, ${primaryHex} 50%, ${light} 100%)`;
  return { primary: primaryHex, light, dark, lightBg, lightBorder, darkBg, gradient };
}
