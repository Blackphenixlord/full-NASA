// src/views/CrewView.tsx
import { useEffect, useMemo, useState } from "react";
import Inventory from "../screens/Inventory";

type ScanPhase = "idle" | "scanning" | "ok" | "unknown" | "error";

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

export default function CrewView() {
  function logout() {
    localStorage.removeItem("actor");
    localStorage.removeItem("uiMode");
    window.location.href = "/";
  }
  const [syncWhen, setSyncWhen] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setSyncWhen(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const syncLabel = useMemo(
    () => syncWhen.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [syncWhen]
  );
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [msg, setMsg] = useState<string>("");
  const [lastTag, setLastTag] = useState<string>("");

  useEffect(() => {
    function onScan(e: any) {
      const d = e?.detail || {};
      setPhase((d.phase as ScanPhase) ?? "idle");

      // Debug: show what we're receiving
      console.log("Scan event:", d);

      if (d.itemName) {
        setMsg(`${d.itemName}${d.totalQty != null ? ` — ${d.totalQty} available` : ""}`);
      } else {
        setMsg(`Scanned: ${d.cardHex}`);
      }

      if (d.cardHex) setLastTag(String(d.cardHex));
    }

    window.addEventListener("rfid:scan", onScan as any);
    return () => window.removeEventListener("rfid:scan", onScan as any);
  }, []);

  const border =
    phase === "ok"
      ? `2px solid ${NORD.green}`
      : phase === "unknown"
      ? `2px solid ${NORD.yellow}`
      : phase === "error"
      ? `2px solid ${NORD.red}`
      : "1px solid rgba(216,222,233,0.15)";

  return (
    <>
      <style>{`
        @keyframes scanSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(420%); }
        }
        @media (max-width: 768px) {
          .crew-header {
            flex-direction: column !important;
          }
          .crew-header-content {
            width: 100%;
          }
          .crew-logout-btn {
            width: 100%;
          }
          .crew-cards {
            width: 100%;
            min-width: unset !important;
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .crew-cards {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <section style={{ display: "grid", gap: "1rem", color: NORD.text, minHeight: "100%", background: NORD.bg, padding: "1rem" }}>
        {/* Header */}
        <header
          className="crew-header"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "0.75rem",
            background: NORD.panel,
            border: "1px solid rgba(216,222,233,0.10)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
          }}
        >
          <div className="crew-header-content" style={{ minWidth: 320 }}>
          <div
            style={{
              fontSize: "0.8rem",
                color: NORD.blue,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            Crew Terminal
          </div>

          <h1
            style={{
              margin: "0.25rem 0 0 0",
              fontSize: "1.25rem",
              fontWeight: 600,
              lineHeight: 1.2,
                color: NORD.text,
            }}
          >
            Live Inventory Access
          </h1>

          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.8rem",
                color: NORD.muted,
              lineHeight: 1.4,
              maxWidth: "650px",
            }}
          >
            Search, view, and log usage of onboard supplies. All actions are automatically recorded under your role (
            <code
              style={{
                background: NORD.bg,
                border: "1px solid rgba(216,222,233,0.10)",
                borderRadius: "4px",
                padding: "0 0.25rem",
              }}
            >
              astronaut
            </code>
            ) for mission traceability.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.75rem",
              color: NORD.muted,
              background: NORD.panel2,
              padding: "0.35rem 0.65rem",
              borderRadius: "0.75rem",
              border: `1px solid rgba(216,222,233,0.10)`,
            }}
          >
            <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: NORD.green, display: "inline-block" }} />
            Sync
            <span style={{ color: NORD.subtle }}>{syncLabel}</span>
          </div>
          <button
            className="crew-logout-btn"
            onClick={logout}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(216,222,233,0.15)",
              background: "transparent",
              color: NORD.text,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        {/* Right side cards */}
        <div className="crew-cards" style={{ display: "grid", gap: 10, minWidth: 240 }}>
          {/* Scan status indicator */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              background: NORD.panel2,
              border,
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              fontSize: "0.75rem",
              lineHeight: 1.4,
            }}
            aria-label="RFID scan status"
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong style={{ fontWeight: 600 }}>RFID</strong>
              <span style={{ opacity: 0.75 }}>
                {phase === "idle" ? "Ready" : phase === "scanning" ? "Scanning…" : phase.toUpperCase()}
              </span>
            </div>

            <div style={{ marginTop: 6, opacity: 0.9 }}>
              {msg ? msg : <span style={{ opacity: 0.65 }}>Scan a tag to log IN/OUT</span>}
            </div>

            {lastTag && (
              <div style={{ marginTop: 6, opacity: 0.7, fontFamily: "monospace" }}>
                last: {lastTag}
              </div>
            )}

            {phase === "scanning" && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "30%",
                  background: "rgba(255,255,255,0.12)",
                  transform: "translateX(-100%)",
                  animation: "scanSweep 0.9s linear infinite",
                }}
              />
            )}
          </div>

          {/* Quick help */}
          <div
            style={{
              background: NORD.panel2,
              border: "1px solid rgba(216,222,233,0.12)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              fontSize: "0.75rem",
              lineHeight: 1.4,
                color: NORD.text,
            }}
            aria-label="Quick help"
          >
            <strong style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Quick Use</strong>
            <div>1. Scan tag (or search)</div>
            <div>2. Pick location (optional)</div>
            <div>3. IN / OUT logs automatically</div>
          </div>
        </div>
      </header>

      {/* Main functional surface */}
      <section
        style={{
          background: NORD.panel,
          border: "1px solid rgba(216,222,233,0.10)",
          borderRadius: "12px",
          padding: "1.5rem",
        }}
      >
        <Inventory />
      </section>
    </section>
    </>
  );
}
