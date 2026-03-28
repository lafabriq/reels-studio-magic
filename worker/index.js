/**
 * Cloudflare Worker — прокси для получения прямых ссылок на видео из Instagram Reels.
 *
 * Деплой:
 * 1. Создай бесплатный аккаунт на cloudflare.com
 * 2. Workers & Pages → Create → создай Worker
 * 3. Вставь этот код
 * 4. Settings → Variables → добавь Secret: IG_SESSION_ID = <твой sessionid из куки>
 *    Получить sessionid: instagram.com → F12 → Application → Cookies → sessionid
 * 5. Скопируй URL воркера (вида xxx.workers.dev) → вставь в VITE_WORKER_URL
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** Извлекает shortcode из любого формата Instagram URL */
function extractShortcode(url) {
  const match = url.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let url;
    try {
      ({ url } = await request.json());
    } catch {
      return json({ error: "Неверный JSON в теле запроса" }, 400);
    }

    if (!url) return json({ error: "url обязателен" }, 400);

    const shortcode = extractShortcode(url);
    if (!shortcode) return json({ error: "Неверная ссылка: не найден shortcode" }, 400);

    // Заголовки Instagram Android-приложения
    const igHeaders = {
      "User-Agent":
        "Instagram 289.0.0.77.109 Android (28/9; 420dpi; 1080x1794; samsung; SM-G965F; star2qltecs; samsungexynos9810; en_US; 314665256)",
      "Accept-Language": "en-US",
      "x-ig-app-id": "567067343352427",
      "x-ig-device-id": "3a1fb4e4-2b58-4de5-afc1-4beb0b42d27e",
      "x-ig-android-id": "android-ba4b3e6d4fd2a0f3",
    };

    if (env.IG_SESSION_ID) {
      igHeaders["Cookie"] = `sessionid=${env.IG_SESSION_ID}`;
    }

    try {
      // Endpoint Instagram mobile API — возвращает JSON с видео-версиями
      const apiRes = await fetch(
        `https://i.instagram.com/api/v1/media/by/shortcode?shortcode=${shortcode}`,
        { headers: igHeaders }
      );

      if (apiRes.status === 401 || apiRes.status === 403) {
        return json({
          error: "Сессия Instagram истекла — обнови IG_SESSION_ID в настройках Worker",
        }, 401);
      }

      if (!apiRes.ok) {
        return json({ error: `Instagram вернул HTTP ${apiRes.status}` }, 502);
      }

      const data = await apiRes.json();
      const media = data?.media;

      if (!media) {
        return json({ error: "Медиа не найдено — возможно приватный аккаунт" }, 404);
      }

      // Видеоверсии, отсортированные по качеству (лучшее первым)
      const versions = (media.video_versions || []).sort(
        (a, b) => b.width * b.height - a.width * a.height
      );

      if (!versions.length) {
        return json({ error: "Это фото, а не видео" }, 422);
      }

      return json({
        videoUrl: versions[0].url,
        width: versions[0].width,
        height: versions[0].height,
      });
    } catch (err) {
      return json({ error: `Ошибка Worker: ${err.message}` }, 500);
    }
  },
};
