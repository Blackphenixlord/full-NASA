import { useEffect, useMemo, useState } from "react";
import ReceiveScreen from "../screens/ReceiveScreen";
import TagScreen from "../screens/TagScreen";
import PackScreen from "../screens/PackScreen";
import StowScreen from "../screens/StowScreen";
import MoveScreen from "../screens/MoveScreen";

type OperationType = "receive" | "tag" | "pack" | "stow" | "move";

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#A3ABB9",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
};

function Icon({ name }: { name: OperationType }) {
  const common = { width: "1rem", height: "1rem" } as const;
  switch (name) {
    case "receive":
      return (
        <svg style={common} viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16v10H4V7Z" stroke={NORD.muted} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M4 10h16" stroke={NORD.muted} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 14h8" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "tag":
      return (
        <svg style={common} viewBox="0 0 24 24" fill="none">
          <path d="M20 13l-7 7-9-9V4h7l9 9Z" stroke={NORD.muted} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7.5 7.5h.01" stroke={NORD.blue} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "pack":
      return (
        <svg style={common} viewBox="0 0 24 24" fill="none">
          <path d="M7 8l5-5 5 5" stroke={NORD.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10h14v11H5V10Z" stroke={NORD.muted} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 14h6" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "stow":
      return (
        <svg style={common} viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16v12H4V6Z" stroke={NORD.muted} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 10h8M8 14h5" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 3v3" stroke={NORD.muted} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "move":
      return (
        <svg style={common} viewBox="0 0 24 24" fill="none">
          <path d="M7 7h10M7 17h10" stroke={NORD.muted} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 9l-2-2 2-2" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 15l2 2-2 2" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function WarehouseView() {
  const [activeOp, setActiveOp] = useState<OperationType>("receive");
  const [syncWhen, setSyncWhen] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setSyncWhen(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const syncLabel = useMemo(
    () => syncWhen.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [syncWhen]
  );

  function logout() {
    localStorage.removeItem("actor");
    localStorage.removeItem("uiMode");
    window.location.href = "/";
  }

  const operations: { id: OperationType; label: string }[] = [
    { id: "receive", label: "Receive" },
    { id: "tag", label: "Tag" },
    { id: "pack", label: "Pack" },
    { id: "stow", label: "Stow" },
    { id: "move", label: "Move" },
  ];

  const renderScreen = () => {
    switch (activeOp) {
      case "receive":
        return <ReceiveScreen />;
      case "tag":
        return <TagScreen />;
      case "pack":
        return <PackScreen />;
      case "stow":
        return <StowScreen />;
      case "move":
        return <MoveScreen />;
      default:
        return <ReceiveScreen />;
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .warehouse-container {
            grid-template-columns: 1fr !important;
          }
          .warehouse-sidebar {
            display: flex;
            flex-direction: row !important;
            gap: 0.5rem;
            padding: 1rem 1.5rem !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(236,239,244,0.1);
            overflow-x: auto;
          }
          .warehouse-sidebar button {
            white-space: nowrap;
          }
          .warehouse-logout {
            display: none;
          }
        }
        .warehouse-nav-button:hover {
          background: rgba(136,192,208,0.10) !important;
          border-color: rgba(136,192,208,0.18) !important;
        }
        .warehouse-nav-button:focus-visible {
          outline: 2px solid rgba(136,192,208,0.35);
          outline-offset: 2px;
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: NORD.bg }}>
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderBottom: `1px solid rgba(236,239,244,0.06)`,
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
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: NORD.text }}>Operator • Warehouse</div>
              <div style={{ fontSize: "0.75rem", color: NORD.muted }}>Warehouse Station</div>
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

        {/* Main Container */}
        <section className="warehouse-container" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0, flex: 1, minHeight: 0 }}>
          {/* Sidebar Navigation */}
          <aside
            className="warehouse-sidebar"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              padding: "1rem",
              background: NORD.bg,
              borderRight: `1px solid rgba(236,239,244,0.06)`,
              overflowY: "auto",
            }}
          >
            {operations.map((op) => {
              const active = activeOp === op.id;
              return (
                <button
                  className="warehouse-nav-button"
                  key={op.id}
                  onClick={() => setActiveOp(op.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem 1rem",
                    margin: 0,
                    border: `1px solid ${active ? "rgba(136,192,208,0.22)" : "rgba(216,222,233,0.00)"}`,
                    background: active ? "rgba(136,192,208,0.12)" : "transparent",
                    color: active ? NORD.text : NORD.muted,
                    borderRadius: "1rem",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    textAlign: "left",
                    minHeight: "56px",
                  }}
                >
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.75rem",
                      background: active ? "rgba(46,52,64,0.35)" : "rgba(216,222,233,0.06)",
                      border: "1px solid rgba(216,222,233,0.10)",
                    }}
                  >
                    <Icon name={op.id} />
                  </span>
                  <span style={{ fontSize: "1rem", fontWeight: 600 }}>{op.label}</span>
                </button>
              );
            })}

            <div className="warehouse-logout" style={{ marginTop: "auto", paddingTop: "0.75rem" }}>
              <button
                onClick={logout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  border: "1px solid rgba(216,222,233,0.08)",
                  background: "transparent",
                  color: NORD.muted,
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  textAlign: "left",
                  width: "100%",
                  borderRadius: "0.75rem",
                }}
              >
                Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "1rem",
              overflowY: "hidden",
              background: NORD.bg,
              minHeight: 0,
            }}
          >
            {renderScreen()}
          </main>
        </section>
      </div>
    </>
  );
}
