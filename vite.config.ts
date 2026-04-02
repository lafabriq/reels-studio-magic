import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Dev-mode API plugin: serves /api/login and /api/reel locally
// In production on Vercel, the api/ directory handles this natively
function devApiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server: any) {
      // Parse JSON body helper
      const parseBody = (req: any): Promise<any> =>
        new Promise((resolve) => {
          let body = '';
          req.on('data', (chunk: string) => { body += chunk; });
          req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
        });

      const cors = (res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      };

      const IG_HEADERS = {
        'User-Agent': 'Instagram 289.0.0.77.109 Android (28/9; 420dpi; 1080x2220; samsung; SM-A505F; a50; exynos9610; en_US; 314665256)',
        'Accept-Language': 'en-US',
        'X-IG-App-ID': '567067343352427',
        'X-IG-Device-ID': '3a1fb4e4-2b58-4de5-afc1-4beb0b42d27e',
        'X-IG-Android-ID': 'android-ba4b3e6d4fd2a0f3',
      };

      // /api/login
      server.middlewares.use('/api/login', async (req: any, res: any) => {
        cors(res);
        if (req.method === 'OPTIONS') { res.statusCode = 200; return res.end(); }
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'Method not allowed' })); }

        const { username, password } = await parseBody(req);
        if (!username || !password) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'username и password обязательны' })); }

        try {
          // Get CSRF token
          const initRes = await fetch('https://i.instagram.com/api/v1/si/fetch_headers/', { headers: IG_HEADERS });
          const setCookie = initRes.headers.get('set-cookie') ?? '';
          const csrfMatch = setCookie.match(/csrftoken=([^;]+)/);
          const csrftoken = csrfMatch ? csrfMatch[1] : 'missing';

          // Login
          const params = new URLSearchParams({ username, password, device_id: 'android-ba4b3e6d4fd2a0f3', guid: '3a1fb4e4-2b58-4de5-afc1-4beb0b42d27e', phone_id: '5b4d4e0e-c4e4-4e4e-8e4e-4e4e4e4e4e4e', login_attempt_count: '0' });
          const loginRes = await fetch('https://i.instagram.com/api/v1/accounts/login/', {
            method: 'POST',
            headers: { ...IG_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-CSRFToken': csrftoken, 'Cookie': `csrftoken=${csrftoken}` },
            body: params.toString(),
          });
          const loginCookies = loginRes.headers.get('set-cookie') ?? '';
          const sessionMatch = loginCookies.match(/sessionid=([^;]+)/);
          const loginData: any = await loginRes.json().catch(() => ({}));

          if (loginData.two_factor_required) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'Требуется 2FA' })); }
          if (loginData.checkpoint_url) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'Требуется checkpoint' })); }
          if (!sessionMatch) { res.statusCode = 401; return res.end(JSON.stringify({ error: `Не удалось получить sessionid: ${loginData.message || loginRes.status}` })); }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ sessionid: sessionMatch[1] }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // /api/reel
      server.middlewares.use('/api/reel', async (req: any, res: any) => {
        cors(res);
        if (req.method === 'OPTIONS') { res.statusCode = 200; return res.end(); }
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'Method not allowed' })); }

        const { url: reelUrl, sessionid } = await parseBody(req);
        if (!reelUrl) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'url обязателен' })); }
        if (!sessionid) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'sessionid обязателен' })); }

        const shortcodeMatch = reelUrl.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
        if (!shortcodeMatch) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Неверная ссылка' })); }

        try {
          const igRes = await fetch(`https://i.instagram.com/api/v1/media/by/shortcode?shortcode=${shortcodeMatch[1]}`, {
            headers: { ...IG_HEADERS, Cookie: `sessionid=${sessionid}` },
          });

          if (igRes.status === 401 || igRes.status === 403) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'Сессия истекла — войди снова' })); }
          if (!igRes.ok) { res.statusCode = 502; return res.end(JSON.stringify({ error: `Instagram: ${igRes.status}` })); }

          const data: any = await igRes.json();
          const media = data.media ?? data;
          const versions = (media.video_versions ?? []).sort((a: any, b: any) => b.width * b.height - a.width * a.height);
          if (!versions.length) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'Видео не найдено' })); }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ videoUrl: versions[0].url }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.VERCEL ? '/' : process.env.NODE_ENV === 'production' ? '/reels-studio-magic/' : '/',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && devApiPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
