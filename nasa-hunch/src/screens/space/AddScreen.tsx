import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiUrl } from "../../lib/apiBase";
import { useKeyboardWedgeScan } from "../../lib/useKeyboardWedgeScan";

// Astronaut: Put something back
// Simple workflow (home-only): scan -> show home location -> mark returned.

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

  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
  purple: "#B48EAD",
  orange: "#D08770",
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Card({
  title,
  right,
  children,
  className,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl p-5 animate-fade-up", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(216,222,233,0.10)`,
      }}
    >
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div className="text-xl font-semibold" style={{ color: NORD.text }}>
            {title}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
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
  variant?: "primary" | "success" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition hover-lift";

  const styles = {
    primary: {
      bg: NORD.blue3,
      fg: NORD.text,
      bd: "transparent",
      hover: NORD.blue2,
    },
    success: {
      bg: NORD.green,
      fg: NORD.bg,
      bd: "transparent",
      hover: "rgba(163,190,140,0.90)",
    },
    ghost: {
      bg: "transparent",
      fg: NORD.subtle,
      bd: "rgba(216,222,233,0.16)",
      hover: "rgba(216,222,233,0.08)",
    },
  } as const;

  const s = styles[variant] ?? styles.primary;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
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

function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "progress" | "ok" | "warn" }) {
  const map = {
    neutral: {
      bg: "rgba(76,86,106,0.22)",
      fg: NORD.subtle,
      bd: "rgba(76,86,106,0.40)",
    },
    progress: {
      bg: "rgba(136,192,208,0.14)",
      fg: NORD.blue,
      bd: "rgba(136,192,208,0.22)",
    },
    ok: {
      bg: "rgba(163,190,140,0.14)",
      fg: NORD.green,
      bd: "rgba(163,190,140,0.22)",
    },
    warn: {
      bg: "rgba(235,203,139,0.14)",
      fg: NORD.yellow,
      bd: "rgba(235,203,139,0.22)",
    },
  } as const;
  const s = map[tone] ?? map.neutral;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

function locationToPlainEnglish(loc: string | null | undefined) {
  if (!loc) return "—";

  if (loc.startsWith("IRA") || loc.startsWith("IRB")) {
    const zone = loc.slice(0, 3) === "IRA" ? "Irregular A" : "Irregular B";
    const rest = loc.slice(3);
    const m = rest.match(/^L(\d+)L(\d+)$/);
    if (m) {
      return `${zone}, slots L${m[1]}–L${m[2]}`;
    }
    return `${zone}`;
  }

  const parts = loc.split("/");
  const top = parts[0] ?? "";
  const m = top.match(/^S(\d)D(\d)L(\d{1,2})$/);
  const topPlain = m ? `Shelf ${m[1]}, depth ${m[2]}, slot L${m[3]}` : top;

  const containers = parts
    .slice(1, -1)
    .map((p) =>
      p.startsWith("CTB-")
        ? `CTB ${p.slice(4)}`
        : p.startsWith("BOB-")
          ? `BOB ${p.slice(4)}`
          : p,
    );

  const item = parts[parts.length - 1];
  const itemPlain = item?.startsWith("ITEM-") ? `Item ${item.slice(5)}` : item;

  return [topPlain, ...containers, itemPlain].filter(Boolean).join(" → ");
}

type DirectoryEntry = {
  id: string;
  label: string;
  tagId: string;
  home: string;
};

type CrewScanResponse = {
  id: string;
  name: string;
  tagId: string;
  home?: string;
};

type SearchItem = {
  id: string;
  code: string;
  name: string;
};

export default function AddScreen() {
  const [scanned, setScanned] = useState<DirectoryEntry | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanId, setScanId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [returned, setReturned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchDetails, setSearchDetails] = useState<Record<string, { home?: string }>>({});
  const fetchedDetailsRef = useRef<Set<string>>(new Set());

  const scan = useCallback(async (override?: string) => {
    const raw = (override ?? scanInput).trim();
    if (!raw) return;
    setError(null);
    try {
      const res = await fetch(apiUrl("/crew/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) throw new Error("SCAN_FAILED");
      const data = (await res.json()) as CrewScanResponse;
      const entry: DirectoryEntry = {
        id: data.id,
        label: data.name,
        tagId: data.tagId ?? scanInput.trim(),
        home: data.home ?? "",
      };
      setScanned(entry);
      setScanId(entry.tagId);
      setConfirmed(false);
      setReturned(false);
      setScanInput("");
    } catch {
      setError("Scan not found.");
      setScanned(null);
      setScanId(null);
      setConfirmed(false);
      setReturned(false);
    }
  }, [scanInput]);

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
    const q = scanInput.trim().toLowerCase();
    if (!q) return [];
    return searchItems
      .filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchItems, scanInput]);

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
            [item.id]: { home: data.home ?? "" },
          }));
        })
        .catch(() => {});
    });
  }, [filteredSearch]);

  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value) => {
      setScanInput(value);
      scan(value);
    },
  });

  function confirmItem() {
    if (!scanned) return;
    setConfirmed(true);
  }

  async function markReturned() {
    if (!scanned) return;
    if (!confirmed) return;
    try {
      const res = await fetch(apiUrl("/crew/return"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: scanned.id, home: scanned.home }),
      });
      if (!res.ok) throw new Error("RETURN_FAILED");
      setReturned(true);
    } catch {
      setReturned(false);
      setError("Return failed. Try again.");
    }
  }

  const homeCode = scanned?.home ?? "—";
  const homePlain = scanned ? locationToPlainEnglish(scanned.home) : "—";

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="text-3xl font-semibold" style={{ color: NORD.text }}>
        Put back
      </div>
      <Card
        title="Put something back"
        right={
          returned ? (
            <Pill label="Returned" tone="ok" />
          ) : confirmed ? (
            <Pill label="Confirmed" tone="ok" />
          ) : scanned ? (
            <Pill label="Needs confirm" tone="warn" />
          ) : (
            <Pill label="Awaiting scan" tone="neutral" />
          )
        }
        className="w-full"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan RFID or enter unit ID"
              className="w-full rounded-2xl px-4 py-4 text-lg outline-none"
              style={{
                background: NORD.panel2,
                color: NORD.text,
                border: "1px solid rgba(216,222,233,0.12)",
              }}
            />
            <Button className="w-full sm:w-auto py-4 text-lg" onClick={scan}>
              Scan
            </Button>

            <div
              className="flex-1 rounded-2xl px-4 py-4"
              style={{
                background: NORD.panel2,
                border: `1px solid rgba(216,222,233,0.12)`
              }}
            >
              <div className="text-sm" style={{ color: NORD.muted }}>
                Scanned tag
              </div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NORD.text }}>
                {scanId ?? "—"}
              </div>
            </div>
          </div>
          {error ? (
            <div className="text-sm" style={{ color: NORD.red }}>
              {error}
            </div>
          ) : null}

          {filteredSearch.length ? (
            <div
              className="rounded-2xl p-4"
              style={{ background: NORD.panel2, border: "1px solid rgba(216,222,233,0.10)" }}
            >
              <div className="text-sm" style={{ color: NORD.subtle }}>Search results</div>
              <div className="mt-3 space-y-3">
                {filteredSearch.map((item) => {
                  const detail = searchDetails[item.id];
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl px-4 py-3 flex items-start justify-between gap-3"
                      style={{ background: "rgba(46,52,64,0.35)", border: "1px solid rgba(216,222,233,0.10)" }}
                    >
                      <div className="min-w-0">
                        <div className="text-base font-semibold" style={{ color: NORD.text }}>{item.name}</div>
                        <div className="text-sm" style={{ color: NORD.muted }}>{item.code}</div>
                        <div className="text-xs" style={{ color: NORD.subtle }}>
                          {detail?.home ? detail.home : "Home —"}
                        </div>
                      </div>
                      <Button onClick={() => { setScanInput(item.code); scan(item.code); }} className="px-3 py-2 text-sm">
                        Pick
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(46,52,64,0.35)",
              border: `1px solid rgba(136,192,208,0.22)`
            }}
          >
            <div className="text-sm" style={{ color: NORD.muted }}>
              Home location
            </div>
            <div className="mt-2 text-3xl font-semibold" style={{ color: NORD.text }}>
              {scanned ? homePlain : "Scan an item to see its home."}
            </div>
            <div className="mt-3 text-base" style={{ color: NORD.blue }}>
              {scanned ? homeCode : ""}
            </div>
          </div>

          {scanned ? (
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(46,52,64,0.25)",
                border: `1px solid rgba(216,222,233,0.10)`
              }}
            >
              <div className="text-sm" style={{ color: NORD.muted }}>Item</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NORD.text }}>{scanned.label}</div>
              <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>{scanned.id}</div>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title="Confirm"
          right={
            returned ? (
              <Pill label="Done" tone="ok" />
            ) : confirmed ? (
              <Pill label="Confirmed" tone="ok" />
            ) : scanned ? (
              <Pill label="Pending" tone="warn" />
            ) : null
          }
          className="w-full"
        >
          {!scanned ? (
            <div className="text-base" style={{ color: NORD.subtle }}>
              Scan an item to begin.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm" style={{ color: NORD.muted }}>
                  Verify the item in-hand matches:
                </div>
                <div className="mt-2 text-2xl font-semibold" style={{ color: NORD.text }}>
                  {scanned.label}
                </div>
                <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>
                  {scanned.id}
                </div>
              </div>

              <Button
                variant={confirmed ? "success" : "primary"}
                className="w-full py-5 text-xl"
                onClick={confirmItem}
                disabled={confirmed || returned}
              >
                {confirmed ? "Confirmed ✓" : "Confirm this is the item"}
              </Button>

              <div className="text-sm" style={{ color: NORD.muted }}>
                {confirmed ? "Confirmed. You can now mark it returned." : "Required before returning."}
              </div>
            </div>
          )}
        </Card>

        <Card title="Mark returned" className="w-full">
          <Button
            variant="success"
            className="w-full py-5 text-xl"
            onClick={markReturned}
            disabled={!scanned || !confirmed || returned}
          >
            {returned ? "Returned ✓" : "Mark as returned"}
          </Button>
          <div className="mt-3 text-sm" style={{ color: NORD.muted }}>
            {returned
              ? "Inventory updated."
              : !scanned
                ? "Disabled until something is scanned."
                : !confirmed
                  ? "Disabled until the item is confirmed."
                  : "Ready."}
          </div>
        </Card>
      </div>
    </div>
  );
}
