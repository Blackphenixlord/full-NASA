import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiUrl } from "../../lib/apiBase";
import { useKeyboardWedgeScan } from "../../lib/useKeyboardWedgeScan";

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  subtle: "#D8DEE9",
  muted: "#A3ABB9",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  teal: "#8FBCBB",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
  orange: "#D08770",
  purple: "#B48EAD",
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Card({
  title,
  children,
  right,
  className,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl p-5 animate-fade-up", className)}
      style={{
        background: "rgba(59,66,82,0.92)",
        border: "1px solid rgba(216,222,233,0.10)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl font-semibold" style={{ color: NORD.text }}>
            {title}
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const styles = {
    primary: { bg: NORD.blue3, fg: NORD.text, hover: NORD.blue2, bd: "1px solid transparent" },
    secondary: { bg: NORD.blue2, fg: NORD.text, hover: NORD.blue, bd: "1px solid transparent" },
    ghost: {
      bg: "transparent",
      fg: NORD.subtle,
      hover: "rgba(216,222,233,0.08)",
      bd: "1px solid rgba(216,222,233,0.16)",
    },
    danger: { bg: NORD.red, fg: NORD.text, hover: "rgba(191,97,106,0.85)", bd: "1px solid transparent" },
  } as const;
  const s = styles[variant] ?? styles.primary;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-5 py-4 text-lg font-semibold transition hover-lift",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-95",
        className,
      )}
      style={{
        background: s.bg,
        color: s.fg,
        border: s.bd,
      }}
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

function BigInput({
  value,
  onChange,
  placeholder,
  onKeyDown,
  onFocus,
  onBlur,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-2xl px-5 py-5 text-2xl font-semibold outline-none",
        className,
      )}
      style={{
        background: NORD.panel2,
        color: NORD.text,
        border: "1px solid rgba(216,222,233,0.14)",
      }}
    />
  );
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const map = {
    neutral: {
      bg: "rgba(129,161,193,0.16)",
      fg: NORD.blue2,
      bd: "rgba(129,161,193,0.26)",
    },
    good: {
      bg: "rgba(163,190,140,0.14)",
      fg: NORD.green,
      bd: "rgba(163,190,140,0.22)",
    },
    warn: {
      bg: "rgba(235,203,139,0.14)",
      fg: NORD.yellow,
      bd: "rgba(235,203,139,0.22)",
    },
    bad: {
      bg: "rgba(191,97,106,0.14)",
      fg: NORD.red,
      bd: "rgba(191,97,106,0.22)",
    },
  } as const;
  const s = map[tone] ?? map.neutral;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

function parseLocation(code: string) {
  const raw = String(code ?? "").trim();
  if (!raw) return { code: "—", english: "" };

  if (raw.startsWith("IRA") || raw.startsWith("IRB")) {
    const m = raw.match(/^IR([AB])L(\d{1,2})L(\d{1,2})$/);
    if (m) {
      const bay = m[1] === "A" ? "Irregular A" : "Irregular B";
      const a = Number(m[2]);
      const b = Number(m[3]);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return { code: raw, english: `${bay}, slots L${lo}–L${hi}` };
    }
    return { code: raw, english: "Irregular storage" };
  }

  const parts = raw.split("/").filter(Boolean);
  const top = parts[0] ?? "";
  const mt = top.match(/^S(\d)D(\d)L(\d{1,2})$/);

  let topEnglish = top;
  if (mt) {
    const shelf = Number(mt[1]);
    const depth = Number(mt[2]);
    const slot = Number(mt[3]);
    topEnglish = `Shelf ${shelf}, depth ${depth}, slot L${slot}`;
  }

  const rest = parts.slice(1);

  const containerEnglish = rest
    .slice(0, Math.max(0, rest.length - 1))
    .map((seg) => {
      if (seg.startsWith("CTB-")) return `CTB ${seg.slice(4)}`;
      if (seg.startsWith("BOB-")) return `BOB ${seg.slice(4)}`;
      return seg;
    });

  const leaf = rest.length ? rest[rest.length - 1] : null;
  const leafEnglish =
    leaf && !leaf.startsWith("CTB-") && !leaf.startsWith("BOB-")
      ? `Item ${leaf}`
      : null;

  const englishBits = [topEnglish, ...containerEnglish].filter(Boolean);
  if (leafEnglish) englishBits.push(leafEnglish);

  return { code: raw, english: englishBits.join(" • ") };
}

function LocationBlock({ code, english, big = false }: { code: string; english: string; big?: boolean }) {
  return (
    <div
      className={cn("rounded-2xl px-5 py-4", big ? "py-5" : "")}
      style={{
        background: "rgba(46,52,64,0.32)",
        border: "1px solid rgba(136,192,208,0.18)",
      }}
    >
      {english ? (
        <>
          <div
            className={cn(big ? "text-3xl" : "text-2xl", "font-semibold")}
            style={{ color: NORD.text }}
          >
            {english}
          </div>
          <div
            className={cn(
              big ? "mt-2 text-lg" : "mt-1 text-sm",
              "font-semibold",
            )}
            style={{ color: NORD.muted }}
          >
            {code || "—"}
          </div>
        </>
      ) : (
        <div className="text-base" style={{ color: NORD.subtle }}>
          {code || "—"}
        </div>
      )}
    </div>
  );
}

type DirectoryEntry = {
  id: string;
  name: string;
  tagId: string;
  location: string;
  kind: string;
};

type CrewScanResponse = {
  id: string;
  name: string;
  tagId: string;
  location?: string;
  kind?: string;
};

type SearchItem = {
  id: string;
  code: string;
  name: string;
};

export default function RemoveScreen() {
  const [scanValue, setScanValue] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchDetails, setSearchDetails] = useState<Record<string, { location?: string; kind?: string }>>({});
  const fetchedDetailsRef = useRef<Set<string>>(new Set());
  const [scanned, setScanned] = useState<DirectoryEntry | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [lastActionAt, setLastActionAt] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function reset() {
    setScanValue("");
    setScanned(null);
    setConfirmed(false);
    setRemoved(false);
    setWarning(null);
  }

  const submitScan = useCallback(async (override?: string) => {
    const norm = String(override ?? scanValue ?? "").trim();
    if (!norm) return;
    try {
      const res = await fetch(apiUrl("/crew/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: norm }),
      });
      if (!res.ok) throw new Error("SCAN_FAILED");
      const data = (await res.json()) as CrewScanResponse;
      setScanned({
        id: data.id,
        name: data.name,
        tagId: data.tagId ?? norm,
        location: data.location ?? "",
        kind: data.kind ?? "—",
      });
      setConfirmed(false);
      setRemoved(false);
      setWarning(null);
    } catch {
      setScanned(null);
      setConfirmed(false);
      setRemoved(false);
      setWarning("Item not found. Try again.");
    }
  }, [scanValue]);

  useEffect(() => {
    fetch(apiUrl("/tag/items"))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSearchItems(list.map((item) => ({
          id: item.id,
          code: item.code ?? item.id,
          name: item.name ?? item.id,
        })));
      })
      .catch(() => setSearchItems([]));
  }, []);

  const filteredSearch = useMemo(() => {
    const q = scanValue.trim().toLowerCase();
    if (!q) return [];
    return searchItems
      .filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchItems, scanValue]);

  useEffect(() => {
    if (!filteredSearch.length) return;
    filteredSearch.slice(0, 4).forEach((item) => {
      if (fetchedDetailsRef.current.has(item.id)) return;
      fetchedDetailsRef.current.add(item.id);
      fetch(apiUrl("/crew/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: item.code }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setSearchDetails((prev) => ({
            ...prev,
            [item.id]: { location: data.location ?? data.home ?? "", kind: data.kind ?? "" },
          }));
        })
        .catch(() => {});
    });
  }, [filteredSearch]);

  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value) => {
      setScanValue(value);
      submitScan(value);
    },
  });

  function confirmItem() {
    if (!scanned) return;
    setConfirmed(true);
  }

  async function markRemoved() {
    if (!scanned || !confirmed) return;
    try {
      const res = await fetch(apiUrl("/crew/remove"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: scanned.id }),
      });
      if (!res.ok) throw new Error("REMOVE_FAILED");
      setRemoved(true);
      setLastActionAt(Date.now());
    } catch {
      setWarning("Remove failed. Try again.");
    }
  }

  const location = scanned ? parseLocation(scanned.location) : null;

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-3xl font-semibold" style={{ color: NORD.text }}>
            Take out
          </div>
          <div className="text-base" style={{ color: NORD.muted }}>
            Scan an item, confirm the details, and mark it as removed.
          </div>
        </div>
        {removed ? <Pill label="Removed" tone="good" /> : null}
      </div>

      <Card title="Scan" right={warning ? <Pill label={warning} tone="bad" /> : null}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          <div className="space-y-3">
            <BigInput
              value={scanValue}
              onChange={(value) => setScanValue(value)}
              placeholder="Scan RFID tag…"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitScan();
              }}
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={submitScan}>Submit</Button>
              <Button variant="ghost" onClick={reset}>
                Clear
              </Button>
            </div>
            {warning ? (
              <div className="text-sm" style={{ color: NORD.red }}>
                {warning}
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-sm font-semibold" style={{ color: NORD.subtle }}>
              Location
            </div>
            <div className="mt-3">
              {location ? (
                <LocationBlock code={location.code} english={location.english} />
              ) : (
                <LocationBlock code="—" english="" />
              )}
            </div>
          </div>
        </div>
      </Card>

      {filteredSearch.length ? (
        <div
          className="rounded-2xl p-4"
          style={{ background: NORD.panel, border: "1px solid rgba(216,222,233,0.10)" }}
        >
          <div className="text-sm" style={{ color: NORD.subtle }}>Search results</div>
          <div className="mt-3 space-y-3">
            {filteredSearch.map((item) => {
              const detail = searchDetails[item.id];
              return (
                <div
                  key={item.id}
                  className="rounded-2xl px-4 py-3 flex items-start justify-between gap-3"
                  style={{ background: NORD.panel2, border: "1px solid rgba(216,222,233,0.10)" }}
                >
                  <div className="min-w-0">
                    <div className="text-base font-semibold" style={{ color: NORD.text }}>{item.name}</div>
                    <div className="text-sm" style={{ color: NORD.muted }}>{item.code}</div>
                    <div className="text-xs" style={{ color: NORD.subtle }}>
                      {detail?.location ? detail.location : "Location —"}
                    </div>
                  </div>
                  <Button onClick={() => { setScanValue(item.code); submitScan(item.code); }} className="px-3 py-2 text-sm">
                    Pick
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Item">
          <div className="space-y-4">
            <div>
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Name
              </div>
              <div className="text-xl font-semibold" style={{ color: NORD.text }}>
                {scanned?.name ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Item ID
              </div>
              <div className="text-base" style={{ color: NORD.muted }}>
                {scanned?.id ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Category
              </div>
              <div className="text-base" style={{ color: NORD.muted }}>
                {scanned?.kind ?? "—"}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Checklist">
          <div className="space-y-4">
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: "rgba(46,52,64,0.32)",
                border: "1px solid rgba(216,222,233,0.10)",
              }}
            >
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Step 1
              </div>
              <div className="text-base font-semibold" style={{ color: NORD.text }}>
                Confirm item label
              </div>
            </div>

            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: "rgba(46,52,64,0.32)",
                border: "1px solid rgba(216,222,233,0.10)",
              }}
            >
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Step 2
              </div>
              <div className="text-base font-semibold" style={{ color: NORD.text }}>
                Secure item
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={confirmItem} disabled={!scanned}>
                Confirm item
              </Button>
              <Button variant="danger" onClick={markRemoved} disabled={!confirmed}>
                Mark removed
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Log">
          <div className="space-y-3">
            <div className="text-sm" style={{ color: NORD.subtle }}>
              Last action
            </div>
            <div
              className="rounded-2xl px-4 py-3 text-base"
              style={{
                background: "rgba(46,52,64,0.32)",
                border: "1px solid rgba(216,222,233,0.10)",
                color: NORD.text,
              }}
            >
              {removed
                ? `Removed ${scanned?.name ?? "item"}`
                : "No actions yet"}
            </div>
            <div className="text-sm" style={{ color: NORD.muted }}>
              {lastActionAt ? new Date(lastActionAt).toLocaleString() : "—"}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
