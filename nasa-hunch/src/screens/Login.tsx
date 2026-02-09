// src/screens/Login.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "../lib/apiBase";
import { useKeyboardWedgeScan } from "../lib/useKeyboardWedgeScan";
type UIMode = "crew" | "ground";
type BadgeConfig = { actor: string; uiMode: UIMode };

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#A3ABB9",
  blue: "#88C0D0",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
};

export default function Login() {
  const [typed, setTyped] = useState("");
  const [err, setErr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [pendingBadge, setPendingBadge] = useState<string>("");
  const submitTimer = useRef<number | null>(null);
  const typedRef = useRef<string>("");
  // no visible input; scanner writes to buffer via global keydown
  const AUTO_SUBMIT_MS = 120; // pause threshold to auto-submit
  const ANIM_MS = 700;
  // keep typedRef in sync
  useEffect(() => { typedRef.current = typed; }, [typed]);

  const BADGE_FALLBACK: Record<string, BadgeConfig> = useMemo(
    () => ({
      "0003070837": { actor: "crew", uiMode: "crew" },
      "0003104127": { actor: "ground", uiMode: "ground" },
    }),
    []
  );

  const maxBadgeLen = useMemo(() => Math.max(...Object.keys(BADGE_FALLBACK).map((k) => k.length), 16), [BADGE_FALLBACK]);

  async function applyBadge(tagRaw: string) {
    const tag = String(tagRaw || "").trim();
    if (!tag) return false;
    if (busy) return false;
    const lastBadge = sessionStorage.getItem("lastBadge");
    const lastTime = Number(sessionStorage.getItem("lastBadgeTime") || "0");
    if (lastBadge === tag && Date.now() - lastTime < 3000) {
      setErr("Badge recently used. Wait a moment.");
      return;
    }
    setBusy(true);
    sessionStorage.setItem("lastBadge", tag);
    sessionStorage.setItem("lastBadgeTime", String(Date.now()));

    setPendingBadge(tag);

    setTyped("");

    try {
      const res = await fetch(apiUrl("/auth/badge"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: tag }),
      });
      if (!res.ok) throw new Error("BADGE_NOT_FOUND");
      const badge = (await res.json()) as { actor: string; uiMode: UIMode; badge: string };

      localStorage.setItem("actor", badge.actor);
      localStorage.setItem("uiMode", badge.uiMode);

      let next: string;
      if (badge.uiMode === "ground") next = "/ground";
      else if (badge.uiMode === "crew") next = "/crew";
      else {
        const qs = new URLSearchParams(window.location.search);
        qs.set("mode", badge.uiMode);
        next = `${window.location.pathname}?${qs.toString()}`;
      }
      console.debug("Badge login:", badge, "navigating to", next);

      setTimeout(() => {
        window.history.replaceState(null, "", next);
        window.location.href = next;
      }, ANIM_MS);
    } catch {
      const fallback = BADGE_FALLBACK[tag];
      if (fallback) {
        localStorage.setItem("actor", fallback.actor);
        localStorage.setItem("uiMode", fallback.uiMode);
        const next = fallback.uiMode === "ground" ? "/ground" : "/crew";
        setTimeout(() => {
          window.history.replaceState(null, "", next);
          window.location.href = next;
        }, ANIM_MS);
        return true;
      }
      // unknown -> quick error animation
      setErr(`Unknown badge: ${tag}`);
      setTimeout(() => {
        setBusy(false);
      }, ANIM_MS);
      return false;
    }
    return true;
  }

  async function registerBadge(mode: UIMode) {
    if (!pendingBadge) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(apiUrl("/auth/badge/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: pendingBadge, uiMode: mode }),
      });
      if (res.status === 404) {
        const ok = await applyBadge(pendingBadge);
        if (!ok) setErr("Backend update required for badge registration.");
        return;
      }
      if (!res.ok) throw new Error("REGISTER_FAILED");
      await applyBadge(pendingBadge);
    } catch {
      setErr("Unable to register badge.");
      setBusy(false);
    }
  }

  // Wedge scanner support: buffer keys until Enter
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // ignore if typing in an input/textarea EXCEPT our own (we still allow it)
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField = tagName === "input" || tagName === "textarea";
      // if the user is actively typing in any input/textarea, ignore scanner stream
      if (isTypingField) return;

      if (e.key === "Enter") {
        // immediate commit
        if (submitTimer.current) window.clearTimeout(submitTimer.current);
        if (typedRef.current.trim()) applyBadge(typedRef.current);
        return;
      }
      if (e.key.length === 1) {
        // accept digits + letters (some scanners send hex-like)
        setTyped((prev) => {
          const next = prev + e.key;
          // quick check: if buffer is as long as the longest badge, submit immediately
          if (maxBadgeLen && next.length >= maxBadgeLen) {
            if (submitTimer.current) window.clearTimeout(submitTimer.current);
            // slight defer to allow any trailing char
            submitTimer.current = window.setTimeout(() => applyBadge(next), 20);
          } else {
            // debounce auto-submit after pause
            if (submitTimer.current) window.clearTimeout(submitTimer.current);
            submitTimer.current = window.setTimeout(() => {
              if (typedRef.current.trim()) applyBadge(typedRef.current);
            }, AUTO_SUBMIT_MS);
          }
          return next;
        });
      }
    }

    // attach once
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []); // attach once
  // clear timer on unmount
  useEffect(() => () => { if (submitTimer.current) window.clearTimeout(submitTimer.current); }, []);

  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value) => {
      setTyped(value);
      applyBadge(value);
    },
  });

  // (no focus — no visible input)

  return (
    <div className="h-screen w-screen flex items-center justify-center p-6" style={{ background: NORD.bg }}>
      <div
        className="w-full max-w-md rounded-3xl p-6 animate-fade-up"
        style={{
          background: "rgba(59,66,82,0.92)",
          border: "1px solid rgba(216,222,233,0.10)",
        }}
      >
        <div className="text-2xl font-semibold" style={{ color: NORD.text }}>
          Login
        </div>

        <div className="mt-5 space-y-4">
          <div
            className="rounded-2xl px-4 py-3 text-sm"
            style={{
              background: "rgba(46,52,64,0.55)",
              border: "1px solid rgba(216,222,233,0.12)",
              color: NORD.muted,
            }}
          >
            Scan your RFID badge to continue.
          </div>

          <div>
            <div className="text-sm font-semibold" style={{ color: NORD.muted }}>
              Badge ID
            </div>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && typed.trim()) applyBadge(typed);
              }}
              className="mt-2 w-full rounded-2xl px-4 py-3 text-base outline-none"
              style={{
                background: "rgba(46,52,64,0.55)",
                border: "1px solid rgba(216,222,233,0.12)",
                color: NORD.text,
              }}
              placeholder="Scan badge or type ID"
              autoFocus
            />
          </div>

          {err ? (
            <div className="space-y-3">
              <div className="text-sm" style={{ color: NORD.red }}>
                {err}
              </div>
              <div className="text-xs" style={{ color: NORD.subtle }}>
                If this badge is new, register it below.
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => registerBadge("crew")}
                  className="w-full rounded-2xl px-6 py-3 text-base font-semibold transition hover:opacity-95 hover-lift"
                  style={{
                    background: "rgba(129,161,193,0.18)",
                    border: "1px solid rgba(129,161,193,0.30)",
                    color: NORD.text,
                  }}
                >
                  Register as Crew
                </button>
                <button
                  type="button"
                  onClick={() => registerBadge("ground")}
                  className="w-full rounded-2xl px-6 py-3 text-base font-semibold transition hover:opacity-95 hover-lift"
                  style={{
                    background: "rgba(129,161,193,0.18)",
                    border: "1px solid rgba(129,161,193,0.30)",
                    color: NORD.text,
                  }}
                >
                  Register as Ground
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
