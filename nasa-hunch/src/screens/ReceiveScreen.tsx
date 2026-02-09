import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiUrl } from "../lib/apiBase";

interface Shipment {
  id: string;
  code: string;
  vendor: string;
  status: "in-progress" | "discrepancy" | "waiting" | "complete";
  expected: number;
  counted: number;
  items: ShipmentItem[];
}

interface ShipmentItem {
  id: string;
  sku: string;
  name: string;
  expected: number;
  counted: number;
  status: "done" | "in-progress" | "pending";
}

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#AEB6C2",
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

function StatusPill({ label, tone = "neutral" }: { label: string; tone?: string }) {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    waiting: { bg: "rgba(129,161,193,0.14)", fg: NORD.blue2, bd: "rgba(129,161,193,0.22)" },
    progress: { bg: "rgba(136,192,208,0.14)", fg: NORD.blue, bd: "rgba(136,192,208,0.22)" },
    verified: { bg: "rgba(163,190,140,0.14)", fg: NORD.green, bd: "rgba(163,190,140,0.22)" },
    issue: { bg: "rgba(191,97,106,0.14)", fg: NORD.red, bd: "rgba(191,97,106,0.22)" },
    neutral: { bg: "rgba(76,86,106,0.22)", fg: NORD.muted, bd: "rgba(76,86,106,0.40)" },
  };
  const s = map[tone] ?? map.neutral;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover-lift",
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
  subtitle,
  children,
  right,
  className,
  hideHeader = false,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
  hideHeader?: boolean;
}) {
  return (
    <div
      className={cn("rounded-2xl p-4 shadow-sm animate-fade-up", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(76,86,106,0.35)`,
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
                {subtitle ? (
                  <div className="mt-0.5 text-sm" style={{ color: NORD.subtle }}>
                    {subtitle}
                  </div>
                ) : null}
              </div>
              {right ? <div className="shrink-0">{right}</div> : null}
            </div>
          ) : null}
          <div className={title ? "mt-3" : ""}>{children}</div>
        </>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-lg font-semibold" style={{ color: NORD.text }}>{title}</div>
        {subtitle ? (
          <div className="mt-0.5 text-sm" style={{ color: NORD.subtle }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function ManifestModal({ open, onClose, manifest }: { open: boolean; onClose: () => void; manifest: any }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          maxHeight: "90vh",
          overflow: "hidden",
          borderRadius: "1rem",
          background: NORD.panel3,
          border: "1px solid rgba(236,239,244,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(236,239,244,0.08)",
          }}
        >
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 600, color: NORD.text }}>Manifest</div>
            {manifest?.shipmentId ? (
              <div style={{ marginTop: "0.25rem", fontSize: "0.95rem", color: NORD.subtle }}>
                {manifest.shipmentId} • {manifest.vendor}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div style={{ padding: "1rem", overflow: "auto", maxHeight: "calc(90vh - 72px)" }}>
          {!manifest ? (
            <div style={{ fontSize: "1rem", color: NORD.muted }}>No manifest available.</div>
          ) : (
            <>
              <div
                style={{
                  borderRadius: "1rem",
                  padding: "1rem",
                  background: "rgba(46,52,64,0.45)",
                  border: "1px solid rgba(236,239,244,0.08)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 600, color: NORD.text }}>{manifest.title}</div>
                    <div style={{ marginTop: "0.25rem", fontSize: "1rem", color: NORD.muted }}>{manifest.subtitle}</div>
                  </div>
                  <StatusPill label={manifest.stateLabel} tone={manifest.stateTone} />
                </div>

                <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                  {manifest.meta.map((m: any) => (
                    <div
                      key={m.k}
                      style={{
                        borderRadius: "1rem",
                        padding: "0.75rem",
                        background: "rgba(46,52,64,0.35)",
                        border: "1px solid rgba(236,239,244,0.06)",
                      }}
                    >
                      <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>{m.k}</div>
                      <div style={{ marginTop: "0.4rem", fontSize: "1.1rem", fontWeight: 600, color: NORD.text }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  borderRadius: "1rem",
                  padding: "0.75rem",
                  background: NORD.panel2,
                  border: "1px solid rgba(216,222,233,0.10)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 600, color: NORD.text }}>Line items</div>
                  <div style={{ fontSize: "0.9rem", color: NORD.subtle }}>{manifest.lines.length} lines</div>
                </div>

                <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem" }}>
                  {manifest.lines.map((l: any) => (
                    <div
                      key={l.sku}
                      style={{
                        borderRadius: "1rem",
                        padding: "0.75rem",
                        background: "rgba(46,52,64,0.35)",
                        border: "1px solid rgba(236,239,244,0.06)",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                        <div>
                          <div style={{ fontSize: "1.05rem", fontWeight: 600, color: NORD.text }}>{l.name}</div>
                          <div style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: NORD.subtle }}>{l.sku}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.75rem", color: NORD.subtle }}>Expected</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 600, color: NORD.text }}>{l.expected}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.75rem", color: NORD.subtle }}>Counted</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 600, color: NORD.text }}>{l.counted}</div>
                          </div>
                          <StatusPill label={l.stateLabel} tone={l.stateTone} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ position: "fixed", inset: 0, zIndex: -1 }} onClick={onClose} />
    </div>
  );
}

function statusTone(status: Shipment["status"]) {
  switch (status) {
    case "complete":
      return "verified";
    case "discrepancy":
      return "issue";
    case "waiting":
      return "waiting";
    default:
      return "progress";
  }
}

export default function ReceiveScreen() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [manifestOpen, setManifestOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  async function refreshShipments() {
    const res = await fetch(apiUrl("/shipments"));
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as Shipment[];
    setShipments(data);
    if ((!selectedId || !data.find((s) => s.id === selectedId)) && data.length > 0) {
      setSelectedId(data[0].id);
    }
  }

  useEffect(() => {
    refreshShipments().catch(console.error);
  }, []);

  const filteredShipments = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter((s) =>
      `${s.code} ${s.vendor}`.toLowerCase().includes(q)
    );
  }, [shipments, searchValue]);

  const selectedShipment = useMemo(
    () => shipments.find((s) => s.id === selectedId) ?? shipments[0],
    [shipments, selectedId],
  );

  const totals = useMemo(() => {
    if (!selectedShipment) return { expected: 0, counted: 0, progress: 0 };
    const expected = selectedShipment.expected ?? 0;
    const counted = selectedShipment.counted ?? 0;
    const progress = expected > 0 ? Math.min(1, counted / expected) : 0;
    return { expected, counted, progress };
  }, [selectedShipment]);

  const manifest = useMemo(() => {
    if (!selectedShipment) return null;
    return {
      shipmentId: selectedShipment.code,
      vendor: selectedShipment.vendor,
      title: `MFT-${selectedShipment.code}`,
      subtitle: `${selectedShipment.vendor} • ${selectedShipment.code}`,
      stateLabel: selectedShipment.status === "discrepancy" ? "Discrepancy" : selectedShipment.status === "complete" ? "Done" : selectedShipment.status === "waiting" ? "Waiting" : "In progress",
      stateTone: statusTone(selectedShipment.status),
      meta: [
        { k: "Shipment", v: selectedShipment.code },
        { k: "Supplier", v: selectedShipment.vendor },
        { k: "Expected", v: String(selectedShipment.expected) },
        { k: "Counted", v: String(selectedShipment.counted) },
        { k: "Status", v: selectedShipment.status },
        { k: "Lines", v: String(selectedShipment.items.length) },
      ],
      lines: selectedShipment.items.map((item) => {
        const done = item.counted === item.expected;
        const stateLabel = done ? "Done" : item.counted === 0 ? "Waiting" : "In progress";
        const stateTone = done ? "verified" : item.counted === 0 ? "waiting" : "progress";
        return {
          sku: item.sku,
          name: item.name,
          expected: item.expected,
          counted: item.counted,
          stateLabel,
          stateTone,
        };
      }),
    };
  }, [selectedShipment]);

  return (
    <div className="h-full flex flex-col gap-4">
      <ScreenHeader
        title="Receive"
        right={(
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search"
            className="w-full sm:w-64 rounded-2xl px-4 py-2 text-sm outline-none"
            style={{
              background: NORD.panel2,
              color: NORD.text,
              border: "1px solid rgba(216,222,233,0.12)",
            }}
          />
        )}
      />

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="col-span-12 xl:col-span-3 h-full">
          <div
            className="rounded-2xl p-3 h-full flex flex-col"
            style={{
              background: NORD.panel,
              border: `1px solid rgba(236,239,244,0.06)`
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold" style={{ color: NORD.text }}>Inbound</div>
                <div className="mt-0.5 text-sm" style={{ color: NORD.subtle }}>Tap a shipment to select</div>
              </div>
              <div className="text-sm" style={{ color: NORD.subtle }}>{shipments.length} total</div>
            </div>

            <div className="mt-3 space-y-2 flex-1 min-h-0 overflow-auto pr-1">
              {filteredShipments.map((s) => {
                const active = s.id === selectedId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`relative w-full rounded-xl px-3 py-3 text-left transition ${active ? "" : "hover:opacity-95"}`}
                    style={{
                      background: active ? "rgba(136,192,208,0.18)" : NORD.panel2,
                      border: `1px solid ${active ? "rgba(136,192,208,0.32)" : "rgba(216,222,233,0.10)"}`,
                    }}
                  >
                    {active ? (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r" style={{ background: NORD.blue }} />
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold" style={{ color: NORD.text }}>{s.code}</div>
                        <div className="text-sm truncate" style={{ color: NORD.subtle }}>{s.vendor}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusPill
                          label={s.status === "discrepancy" ? "Discrepancy" : s.status === "complete" ? "Done" : s.status === "waiting" ? "Waiting" : "In progress"}
                          tone={statusTone(s.status)}
                        />
                        <span className="text-sm" style={{ color: NORD.subtle }}>{s.counted}/{s.expected}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-9 flex flex-col h-full min-h-0">
          <Card className="flex-1 flex flex-col min-h-0" hideHeader>
            {!selectedShipment ? (
              <div className="h-full grid place-items-center">
                <div className="text-lg" style={{ color: NORD.muted }}>Select a shipment from the inbound list.</div>
              </div>
            ) : (
              <div className="h-full flex flex-col gap-4 min-h-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-2xl font-semibold" style={{ color: NORD.text }}>
                      {selectedShipment.code}
                    </div>
                    <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>{selectedShipment.vendor}</div>
                  </div>
                  <StatusPill
                    label={selectedShipment.status === "discrepancy" ? "Discrepancy" : selectedShipment.status === "complete" ? "Done" : selectedShipment.status === "waiting" ? "Waiting" : "In progress"}
                    tone={statusTone(selectedShipment.status)}
                  />
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 xl:col-span-5">
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: "rgba(46,52,64,0.45)",
                        border: `1px solid rgba(236,239,244,0.08)`
                      }}
                    >
                      <div className="text-sm" style={{ color: NORD.subtle }}>Counted</div>
                      <div className="mt-2 text-4xl font-semibold" style={{ color: NORD.text }}>{totals.counted}</div>
                      <div className="mt-4">
                        <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.25)" }}>
                          <div style={{ width: `${Math.round(totals.progress * 100)}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #5E81AC, #81A1C1)" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 xl:col-span-7">
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: "rgba(46,52,64,0.45)",
                        border: `1px solid rgba(236,239,244,0.08)`
                      }}
                    >
                      <div className="text-sm" style={{ color: NORD.subtle }}>Expected</div>
                      <div className="mt-2 text-4xl font-semibold" style={{ color: NORD.muted }}>{totals.expected}</div>
                      <div className="mt-4 text-sm" style={{ color: NORD.subtle }}>
                        {selectedShipment.items.length} manifest lines
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 min-h-0">
                  <div className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
                    <div className="text-base font-semibold" style={{ color: NORD.text }}>Manifest</div>
                    <div className="mt-3 space-y-2 flex-1 min-h-0 overflow-auto pr-1">
                      {selectedShipment.items.length ? (
                        selectedShipment.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl p-4"
                            style={{
                              background: "rgba(46,52,64,0.35)",
                              border: `1px solid rgba(236,239,244,0.06)`
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-base font-semibold" style={{ color: NORD.text }}>{item.name}</div>
                                <div className="text-sm truncate" style={{ color: NORD.subtle }}>{item.sku}</div>
                              </div>
                              <StatusPill
                                label={item.counted === item.expected ? "Done" : item.counted === 0 ? "Waiting" : "In progress"}
                                tone={item.counted === item.expected ? "verified" : item.counted === 0 ? "waiting" : "progress"}
                              />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-sm" style={{ color: NORD.subtle }}>Expected</div>
                                <div className="text-lg font-semibold" style={{ color: NORD.text }}>{item.expected}</div>
                              </div>
                              <div>
                                <div className="text-sm" style={{ color: NORD.subtle }}>Counted</div>
                                <div className="text-lg font-semibold" style={{ color: item.counted === item.expected ? NORD.green : NORD.yellow }}>{item.counted}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-lg" style={{ color: NORD.muted }}>No manifest lines yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-12 xl:col-span-5 flex flex-col gap-3">
                    <div className="text-base font-semibold" style={{ color: NORD.text }}>Actions</div>
                    <Button variant="danger">Flag discrepancy</Button>
                    <Button onClick={() => setManifestOpen(true)}>View manifest</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ManifestModal open={manifestOpen} onClose={() => setManifestOpen(false)} manifest={manifest} />
    </div>
  );
}
