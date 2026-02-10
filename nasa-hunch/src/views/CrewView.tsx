// src/views/CrewView.tsx
import { useEffect, useMemo, useState } from "react";
import AddScreen from "../screens/space/AddScreen";
import RemoveScreen from "../screens/space/RemoveScreen";
import TrashScreen from "../screens/space/TrashScreen";

type OperationType = "take" | "return" | "dispose";

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
    case "take":
      return (
        <svg style={common} viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16v10H4V7Z" stroke={NORD.muted} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 11v6" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9.5 13.5 12 11l2.5 2.5" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "return":
      return (
        <svg style={common} viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16v10H4V7Z" stroke={NORD.muted} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 17v-6" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14.5 14.5 12 17l-2.5-2.5" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "dispose":
      return (
        <svg style={common} viewBox="0 0 24 24" fill="none">
          <path d="M6 7h12l-1 14H7L6 7Z" stroke={NORD.muted} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 7V5h6v2" stroke={NORD.muted} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" stroke={NORD.blue} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function CrewView() {
  const [activeOp, setActiveOp] = useState<OperationType>("take");
  const [syncWhen, setSyncWhen] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setSyncWhen(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const syncLabel = useMemo(
    () => syncWhen.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [syncWhen],
  );

  function logout() {
    localStorage.removeItem("actor");
    localStorage.removeItem("uiMode");
    window.location.href = "/";
  }

  const operations: { id: OperationType; label: string }[] = [
    { id: "take", label: "Take out" },
    { id: "return", label: "Put back" },
    { id: "dispose", label: "Throw away" },
  ];

  const renderScreen = () => {
    switch (activeOp) {
      case "take":
        return <RemoveScreen />;
      case "return":
        return <AddScreen />;
      case "dispose":
        return <TrashScreen />;
      default:
        return <RemoveScreen />;
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .crew-container {
            grid-template-columns: 1fr !important;
          }
          .crew-sidebar {
            display: flex;
            flex-direction: row !important;
            gap: 0.5rem;
            padding: 1rem 1.5rem !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(236,239,244,0.1);
            overflow-x: auto;
          }
          .crew-sidebar button {
            white-space: nowrap;
          }
          .crew-logout {
            display: none;
          }
        }
        .crew-nav-button:hover {
          background: rgba(136,192,208,0.10) !important;
          border-color: rgba(136,192,208,0.18) !important;
        }
        .crew-nav-button:focus-visible {
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
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
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
              KSC • CREW
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: NORD.text }}>Astronaut • Crew</div>
              <div style={{ fontSize: "0.75rem", color: NORD.muted }}>DSLM • Node 2 • Workstation B</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
            <button
              onClick={logout}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(216,222,233,0.10)",
                background: NORD.panel,
                color: NORD.muted,
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Container */}
        <section className="crew-container" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0, flex: 1, minHeight: 0 }}>
          {/* Sidebar Navigation */}
          <aside
            className="crew-sidebar"
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
                  className="crew-nav-button"
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

            <div className="crew-logout" style={{ marginTop: "auto", paddingTop: "0.75rem" }}>
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
