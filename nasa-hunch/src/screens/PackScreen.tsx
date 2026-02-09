import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiUrl } from "../lib/apiBase";

interface Container {
  id: string;
  code: string;
  capacity: number;
  used: number;
  items: string[];
}

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#A3AAB7",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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
    primary: { bg: NORD.blue3, fg: NORD.text, bd: "transparent", hover: NORD.blue2 },
    secondary: { bg: NORD.blue2, fg: NORD.text, bd: "transparent", hover: NORD.blue },
    ghost: { bg: "transparent", fg: NORD.muted, bd: "rgba(76,86,106,0.45)", hover: "rgba(76,86,106,0.22)" },
    danger: { bg: NORD.red, fg: NORD.text, bd: "transparent", hover: "rgba(191,97,106,0.85)" },
  } as const;
  const s = styles[variant] ?? styles.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition hover-lift",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-95",
        className,
      )}
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
  right,
  className,
  hideHeader = false,
}: {
  title?: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
  hideHeader?: boolean;
}) {
  return (
    <div
      className={cn("rounded-2xl p-5 shadow-sm flex flex-col animate-fade-up", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(76,86,106,0.35)`
      }}
    >
      {!hideHeader ? (
        <>
          {title ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold" style={{ color: NORD.text }}>
                  {title}
                </div>
              </div>
              {right ? <div className="shrink-0">{right}</div> : null}
            </div>
          ) : null}
          <div className="mt-4 flex-1 min-h-0">{children}</div>
        </>
      ) : (
        <div className="flex-1 min-h-0">{children}</div>
      )}
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
      className="w-full rounded-xl px-4 py-3 text-base outline-none"
      style={{
        background: NORD.panel2,
        color: NORD.text,
        border: `1px solid rgba(76,86,106,0.45)`
      }}
    />
  );
}

export default function PackScreen() {
  const [containers, setContainers] = useState<Container[]>([]);

  const [selectedOutside, setSelectedOutside] = useState<Container | null>(null);
  const [selectedInside, setSelectedInside] = useState<Container | null>(null);
  const [outsideInput, setOutsideInput] = useState("");
  const [insideInput, setInsideInput] = useState("");
  const [roomLeft, setRoomLeft] = useState(0);
  const [insideSize, setInsideSize] = useState(0);
  const [packError, setPackError] = useState<string | null>(null);
  const [packSuccess, setPackSuccess] = useState<string | null>(null);

  async function refreshContainers() {
    const res = await fetch(apiUrl("/containers"));
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as Container[];
    setContainers(data);
  }

  useEffect(() => {
    refreshContainers().catch(console.error);
  }, []);

  const filteredContainers = useMemo(() => [], []);

  function normalizeCode(value: string) {
    return value.replace(/[^0-9A-Za-z]/g, "").toLowerCase();
  }

  function findContainer(value: string) {
    const needle = normalizeCode(value);
    if (!needle) return null;
    return (
      containers.find((c) => normalizeCode(c.code) === needle || normalizeCode(c.id) === needle) ||
      containers.find((c) => normalizeCode(c.code).includes(needle) || normalizeCode(c.id).includes(needle)) ||
      null
    );
  }

  function ensureContainer(value: string) {
    const existing = findContainer(value);
    if (existing) return existing;
    const id = value.trim();
    if (!id) return null;
    const created: Container = { id, code: id, capacity: 10, used: 0, items: [] };
    setContainers((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
    return created;
  }

  function handleOutsideScan() {
    const value = outsideInput.trim();
    if (!value) return;
    const container = ensureContainer(value);
    if (container) {
      setSelectedOutside(container);
      setOutsideInput("");
      setRoomLeft(container.capacity - container.used);
      setPackError(null);
    }
  }

  function handleInsideScan() {
    const value = insideInput.trim();
    if (!value) return;
    const container = ensureContainer(value);
    if (container) {
      setSelectedInside(container);
      setInsideInput("");
      setInsideSize(container.used);
      setPackError(null);
    }
  }

  function applyMatch(container: Container) {
    if (!selectedOutside) {
      setSelectedOutside(container);
      setRoomLeft(container.capacity - container.used);
      setPackError(null);
      return;
    }
    if (!selectedInside) {
      setSelectedInside(container);
      setInsideSize(container.used);
      setPackError(null);
      return;
    }
    setSelectedOutside(container);
    setSelectedInside(null);
    setRoomLeft(container.capacity - container.used);
    setInsideSize(0);
    setPackError(null);
  }

  function handlePack() {
    if (selectedOutside && selectedInside) {
      setPackError(null);
      setPackSuccess(null);
      const applyLocalPack = () => {
        setContainers((prev) => {
          const next = prev.map((c) => {
            if (c.id !== selectedOutside.id) return c;
            const items = c.items.includes(selectedInside.id) ? c.items : [...c.items, selectedInside.id];
            return { ...c, items, used: items.length };
          });
          if (!next.some((c) => c.id === selectedInside.id)) {
            next.push({ ...selectedInside });
          }
          return next;
        });
        setPackSuccess(`Packed ${selectedInside.code} into ${selectedOutside.code}`);
        setRoomLeft(Math.max(0, selectedOutside.capacity - (selectedOutside.items.length + 1)));
        setInsideSize(selectedInside.used);
      };
      fetch(apiUrl("/containers/pack"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outsideId: selectedOutside.id, insideId: selectedInside.id }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("PACK_FAILED");
          return r.json();
        })
        .then(() => {
          applyLocalPack();
          return refreshContainers();
        })
        .catch((err) => {
          console.error(err);
          applyLocalPack();
        });
    }
  }

  function handleClearAll() {
    setSelectedOutside(null);
    setSelectedInside(null);
    setOutsideInput("");
    setInsideInput("");
    setRoomLeft(0);
    setInsideSize(0);
    setPackError(null);
    setPackSuccess(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ fontSize: "1.15rem", fontWeight: 600, color: NORD.text }}>Pack</div>
      </div>
      {packError ? (
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "rgba(191,97,106,0.18)", border: "1px solid rgba(191,97,106,0.45)" }}
        >
          <div className="text-sm" style={{ color: NORD.text }}>{packError}</div>
        </div>
      ) : null}
      {packSuccess ? (
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "rgba(163,190,140,0.18)", border: "1px solid rgba(163,190,140,0.45)" }}
        >
          <div className="text-sm" style={{ color: NORD.text }}>{packSuccess}</div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "1rem" }}>
        <div style={{ gridColumn: "span 12" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ gridColumn: "span 12" }}>
              <Card title="Outside">
                <div
                  style={{
                    borderRadius: "1rem",
                    padding: "1rem",
                    background: NORD.panel2,
                    border: "1px solid rgba(216,222,233,0.10)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "1rem",
                      padding: "1rem",
                      background: selectedOutside ? "rgba(136,192,208,0.12)" : "rgba(46,52,64,0.35)",
                      border: selectedOutside ? "1px solid rgba(136,192,208,0.35)" : "1px solid rgba(236,239,244,0.06)",
                      color: selectedOutside ? NORD.text : NORD.subtle,
                      textAlign: "center",
                      minHeight: "84px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                    }}
                  >
                    {selectedOutside ? selectedOutside.code : "Nothing selected"}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Input
                      value={outsideInput}
                      onChange={setOutsideInput}
                      placeholder="Scan outside RFID/ID"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleOutsideScan();
                      }}
                    />
                    <Button onClick={handleOutsideScan}>Scan</Button>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <Card title="Inside">
                <div
                  style={{
                    borderRadius: "1rem",
                    padding: "1rem",
                    background: NORD.panel2,
                    border: "1px solid rgba(216,222,233,0.10)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "1rem",
                      padding: "1rem",
                      background: selectedInside ? "rgba(136,192,208,0.12)" : "rgba(46,52,64,0.35)",
                      border: selectedInside ? "1px solid rgba(136,192,208,0.35)" : "1px solid rgba(236,239,244,0.06)",
                      color: selectedInside ? NORD.text : NORD.subtle,
                      textAlign: "center",
                      minHeight: "84px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                    }}
                  >
                    {selectedInside ? selectedInside.code : "Nothing selected"}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Input
                      value={insideInput}
                      onChange={setInsideInput}
                      placeholder="Scan inside RFID/ID"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleInsideScan();
                      }}
                    />
                    <Button onClick={handleInsideScan}>Scan</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Card title="Verify">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
          <div style={{ borderRadius: "1rem", padding: "1rem", background: NORD.panel2, border: "1px solid rgba(216,222,233,0.10)" }}>
            <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>Outside contents</div>
            <div style={{ marginTop: "0.5rem", fontSize: "2rem", fontWeight: 700, color: NORD.text }}>
              {selectedOutside ? selectedOutside.items.length : 0}
            </div>
          </div>
          <div style={{ borderRadius: "1rem", padding: "1rem", background: NORD.panel2, border: "1px solid rgba(216,222,233,0.10)" }}>
            <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>Inside contents</div>
            <div style={{ marginTop: "0.5rem", fontSize: "2rem", fontWeight: 700, color: NORD.text }}>
              {selectedInside ? selectedInside.items.length : 0}
            </div>
          </div>
          <div style={{ borderRadius: "1rem", padding: "1rem", background: NORD.panel2, border: "1px solid rgba(216,222,233,0.10)" }}>
            <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>Room left</div>
            <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 600, color: NORD.text }}>{roomLeft}</div>
          </div>
          <div style={{ borderRadius: "1rem", padding: "1rem", background: NORD.panel2, border: "1px solid rgba(216,222,233,0.10)" }}>
            <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>Inside size</div>
            <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 600, color: NORD.text }}>{insideSize}</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Button onClick={handlePack} disabled={!selectedOutside || !selectedInside}>
          Pack
        </Button>
        <Button variant="danger" onClick={handleClearAll}>
          Clear all
        </Button>
      </div>
    </div>
  );
}
