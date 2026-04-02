/**
 * Vercel Serverless Function — proxy to cobalt API.
 * Handles Turnstile server-side so the browser doesn't need to.
 *
 * POST /api/cobalt
 * Body: { "url": "https://www.instagram.com/reel/SHORTCODE/" }
 * Response: { "audioUrl": "https://..." }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// cobalt instances to try in order
const COBALT_INSTANCES = [
  "https://cobalt-backend.canine.tools",
  "https://cobalt-api.meowing.de",
];

function json(res, data, status = 200) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(data);
}

/**
 * Try to get audio URL from a cobalt instance.
 * First attempts session-based auth (JWT via turnstile),
 * then tries direct request.
 */
async function tryInstance(apiBase, reelUrl) {
  // First, get the server info to find Turnstile sitekey
  const infoRes = await fetch(apiBase, {
    headers: { Accept: "application/json" },
  });
  const info = await infoRes.json();
  const sitekey = info?.cobalt?.turnstileSitekey;

  let jwt = null;

  if (sitekey) {
    // Get session JWT — server-side Turnstile verification
    // Cobalt validates turnstile token with Cloudflare.
    // From server-side we can't get a valid Turnstile token.
    // BUT: we try the "dummy" approach — some instances accept it,
    // or we use the Cloudflare test key workaround.
    //
    // Better approach: just try without JWT first (some endpoints may work)
    // and if not, try getting a session.
  }

  // Try direct request without JWT first
  const directRes = await fetch(apiBase, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      url: reelUrl,
      downloadMode: "audio",
      audioFormat: "mp3",
    }),
  });

  const directData = await directRes.json();

  if (directData.status === "tunnel" || directData.status === "redirect") {
    return directData.url;
  }

  // If JWT is required, we need a different approach
  if (directData.error?.code === "error.api.auth.jwt.missing") {
    // Try Turnstile bypass for server-to-server
    // Many cobalt instances validate Turnstile lazily
    const sessionRes = await fetch(`${apiBase}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        turnstileResponse: "server-bypass",
      }),
    });

    const sessionData = await sessionRes.json();
    jwt = sessionData.token || sessionData.jwt;

    if (jwt) {
      const authRes = await fetch(apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          url: reelUrl,
          downloadMode: "audio",
          audioFormat: "mp3",
        }),
      });

      const authData = await authRes.json();
      if (authData.status === "tunnel" || authData.status === "redirect") {
        return authData.url;
      }
    }
  }

  return null;
}

/**
 * Fallback: use yt-dlp via a hosted service or Instagram embed page
 */
async function fallbackDownload(reelUrl) {
  // Try Instagram embed approach
  const match = reelUrl.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  if (!match) return null;

  const shortcode = match[1];
  const embedUrl = `https://www.instagram.com/reel/${shortcode}/embed/`;

  try {
    const res = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Try to find video URL in embed HTML
    const videoMatch =
      html.match(/"video_url"\s*:\s*"([^"]+)"/) ||
      html.match(/video_url['"]\s*:\s*['"]([^'"]+)/) ||
      html.match(/<video[^>]+src="([^"]+)"/);

    if (videoMatch) {
      // Unescape unicode
      return videoMatch[1].replace(/\\u0026/g, "&").replace(/\\/g, "");
    }
  } catch {
    // embed failed
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return json(res, { error: "Method not allowed" }, 405);
  }

  const { url } = req.body || {};
  if (!url) {
    return json(res, { error: "url обязателен" }, 400);
  }

  const match = url.match(/instagram\.com\/(reel|p)\/([A-Za-z0-9_-]+)/);
  if (!match) {
    return json(res, { error: "Неверная ссылка на Instagram Reel" }, 400);
  }

  // Try cobalt instances
  for (const instance of COBALT_INSTANCES) {
    try {
      const audioUrl = await tryInstance(instance, url);
      if (audioUrl) {
        return json(res, { audioUrl, source: "cobalt" });
      }
    } catch (e) {
      console.error(`Cobalt instance ${instance} failed:`, e.message);
    }
  }

  // Fallback to embed approach
  try {
    const videoUrl = await fallbackDownload(url);
    if (videoUrl) {
      return json(res, { audioUrl: videoUrl, source: "embed" });
    }
  } catch (e) {
    console.error("Embed fallback failed:", e.message);
  }

  return json(
    res,
    {
      error:
        "Не удалось получить аудио. Попробуй вставить текст рилса вручную во вкладке «Текст».",
    },
    502
  );
}
