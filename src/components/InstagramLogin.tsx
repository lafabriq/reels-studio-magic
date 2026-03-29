import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Wrench,
} from "lucide-react";
import { fetcherMode } from "@/hooks/use-reel-fetcher";

type InstagramLoginProps = {
  onSessionReady: (sessionid: string) => void;
};

// ---------------------------------------------------------------------------
// Main component — renders different UI depending on the operating mode
// ---------------------------------------------------------------------------

const InstagramLogin = ({ onSessionReady }: InstagramLoginProps) => {
  // GitHub Actions mode: session lives in GitHub Secrets, no on-site login needed
  if (fetcherMode === "github-actions") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl px-4 py-3 flex items-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <span className="text-sm font-body text-foreground">
          Режим GitHub Actions — сессия Instagram настроена через Secrets
        </span>
      </motion.div>
    );
  }

  // Unconfigured: neither VITE_GITHUB_TOKEN nor VITE_API_URL is set
  if (fetcherMode === "none") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 space-y-2 border border-yellow-500/30"
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm font-semibold font-display text-foreground">
            Настройка не завершена
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-body leading-relaxed">
          Добавь GitHub Secrets и задеплой заново — инструкции в{" "}
          <a
            href="https://github.com/lafabriq/reels-studio-magic#setup"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary hover:opacity-80"
          >
            README
          </a>
          .
        </p>
      </motion.div>
    );
  }

  // Vercel / same-origin API mode: show Instagram login form
  return <VercelLoginForm onSessionReady={onSessionReady} />;
};

// ---------------------------------------------------------------------------
// Login form — only rendered when fetcherMode === "vercel"
// ---------------------------------------------------------------------------

const API_BASE = (import.meta.env.VITE_API_URL ?? "") as string;

function VercelLoginForm({ onSessionReady }: InstagramLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(
    () => !!localStorage.getItem("ig_sessionid"),
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = (await res.json()) as { sessionid?: string; error?: string };

      if (!res.ok || !data.sessionid) {
        throw new Error(data.error ?? `Ошибка ${res.status}`);
      }

      localStorage.setItem("ig_sessionid", data.sessionid);
      setLoggedIn(true);
      setPassword("");
      onSessionReady(data.sessionid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ig_sessionid");
    setLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (loggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-sm font-body text-foreground">
            Instagram подключён
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <LogOut className="w-3.5 h-3.5" />
          Выйти
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <LogIn className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm font-semibold font-display text-foreground">
          Войди в Instagram
        </p>
      </div>
      <p className="text-xs text-muted-foreground font-body">
        Нужно для получения прямых ссылок на видеофайлы. Данные не хранятся —
        сохраняется только сессия.
      </p>

      <form onSubmit={handleLogin} className="space-y-2">
        <input
          type="text"
          placeholder="Логин или почта"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 pr-10 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 text-xs text-destructive font-body"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={isLoading || !username || !password}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {isLoading ? "Входим…" : "Войти"}
        </button>
      </form>
    </motion.div>
  );
}

export default InstagramLogin;
