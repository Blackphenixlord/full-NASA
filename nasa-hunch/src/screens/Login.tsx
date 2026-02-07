// src/screens/Login.tsx
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [last, setLast] = useState<string>(""); // raw shown before
  const [lastNormalized, setLastNormalized] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [syncWhen, setSyncWhen] = useState(() => new Date());
  const submitTimer = useRef<number | null>(null);
  const typedRef = useRef<string>("");
  // no visible input; scanner writes to buffer via global keydown
  const AUTO_SUBMIT_MS = 120; // pause threshold to auto-submit
  const ANIM_MS = 700;
  // keep typedRef in sync
  useEffect(() => { typedRef.current = typed; }, [typed]);

  useEffect(() => {
    const id = window.setInterval(() => setSyncWhen(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const syncLabel = useMemo(
    () => syncWhen.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [syncWhen]
  );

  // Badge IDs
  const BADGES: Record<string, BadgeConfig> = useMemo(
    () => ({
      // crew badge
      "0013763240": { actor: "crew", uiMode: "crew" },

      // ground badge
      "0013751699": { actor: "ground", uiMode: "ground" },
    }),
    []
  );

  // compute after BADGES is defined
  const maxBadgeLen = useMemo(() => Math.max(...Object.keys(BADGES).map((k) => k.length), 0), [BADGES]);

  function normalizeBadgeTag(s: string) {
    const cleaned = String(s || "").replace(/[^0-9A-Za-z]/g, "");
    // prefer an exact suffix match to a configured badge key
    for (const k of Object.keys(BADGES)) {
      if (cleaned.endsWith(k)) return k;
    }
    // numeric streams: try last 10 digits (common badge length)
    if (/^\d+$/.test(cleaned) && cleaned.length > 10) return cleaned.slice(-10);
    // try trimmed zeros variant
    const trimmed = cleaned.replace(/^0+/, "");
    if (trimmed && Object.keys(BADGES).includes(trimmed)) return trimmed;
    return cleaned;
  }

  function applyBadge(tagRaw: string) {
    const tag = String(tagRaw || "").trim();
    if (!tag) return;
    if (busy) return;
    const lastBadge = sessionStorage.getItem("lastBadge");
    const lastTime = Number(sessionStorage.getItem("lastBadgeTime") || "0");
    if (lastBadge === tag && Date.now() - lastTime < 3000) {
      setErr("Badge recently used. Wait a moment.");
      return;
    }
    setBusy(true);
    sessionStorage.setItem("lastBadge", tag);
    sessionStorage.setItem("lastBadgeTime", String(Date.now()));

    setLast(tag); // raw
    const norm = normalizeBadgeTag(tag);
    setLastNormalized(norm);
    console.debug("Badge scan raw:", tag, "normalized:", norm);

    setTyped("");

    // try normalized then raw for lookup
    const badge = BADGES[norm] ?? BADGES[tag];

    if (!badge) {
      // unknown -> quick error animation
      setAnimating(true);
      setSuccess(false);
      setErr(`Unknown badge: ${tag}`);
      setTimeout(() => {
        setAnimating(false);
        setBusy(false);
      }, ANIM_MS);
      return;
    }

    // success -> animate, then navigate
    localStorage.setItem("actor", badge.actor);
    localStorage.setItem("uiMode", badge.uiMode);

    // route per uiMode (use explicit paths)
    let next: string;
    if (badge.uiMode === "ground") next = "/ground";
    else if (badge.uiMode === "crew") next = "/crew";
    else {
      const qs = new URLSearchParams(window.location.search);
      qs.set("mode", badge.uiMode);
      next = `${window.location.pathname}?${qs.toString()}`;
    }
    console.debug("Badge login:", badge, "navigating to", next);

    setAnimating(true);
    setSuccess(true);
    // keep visual feedback for ANIM_MS then navigate
    setTimeout(() => {
      window.history.replaceState(null, "", next);
      window.location.href = next;
    }, ANIM_MS);
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

  // (no focus — no visible input)

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: NORD.bg, color: NORD.text }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderBottom: `1px solid rgba(236,239,244,0.06)`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              borderRadius: "0.75rem",
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              background: NORD.panel,
              color: NORD.text,
            }}
          >
            KSC
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: NORD.text }}>Operator • Login</div>
            <div style={{ fontSize: "0.75rem", color: NORD.muted }}>Badge Access</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            color: NORD.muted,
            background: NORD.panel,
            padding: "0.4rem 0.75rem",
            borderRadius: "0.75rem",
            border: `1px solid rgba(216,222,233,0.10)`,
          }}
        >
          <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: NORD.green, display: "inline-block" }} />
          Sync
          <span style={{ color: NORD.subtle }}>{syncLabel}</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 16 }}>
      <style>{`
        .login-card { transition: transform ${ANIM_MS}ms ease, box-shadow ${ANIM_MS}ms ease, border-color ${ANIM_MS}ms ease; }
        .login-card.success { transform: scale(0.99); border-color: ${NORD.green} !important; box-shadow: 0 10px 30px rgba(163,190,140,0.18); }
        .login-card.error { animation: shake ${ANIM_MS}ms; border-color: ${NORD.red} !important; }
        @keyframes shake { 0% { transform: translateX(0) } 20% { transform: translateX(-6px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(4px) } 100% { transform: translateX(0) } }
        .check { transition: opacity ${ANIM_MS/2}ms ease, transform ${ANIM_MS/2}ms ease; opacity: 0; transform: scale(0.8); }
        .check.visible { opacity: 1; transform: scale(1); }
      `}</style>

      <div
        className={`login-card ${animating ? (success ? "success" : "error") : ""}`}
        style={{
          width: 460,
          maxWidth: "100%",
          border: "1px solid rgba(216,222,233,0.14)",
          borderRadius: 12,
          padding: 16,
          background: NORD.panel,
          position: "relative",
          pointerEvents: busy ? "none" : "auto",
        }}
      >
        <div style={{ position: "absolute", right: 14, top: 14 }}>
          <div className={`check ${animating && success ? "visible" : ""}`} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NORD.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: NORD.blue }}>
          Crew + Ground Access
        </div>
        <h2 style={{ marginTop: 6, marginBottom: 6, fontSize: "1.35rem" }}>Scan Badge</h2>
        <div style={{ opacity: 0.85, marginBottom: 12, color: NORD.muted }}>Scan your ID tag to log in.</div>
        <div style={{ marginBottom: 10, opacity: 0.9, color: NORD.muted }}>
          Scanning active — present your badge to the reader. 
        </div>
        <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
          <div>Last scan (raw): <span style={{ opacity: 0.8 }}>{last || "—"}</span></div>
          <div>Normalized: <span style={{ opacity: 0.8 }}>{lastNormalized || "—"}</span></div>
          {err ? <div style={{ marginTop: 6, color: NORD.red }}>{err}</div> : null}
        </div>
        <hr style={{ margin: "14px 0", opacity: 0.15 }} />
        <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.35, color: NORD.subtle }}>
          <div><b>To set real badge IDs:</b> replace the badge strings in BADGES above.</div>
        </div>
      </div>
      </div>
    </div>
  );
}
