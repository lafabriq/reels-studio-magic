import { useState, useCallback, useRef } from "react";
import { dispatch, pollResult } from "./use-reel-fetcher";

export type LoginStatus =
  | "idle"
  | "loading"
  | "checkpoint"
  | "confirming"
  | "ok"
  | "error";

export type LoginState = {
  status: LoginStatus;
  checkpointUrl?: string;
  error?: string;
};

export function useInstagramLogin() {
  const [state, setState] = useState<LoginState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const checkpointUrlRef = useRef<string>("");

  const login = useCallback(async (username: string, password: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ status: "loading" });

    try {
      const requestId = Math.random().toString(36).slice(2, 10);
      await dispatch("ig_login", { username, password, request_id: requestId });

      const result = await pollResult(
        `results/ig-login-${requestId}.json`,
        ctrl.signal,
      );

      if (result.error) {
        setState({ status: "error", error: result.error as string });
      } else if (result.status === "checkpoint") {
        checkpointUrlRef.current = (result.checkpoint_url as string) ?? "";
        setState({ status: "checkpoint", checkpointUrl: checkpointUrlRef.current });
      } else if (result.status === "ok") {
        setState({ status: "ok" });
        localStorage.setItem("ig_logged_in", "1");
      } else {
        setState({ status: "error", error: "Неизвестный ответ от сервера" });
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "Неизвестная ошибка",
        });
      }
    }
  }, []);

  const confirmCode = useCallback(async (securityCode: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState((prev) => ({ ...prev, status: "confirming" }));

    try {
      const requestId = Math.random().toString(36).slice(2, 10);
      await dispatch("ig_confirm", {
        checkpoint_url: checkpointUrlRef.current,
        security_code: securityCode,
        request_id: requestId,
      });

      const result = await pollResult(
        `results/ig-confirm-${requestId}.json`,
        ctrl.signal,
      );

      if (result.error) {
        setState({ status: "checkpoint", error: result.error as string, checkpointUrl: checkpointUrlRef.current });
      } else if (result.status === "ok") {
        setState({ status: "ok" });
        localStorage.setItem("ig_logged_in", "1");
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "Неизвестная ошибка",
        });
      }
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ig_logged_in");
    setState({ status: "idle" });
  }, []);

  return { state, login, confirmCode, logout };
}
