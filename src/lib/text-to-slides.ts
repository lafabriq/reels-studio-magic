import type { SlideData } from './carousel-types';

/**
 * Разбивает текст рилса на 7 слайдов карусели.
 *
 * Логика: делим текст на смысловые блоки (по абзацам или предложениям)
 * и распределяем по шаблону hero → problem → solution → features → details → howto → cta.
 */
export function textToSlides(rawText: string): SlideData[] {
  const text = rawText.trim();
  if (!text) return [];

  // Split into paragraphs, then sentences if too few paragraphs
  let blocks = text
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean);

  if (blocks.length < 4) {
    blocks = text
      .split(/(?<=[.!?…])\s+/)
      .map(b => b.trim())
      .filter(b => b.length > 5);
  }

  // If still too few, split by newlines
  if (blocks.length < 4) {
    blocks = text
      .split(/\n/)
      .map(b => b.trim())
      .filter(Boolean);
  }

  // Extract first sentence as hook
  const firstSentence = extractFirstSentence(blocks[0] ?? text);
  const restOfFirst = (blocks[0] ?? '').replace(firstSentence, '').trim();

  // Try to detect numbered lists for howto steps
  const numberedBlocks: string[] = [];
  const regularBlocks: string[] = [];

  for (const b of blocks.slice(1)) {
    if (/^\d+[.)\s]/.test(b)) {
      numberedBlocks.push(b.replace(/^\d+[.)\s]+/, '').trim());
    } else {
      regularBlocks.push(b);
    }
  }

  // Try to detect bullet points for features
  const bulletBlocks: string[] = [];
  const plainBlocks: string[] = [];

  for (const b of regularBlocks) {
    if (/^[-•✅✓⚡🔥🎯★●▸►→]/.test(b)) {
      bulletBlocks.push(b.replace(/^[-•✅✓⚡🔥🎯★●▸►→]\s*/, '').trim());
    } else {
      plainBlocks.push(b);
    }
  }

  // Distribute content across slides
  const slides: SlideData[] = [];

  // 1 - Hero
  slides.push({
    id: '1', type: 'hero', bgMode: 'light',
    tag: 'РИЛС → КАРУСЕЛЬ',
    heading: truncate(firstSentence, 80),
    body: truncate(restOfFirst || pickBlock(plainBlocks, 0) || 'Свайпни, чтобы узнать больше →', 120),
  });

  // 2 - Problem
  slides.push({
    id: '2', type: 'problem', bgMode: 'dark',
    tag: 'ПРОБЛЕМА',
    heading: truncate(pickBlock(plainBlocks, 1) || 'Знакомо?', 70),
    body: truncate(pickBlock(plainBlocks, 2) || 'Многие сталкиваются с этим каждый день.', 120),
    pills: plainBlocks.slice(3, 6).map(b => truncate(b, 30)),
  });

  // 3 - Solution
  slides.push({
    id: '3', type: 'solution', bgMode: 'gradient',
    tag: 'РЕШЕНИЕ',
    heading: truncate(pickBlock(plainBlocks, 3) || 'Вот что меняет всё', 70),
    body: truncate(pickBlock(plainBlocks, 4) || firstSentence, 130),
  });

  // 4 - Features
  const features = (bulletBlocks.length >= 2 ? bulletBlocks : plainBlocks.slice(5, 9))
    .slice(0, 4)
    .map((b, i) => {
      const icons = ['⚡', '🎯', '✨', '🔒'];
      const parts = b.split(/[—–:]\s*/);
      return {
        icon: icons[i % icons.length],
        label: truncate(parts[0] || `Пункт ${i + 1}`, 40),
        description: truncate(parts[1] || '', 60),
      };
    });

  if (features.length < 2) {
    features.push(
      { icon: '⚡', label: 'Быстро', description: 'Результат за минуты' },
      { icon: '🎯', label: 'Точно', description: 'Без лишних действий' },
    );
  }

  slides.push({
    id: '4', type: 'features', bgMode: 'light',
    tag: 'ЧТО ПОЛУЧАЕШЬ',
    heading: 'Ключевые моменты',
    body: '',
    features,
  });

  // 5 - Details
  slides.push({
    id: '5', type: 'details', bgMode: 'dark',
    tag: 'ПОДРОБНЕЕ',
    heading: truncate(pickBlock(plainBlocks, 6) || 'Почему это работает', 70),
    body: truncate(pickBlock(plainBlocks, 7) || pickBlock(plainBlocks, 5) || 'Подход, проверенный на практике.', 150),
  });

  // 6 - Howto
  const steps = (numberedBlocks.length >= 2 ? numberedBlocks : plainBlocks.slice(8, 11))
    .slice(0, 4)
    .map(b => {
      const parts = b.split(/[—–:]\s*/);
      return {
        title: truncate(parts[0] || b, 40),
        description: truncate(parts[1] || '', 60),
      };
    });

  if (steps.length < 2) {
    steps.push(
      { title: 'Смотри рилс', description: 'Найди интересный контент' },
      { title: 'Создай карусель', description: 'Используй этот генератор' },
      { title: 'Публикуй', description: 'Готовые слайды → в Instagram' },
    );
  }

  slides.push({
    id: '6', type: 'howto', bgMode: 'light',
    tag: 'КАК ЭТО РАБОТАЕТ',
    heading: `${steps.length} простых шага`,
    body: '',
    steps,
  });

  // 7 - CTA
  const lastBlock = plainBlocks[plainBlocks.length - 1] || '';
  slides.push({
    id: '7', type: 'cta', bgMode: 'gradient',
    tag: 'ДЕЙСТВУЙ',
    heading: truncate(lastBlock || 'Сохрани и попробуй →', 70),
    body: 'Ставь ❤️ если было полезно. Подпишись, чтобы не пропустить.',
    ctaText: 'Подписаться →',
  });

  return slides;
}

function pickBlock(blocks: string[], index: number): string {
  return blocks[index] ?? '';
}

function extractFirstSentence(text: string): string {
  const match = text.match(/^.+?[.!?…]+/);
  return match ? match[0].trim() : text.slice(0, 80);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
