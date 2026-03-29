/**
 * Vercel Serverless Function — логин в Instagram и получение sessionid.
 *
 * POST /api/login
 * Body: { "username": "...", "password": "..." }
 * Response: { "sessionid": "..." }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Instagram Android app fingerprint
const IG_HEADERS = {
  "User-Agent":
    "Instagram 289.0.0.77.109 Android (28/9; 420dpi; 1080x2220; samsung; SM-A505F; a50; exynos9610; en_US; 314665256)",
  "Accept-Language": "en-US",
  "Accept": "*/*",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-IG-App-ID": "567067343352427",
  "X-IG-Device-ID": "3a1fb4e4-2b58-4de5-afc1-4beb0b42d27e",
  "X-IG-Android-ID": "android-ba4b3e6d4fd2a0f3",
  "X-IG-Capabilities": "3brTvwM=",
  "X-IG-Connection-Type": "WIFI",
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).set(CORS_HEADERS).end();
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "username и password обязательны" });
  }

  try {
    // Step 1: get csrftoken from Instagram
    const initRes = await fetch("https://i.instagram.com/api/v1/si/fetch_headers/", {
      method: "GET",
      headers: IG_HEADERS,
    });

    const setCookie = initRes.headers.get("set-cookie") ?? "";
    const csrfMatch = setCookie.match(/csrftoken=([^;]+)/);
    const csrftoken = csrfMatch ? csrfMatch[1] : "missing";

    // Step 2: login with username + password
    const params = new URLSearchParams({
      username,
      password,
      device_id: "android-ba4b3e6d4fd2a0f3",
      guid: "3a1fb4e4-2b58-4de5-afc1-4beb0b42d27e",
      phone_id: "5b4d4e0e-c4e4-4e4e-8e4e-4e4e4e4e4e4e",
      login_attempt_count: "0",
    });

    const loginRes = await fetch("https://i.instagram.com/api/v1/accounts/login/", {
      method: "POST",
      headers: {
        ...IG_HEADERS,
        "X-CSRFToken": csrftoken,
        "Cookie": `csrftoken=${csrftoken}`,
      },
      body: params.toString(),
    });

    const loginCookies = loginRes.headers.get("set-cookie") ?? "";
    const sessionMatch = loginCookies.match(/sessionid=([^;]+)/);

    const loginData = await loginRes.json().catch(() => ({}));

    // Instagram checkpoint (2FA / challenge)
    if (loginData.two_factor_required) {
      return res.status(401).json({
        error: "Требуется двухфакторная аутентификация. Отключи 2FA в настройках Instagram или получи sessionid вручную из браузера.",
      });
    }

    if (loginData.checkpoint_url || loginData.action === "checkpoint") {
      return res.status(401).json({
        error: "Instagram требует подтверждение (checkpoint). Войди на instagram.com в браузере, подтверди вход, затем скопируй sessionid из куки (F12 → Application → Cookies).",
      });
    }

    if (!sessionMatch) {
      const msg = loginData.message || loginData.error_type || loginRes.status;
      return res.status(401).json({
        error: `Не удалось получить sessionid: ${msg}`,
      });
    }

    return res.status(200).json({ sessionid: sessionMatch[1] });
  } catch (err) {
    return res.status(500).json({ error: `Ошибка сервера: ${err.message}` });
  }
}
