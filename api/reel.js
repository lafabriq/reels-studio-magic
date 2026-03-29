/**
 * Vercel Serverless Function — получение прямой ссылки на видео из Instagram Reels.
 *
 * POST /api/reel
 * Body: { "url": "https://www.instagram.com/reel/SHORTCODE/", "sessionid": "..." }
 * Response: { "videoUrl": "https://..." }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function extractShortcode(url) {
  const match = url.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).set(CORS_HEADERS).end();
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, sessionid } = req.body ?? {};
  if (!url) return res.status(400).json({ error: "url обязателен" });
  if (!sessionid) return res.status(400).json({ error: "sessionid обязателен — войди через форму на сайте" });

  const shortcode = extractShortcode(url);
  if (!shortcode) return res.status(400).json({ error: "Неверная ссылка на Reel" });

  try {
    const igRes = await fetch(
      `https://i.instagram.com/api/v1/media/by/shortcode?shortcode=${shortcode}`,
      {
        headers: {
          "User-Agent": "Instagram 289.0.0.77.109 Android (28/9; 420dpi; 1080x2220; samsung; SM-A505F; a50; exynos9610; en_US; 314665256)",
          "Accept-Language": "en-US",
          "X-IG-App-ID": "567067343352427",
          "Cookie": `sessionid=${sessionid}`,
        },
      }
    );

    if (igRes.status === 401 || igRes.status === 403) {
      return res.status(401).json({ error: "Сессия Instagram истекла — войди снова" });
    }

    if (!igRes.ok) {
      return res.status(502).json({ error: `Instagram вернул ошибку: ${igRes.status}` });
    }

    const data = await igRes.json();
    const media = data.media ?? data;
    const versions = (media.video_versions ?? []).sort(
      (a, b) => b.width * b.height - a.width * a.height
    );

    if (!versions.length) {
      return res.status(404).json({ error: "Видео не найдено — возможно, это не Reel или пост приватный" });
    }

    return res.status(200).json({ videoUrl: versions[0].url });
  } catch (err) {
    return res.status(500).json({ error: `Ошибка сервера: ${err.message}` });
  }
}
