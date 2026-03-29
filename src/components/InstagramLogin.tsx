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
  KeyRound,
} from "lucide-react";
import { useInstagramLogin } from "@/hooks/use-instagram-login";
import { getGhToken } from "@/hooks/use-reel-fetcher";

type Props = {
  onSessionReady: (ok: boolean) => void;
};

const InstagramLogin = ({ onSessionReady }: Props) => {
  const { state, login, confirmCode, logout } = useInstagramLogin();

  const [username, setUsername] = useState("Monafiora38@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [alreadyLoggedIn] = useState(() => !!localStorage.getItem("ig_logged_in"));

  const noToken = !getGhToken();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username.trim(), password);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    confirmCode(code.trim());
  };

  const handleLogout = () => {
    logout();
    onSessionReady(false);
  };

  // Logged in state
  if (state.status === "ok" || (alreadyLoggedIn && state.status === "idle")) {
    onSessionReady(true);
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
          Сменить аккаунт
        </button>
      </motion.div>
    );
  }

  // No GitHub token — show warning
  if (noToken) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 border border-yellow-500/30 text-sm text-muted-foreground font-body"
      >
        ⚙️ Бэкенд не настроен. Если ты разработчик — открой консоль и выполни:
        <br />
        <code className="text-xs bg-black/30 px-1 rounded">
          localStorage.setItem('gh_token', 'ВАШ_ТОКЕН')
        </code>
      </motion.div>
    );
  }

  // Checkpoint — need verification code
  if (state.status === "checkpoint" || state.status === "confirming") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm font-semibold font-display text-foreground">
            Instagram прислал код подтверждения
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-body leading-relaxed">
          Проверь письмо на <strong>Monafiora38@gmail.com</strong> или SMS — там
          будет 6-значный код. Введи его ниже:
        </p>

        <form onSubmit={handleConfirm} className="space-y-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
            required
            className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center tracking-[0.5em]"
          />

          <AnimatePresence>
            {state.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 text-xs text-destructive font-body"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={state.status === "confirming" || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {state.status === "confirming" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            {state.status === "confirming" ? "Проверяем…" : "Подтвердить"}
          </button>
        </form>
      </motion.div>
    );
  }

  // Default: login form
  const isLoading = state.status === "loading";

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
        Нужно один раз — сессия сохранится автоматически.
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
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {state.error && state.status === "error" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 text-xs text-destructive font-body"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{state.error}</span>
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
          {isLoading ? "Входим… (~30 сек)" : "Войти"}
        </button>
      </form>
    </motion.div>
  );
};

export default InstagramLogin;
