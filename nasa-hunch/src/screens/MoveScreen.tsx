import { useMemo, useState, type ReactNode } from "react";
import { apiUrl } from "../lib/apiBase";

interface Move {
  fromContainer: string | null;
  toContainer: string | null;
  reason: string;
  sourceContext: string;
  destContext: string;
}

const NORD = {
  bg: "#ECEFF4", // Snow Storm - lightest
  panel: "#E5E9F0", // Snow Storm - light
  panel2: "#D8DEE9", // Snow Storm - medium
  panel3: "#C8D0DA", // Custom lighter shade
  text: "#2E3440", // Polar Night - darkest (for contrast on light bg)
  muted: "#4C566A", // Polar Night - lighter
  subtle: "#5E81AC", // Frost - for subtle text
  blue: "rgb(80, 162, 185)", // Updated light blue
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  green: "rgb(110, 144, 81)", // Updated green
  yellow: "#EBCB8B",
  red: "#BF616A",
  purple: "#B48EAD",
};

function Button({
  children,
  variant = "primary",
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary: {
      bg: NORD.blue3,
      fg: "rgb(236, 239, 244)",
      bd: "transparent",
      hover: NORD.blue2,
    },
    secondary: {
      bg: NORD.blue2,
      fg: "rgb(236, 239, 244)",
      bd: "transparent",
      hover: NORD.blue,
    },
    ghost: {
      bg: "transparent",
      fg: NORD.muted,
      bd: "rgba(76,86,106,0.45)",
      hover: "rgba(76,86,106,0.22)",
    },
    danger: {
      bg: NORD.red,
      fg: "rgb(236, 239, 244)",
      bd: "transparent",
      hover: "rgba(191,97,106,0.85)",
    },
  } as const;
  const s = styles[variant] ?? styles.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition hover-lift " +
        (disabled ? "opacity-50 cursor-not-allowed " : "hover:opacity-95 ") +
        (className ?? "")
      }
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (s.hover) e.currentTarget.style.background = s.hover;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = s.bg;
      }}
    >
      {children}
    </button>
  );
}

function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm animate-fade-up ${className ?? ""}`}
      style={{
        background: "rgba(46,52,64,0.05)",
        border: `1px solid rgba(76,86,106,0.35)`,
      }}
    >
      {title ? (
        <div className="text-base font-semibold" style={{ color: NORD.text }}>
          {title}
        </div>
      ) : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="w-full rounded-2xl px-4 py-3 text-lg outline-none"
      style={{
        background: "rgba(46,52,64,0.08)",
        color: NORD.text,
        border: `1px solid rgba(76,86,106,0.45)`,
      }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-2xl px-4 py-2.5 text-base outline-none"
      style={{
        background: "rgba(46,52,64,0.10)",
        color: NORD.text,
        border: `1px solid rgba(136,192,208,0.35)`,
        boxShadow: "inset 0 0 0 1px rgba(200,208,218,0.35)",
        minWidth: "220px",
      }}
    >
      {options.map((o) => (
        <option
          key={o}
          value={o}
          style={{ background: "rgba(46,52,64,0.10)", color: NORD.text }}
        >
          {o}
        </option>
      ))}
    </select>
  );
}

export default function MoveScreen() {
  const [move, setMove] = useState<Move>({
    fromContainer: null,
    toContainer: null,
    reason: "Space constraint",
    sourceContext: "",
    destContext: "",
  });

  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [draftOpen, setDraftOpen] = useState(false);

  const reasonOptions = [
    "Space constraint",
    "Environmental condition",
    "Accessibility",
    "Weight distribution",
    "Organization",
    "Maintenance",
  ];

  const filteredReasons = useMemo(() => [], []);

  function handleFromScan() {
    if (!fromInput.trim()) return;
    setMove({ ...move, fromContainer: fromInput.trim() });
    setFromInput("");
  }

  function handleToScan() {
    if (!toInput.trim()) return;
    setMove({ ...move, toContainer: toInput.trim() });
    setToInput("");
  }

  function handleExecuteMove() {
    if (!move.fromContainer || !move.toContainer) return;
    fetch(apiUrl("/moves"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(move),
    })
      .then((r) => {
        if (!r.ok) throw new Error("MOVE_FAILED");
        return r.json();
      })
      .catch(console.error)
      .finally(() => {
        setMove({
          fromContainer: null,
          toContainer: null,
          reason: "Space constraint",
          sourceContext: "",
          destContext: "",
        });
      });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "1.15rem", fontWeight: 600, color: NORD.text }}>
          Move
        </div>
        <Button variant="ghost" onClick={() => setDraftOpen(true)}>
          Open Draft
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: "1rem",
        }}
      >
        <div style={{ gridColumn: "span 12" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ gridColumn: "span 12" }}>
              <Card title="From">
                <div
                  style={{
                    borderRadius: "1rem",
                    padding: "1rem",
                    background: `linear-gradient(135deg, rgba(136,192,208,0.12), rgba(0,0,0,0)), rgba(46,52,64,0.08)`,
                    border: "1px solid rgba(136,192,208,0.28)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: NORD.text,
                    }}
                  >
                    {move.fromContainer ? move.fromContainer : "None selected"}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Input
                      value={fromInput}
                      onChange={setFromInput}
                      placeholder="S1-L12/CTB-0001/CTB-0002"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFromScan();
                      }}
                    />
                    <Button onClick={handleFromScan}>Scan</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setMove({ ...move, fromContainer: null })}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <Card title="To">
                <div
                  style={{
                    borderRadius: "1rem",
                    padding: "1rem",
                    background: `linear-gradient(135deg, rgba(163,190,140,0.12), rgba(0,0,0,0)), rgba(46,52,64,0.08)`,
                    border: "1px solid rgba(163,190,140,0.28)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: NORD.text,
                    }}
                  >
                    {move.toContainer ? move.toContainer : "None selected"}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Input
                      value={toInput}
                      onChange={setToInput}
                      placeholder="S2-L02/CTB-0001/CTB-0002"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleToScan();
                      }}
                    />
                    <Button onClick={handleToScan}>Scan</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setMove({ ...move, toContainer: null })}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Card title="Move">
        <div
          style={{
            borderRadius: "1rem",
            padding: "1rem",
            background: `linear-gradient(135deg, rgba(180,142,173,0.12), rgba(0,0,0,0)), rgba(46,52,64,0.08)`,
            border: "1px solid rgba(180,142,173,0.26)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: NORD.muted,
                }}
              >
                Reason
              </div>
              <Select
                value={move.reason}
                onChange={(value) => setMove({ ...move, reason: value })}
                options={reasonOptions}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button
                variant="ghost"
                onClick={() =>
                  setMove({ ...move, fromContainer: null, toContainer: null })
                }
              >
                Clear
              </Button>
              <Button
                onClick={handleExecuteMove}
                disabled={!move.fromContainer || !move.toContainer}
              >
                Execute move
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {draftOpen ? (
        <div
          onClick={() => setDraftOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(46,52,64,0.10)",
              border: "1px solid rgba(236,239,244,0.08)",
              borderRadius: "1rem",
              padding: "1.5rem",
              maxWidth: "520px",
              width: "100%",
              color: NORD.text,
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              Open Draft
            </div>
            <div
              style={{
                marginTop: "0.75rem",
                color: NORD.subtle,
                lineHeight: 1.6,
              }}
            >
              Create a draft move for later review and execution. This allows
              you to plan and validate moves before committing them to the
              system.
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                marginTop: "1rem",
              }}
            >
              <Button onClick={() => setDraftOpen(false)}>Create Draft</Button>
              <Button variant="ghost" onClick={() => setDraftOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
