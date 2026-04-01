#!/usr/bin/env node
/**
 * Reel → Carousel pipeline
 *
 * Usage:
 *   node scripts/reel-to-carousel.mjs <REEL_URL>
 *
 * Pipeline:
 *   URL → download (embed page, fallback yt-dlp) → ffmpeg audio → whisper transcribe → text-to-slides JSON
 *
 * Output:
 *   output/input.mp4          — video
 *   output/audio.wav          — audio (16kHz mono for whisper)
 *   output/transcription.txt  — full transcript
 *   output/slides.json        — carousel slide data ready for import
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('output');
const VIDEO_PATH = path.join(OUTPUT_DIR, 'input.mp4');
const AUDIO_PATH = path.join(OUTPUT_DIR, 'audio.wav');
const TRANSCRIPT_PATH = path.join(OUTPUT_DIR, 'transcription.txt');
const SLIDES_PATH = path.join(OUTPUT_DIR, 'slides.json');

// ── Helpers ────────────────────────────────────────────────────

function log(emoji, msg) {
  console.log(`${emoji}  ${msg}`);
}

function normalizeInstagramUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const m = u.pathname.match(/^\/(reel|p)\/([^/?#]+)/i);
    if (!m) return rawUrl;
    return `https://www.instagram.com/${m[1]}/${m[2]}/`;
  } catch {
    return rawUrl;
  }
}

function extractShortcode(url) {
  const m = url.match(/\/(reel|p)\/([^/?#]+)/i);
  return m ? m[2] : null;
}

// ── Step 1: Download ───────────────────────────────────────────

function downloadViaEmbed(shortcode) {
  log('📥', `Embed page: https://www.instagram.com/reel/${shortcode}/embed/`);
  const embedUrl = `https://www.instagram.com/reel/${shortcode}/embed/`;

  const html = execSync(
    `curl -s -m 30 -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${embedUrl}"`,
    { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
  );

  const m = html.match(/video_url\\?":\\?"(.*?)\\?"/);
  if (!m) throw new Error('video_url не найден в embed (пост приватный или без видео)');

  let videoUrl = m[1]
    .replace(/\\\\\//g, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&');

  log('🔗', `CDN URL: ${videoUrl.slice(0, 80)}…`);

  execSync(
    `curl -L -s -o "${VIDEO_PATH}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${videoUrl}"`,
    { timeout: 120_000 }
  );

  const stat = fs.statSync(VIDEO_PATH);
  if (stat.size < 10_000) throw new Error(`Файл слишком мал (${stat.size} байт)`);

  log('✅', `Видео скачано через embed (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

function downloadViaYtdlp(cleanUrl) {
  log('📥', `yt-dlp: ${cleanUrl}`);
  const result = spawnSync('yt-dlp', [
    '-o', VIDEO_PATH,
    '--no-check-certificates',
    '--no-playlist',
    '--merge-output-format', 'mp4',
    '--format', 'bv*+ba/b',
    '--retries', '3',
    '--add-header', 'User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    '--add-header', 'Referer:https://www.instagram.com/',
    cleanUrl,
  ], { timeout: 120_000, encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`yt-dlp failed: ${result.stderr?.slice(0, 200) || 'unknown error'}`);
  }

  if (!fs.existsSync(VIDEO_PATH) || fs.statSync(VIDEO_PATH).size < 10_000) {
    throw new Error('yt-dlp вернул пустой файл');
  }

  log('✅', `Видео скачано через yt-dlp (${(fs.statSync(VIDEO_PATH).size / 1024 / 1024).toFixed(1)} MB)`);
}

function stepDownload(reelUrl) {
  const cleanUrl = normalizeInstagramUrl(reelUrl);
  const shortcode = extractShortcode(cleanUrl);
  if (!shortcode) throw new Error(`Не Instagram URL: ${reelUrl}`);

  log('🎬', `Shortcode: ${shortcode}`);

  // Backup existing file
  if (fs.existsSync(VIDEO_PATH)) {
    fs.copyFileSync(VIDEO_PATH, VIDEO_PATH + '.bak');
  }

  // Method 1: yt-dlp (primary — works reliably without auth)
  try {
    downloadViaYtdlp(cleanUrl);
    return;
  } catch (e) {
    log('⚠️', `yt-dlp failed: ${e.message}`);
  }

  // Method 2: embed page (fallback — may not work since 2025)
  try {
    downloadViaEmbed(shortcode);
    return;
  } catch (e) {
    log('⚠️', `Embed failed: ${e.message}`);
  }

  // All failed — restore backup
  if (fs.existsSync(VIDEO_PATH + '.bak')) {
    fs.copyFileSync(VIDEO_PATH + '.bak', VIDEO_PATH);
    log('🔄', 'Восстановлен предыдущий файл');
  }

  throw new Error('Не удалось скачать видео — все способы провалились');
}

// ── Step 2: Extract audio ──────────────────────────────────────

function stepAudio() {
  log('🔊', 'Извлекаю аудио...');
  execSync(
    `ffmpeg -y -i "${VIDEO_PATH}" -vn -ar 16000 -ac 1 -c:a pcm_s16le "${AUDIO_PATH}"`,
    { timeout: 30_000, stdio: 'pipe' }
  );

  const stat = fs.statSync(AUDIO_PATH);
  log('✅', `Аудио: ${(stat.size / 1024).toFixed(0)} KB (16kHz mono WAV)`);
}

// ── Step 3: Transcribe with Whisper ────────────────────────────

function stepTranscribe() {
  log('🗣️', 'Транскрибирую через Whisper (tiny model)...');

  const result = spawnSync('whisper', [
    AUDIO_PATH,
    '--model', 'tiny',
    '--language', 'ru',
    '--output_format', 'txt',
    '--output_dir', OUTPUT_DIR,
  ], { timeout: 300_000, encoding: 'utf8', stdio: 'pipe' });

  if (result.status !== 0) {
    throw new Error(`Whisper failed: ${result.stderr?.slice(0, 300)}`);
  }

  // Whisper outputs audio.txt in output_dir
  const whisperOut = path.join(OUTPUT_DIR, 'audio.txt');
  if (!fs.existsSync(whisperOut)) {
    throw new Error('Whisper не создал файл транскрипции');
  }

  const text = fs.readFileSync(whisperOut, 'utf8').trim();
  fs.writeFileSync(TRANSCRIPT_PATH, text);

  log('✅', `Транскрипция: ${text.length} символов`);
  log('📝', text.slice(0, 200) + (text.length > 200 ? '…' : ''));

  return text;
}

// ── Step 4: Text → Slides JSON ─────────────────────────────────

function stepSlides(text) {
  log('🎨', 'Генерирую слайды...');

  // Split into blocks
  let blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  if (blocks.length < 4) {
    blocks = text.split(/(?<=[.!?…])\s+/).map(b => b.trim()).filter(b => b.length > 5);
  }
  if (blocks.length < 4) {
    blocks = text.split(/\n/).map(b => b.trim()).filter(Boolean);
  }
  // If still short — split by sentences of ~20 words
  if (blocks.length < 4) {
    const words = text.split(/\s+/);
    blocks = [];
    for (let i = 0; i < words.length; i += 20) {
      blocks.push(words.slice(i, i + 20).join(' '));
    }
  }

  const firstSentence = (text.match(/^.+?[.!?…]+/) || [text.slice(0, 80)])[0].trim();

  function pick(idx) { return blocks[idx] ?? ''; }
  function trunc(s, max) { return s.length <= max ? s : s.slice(0, max - 1) + '…'; }

  const slides = [
    {
      id: '1', type: 'hero', bgMode: 'light',
      tag: 'РИЛС → КАРУСЕЛЬ',
      heading: trunc(firstSentence, 80),
      body: trunc(pick(1) || 'Свайпни чтобы узнать больше →', 120),
    },
    {
      id: '2', type: 'problem', bgMode: 'dark',
      tag: 'КОНТЕКСТ',
      heading: trunc(pick(2) || pick(1) || 'Знакомо?', 70),
      body: trunc(pick(3) || 'Многие сталкиваются с этим каждый день.', 120),
      pills: blocks.slice(4, 7).map(b => trunc(b, 30)),
    },
    {
      id: '3', type: 'solution', bgMode: 'gradient',
      tag: 'ГЛАВНАЯ МЫСЛЬ',
      heading: trunc(pick(4) || pick(2) || 'Вот что важно', 70),
      body: trunc(pick(5) || firstSentence, 130),
    },
    {
      id: '4', type: 'features', bgMode: 'light',
      tag: 'КЛЮЧЕВЫЕ МОМЕНТЫ',
      heading: 'Что нужно знать',
      body: '',
      features: blocks.slice(3, 7).map((b, i) => ({
        icon: ['⚡', '🎯', '✨', '🔒'][i % 4],
        label: trunc(b.split(/[—–:.]/)[0] || `Пункт ${i + 1}`, 40),
        description: trunc(b.split(/[—–:.]/)[1] || '', 60),
      })),
    },
    {
      id: '5', type: 'details', bgMode: 'dark',
      tag: 'ПОДРОБНЕЕ',
      heading: trunc(pick(7) || pick(5) || 'Почему это важно', 70),
      body: trunc(pick(8) || pick(6) || 'Разберёмся глубже.', 150),
    },
    {
      id: '6', type: 'howto', bgMode: 'light',
      tag: 'ПЛАН ДЕЙСТВИЙ',
      heading: '3 простых шага',
      body: '',
      steps: [
        { title: trunc(pick(9) || 'Первый шаг', 40), description: trunc(pick(10) || '', 60) },
        { title: trunc(pick(11) || 'Второй шаг', 40), description: trunc(pick(12) || '', 60) },
        { title: trunc(pick(13) || 'Третий шаг', 40), description: trunc(pick(14) || '', 60) },
      ],
    },
    {
      id: '7', type: 'cta', bgMode: 'gradient',
      tag: 'ДЕЙСТВУЙ',
      heading: trunc(blocks[blocks.length - 1] || 'Сохрани и попробуй →', 70),
      body: 'Ставь ❤️ и подпишись чтобы не пропустить',
      ctaText: 'Подписаться →',
    },
  ];

  fs.writeFileSync(SLIDES_PATH, JSON.stringify(slides, null, 2));
  log('✅', `Слайды: ${slides.length} шт. → ${SLIDES_PATH}`);
  return slides;
}

// ── Main ───────────────────────────────────────────────────────

const reelUrl = process.argv[2];
if (!reelUrl) {
  console.error('Usage: node scripts/reel-to-carousel.mjs <REEL_URL>');
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log('\n' + '═'.repeat(50));
log('🚀', `Pipeline: ${reelUrl}`);
console.log('═'.repeat(50) + '\n');

try {
  stepDownload(reelUrl);
  stepAudio();
  const transcript = stepTranscribe();
  stepSlides(transcript);

  console.log('\n' + '═'.repeat(50));
  log('🎉', 'Готово! Файлы:');
  console.log(`   📹 ${VIDEO_PATH}`);
  console.log(`   🔊 ${AUDIO_PATH}`);
  console.log(`   📝 ${TRANSCRIPT_PATH}`);
  console.log(`   🎨 ${SLIDES_PATH}`);
  console.log('═'.repeat(50) + '\n');
} catch (e) {
  log('❌', `Ошибка: ${e.message}`);
  process.exit(1);
}
