import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiUrl } from "../lib/apiBase";

interface StowLocation {
  id: string;
  shelf: string;
  depth: string;
  level: string;
  status: "occupied" | "empty" | "reserved";
}

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

function Button({
  children,
  variant = "primary",
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
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
      className={
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition hover-lift " +
        (disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-95")
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
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm animate-fade-up"
      style={{
        background: NORD.panel,
        border: `1px solid rgba(76,86,106,0.35)`
      }}
    >
      {title ? <div className="text-base font-semibold" style={{ color: NORD.text }}>{title}</div> : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

export default function StowScreen() {
  const [stowType, setStowType] = useState<"top-level-ctb" | "irregular-item">("top-level-ctb");

  const [selectedLocation, setSelectedLocation] = useState<StowLocation | null>(null);
  const [locations, setLocations] = useState<StowLocation[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<string | "ALL">("S1");
  const [selectedDepth, setSelectedDepth] = useState("D1");
  const [unitInput, setUnitInput] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  const depthOptions = ["D1", "D2", "D3", "D4"];
  const shelves = ["S1", "S2", "S3"];

  async function refreshLocations() {
    const res = await fetch(apiUrl("/stow/locations"));
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as StowLocation[];
    setLocations(data);
  }

  useEffect(() => {
    refreshLocations().catch(console.error);
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (selectedShelf !== "ALL" && loc.shelf !== selectedShelf) return false;
      if (selectedDepth && loc.depth !== selectedDepth) return false;
      return true;
    });
  }, [locations, selectedShelf, selectedDepth]);

  function handleUnitScan() {
    const value = unitInput.trim();
    if (!value) return;
    setSelectedUnit(value);
    setUnitInput("");
  }

  function handleLocationScan() {
    const value = locationInput.trim().toUpperCase();
    if (!value) return;
    const match = locations.find((loc) => loc.id.toUpperCase() === value);
    if (match) {
      setSelectedLocation(match);
      setSelectedShelf(match.shelf);
      setSelectedDepth(match.depth);
      setLocationInput("");
      setLocationError(null);
      return;
    }
    setLocationError(`Location not found: ${value}`);
  }

  function getLocationTone(status: string) {
    switch (status) {
      case "occupied":
        return { bg: "rgba(163,190,140,0.08)", border: "rgba(163,190,140,0.40)", text: NORD.green };
      case "reserved":
        return { bg: "rgba(235,203,139,0.10)", border: "rgba(235,203,139,0.40)", text: NORD.yellow };
      case "empty":
        return { bg: "rgba(76,86,106,0.25)", border: "rgba(216,222,233,0.10)", text: NORD.subtle };
      default:
        return { bg: "rgba(76,86,106,0.25)", border: "rgba(216,222,233,0.10)", text: NORD.subtle };
    }
  }

  function getLocationLabel(status: string) {
    switch (status) {
      case "occupied":
        return "Occupied";
      case "reserved":
        return "Reserved";
      case "empty":
        return "Empty";
      default:
        return status;
    }
  }

  function handleStow() {
    if (selectedLocation) {
      fetch(apiUrl(`/stow/locations/${encodeURIComponent(selectedLocation.id)}/occupy`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "occupied" }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("STOW_FAILED");
          return r.json();
        })
        .then(() => refreshLocations())
        .catch(console.error)
        .finally(() => setSelectedLocation(null));
    }
  }

  const shelvesToRender = selectedShelf === "ALL" ? shelves : [selectedShelf];
  const locationsByShelf = shelvesToRender.map((shelf) => ({
    shelf,
    items: filteredLocations.filter((loc) => loc.shelf === shelf),
  }));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ fontSize: "1.15rem", fontWeight: 600, color: NORD.text }}>Stow</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 320px) 1fr", gap: "0.75rem" }}>
        <div>
          <Card title="Stow">
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.85rem", color: NORD.subtle, marginBottom: "0.5rem" }}>Type</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <Button
                    variant={stowType === "top-level-ctb" ? "primary" : "ghost"}
                    onClick={() => setStowType("top-level-ctb")}
                  >
                    Top-level CTB
                  </Button>
                  <Button
                    variant={stowType === "irregular-item" ? "primary" : "ghost"}
                    onClick={() => setStowType("irregular-item")}
                  >
                    Irregular item
                  </Button>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUnitScan();
                    }}
                    placeholder="Scan unit ID"
                    className="w-full rounded-2xl px-4 py-2 text-sm outline-none"
                    style={{
                      background: NORD.panel2,
                      color: NORD.text,
                      border: "1px solid rgba(216,222,233,0.12)",
                    }}
                  />
                  <Button onClick={handleUnitScan}>Scan</Button>
                </div>
                <div
                  style={{
                    marginTop: "0.5rem",
                    borderRadius: "0.9rem",
                    padding: "0.75rem",
                    background: NORD.panel2,
                    border: "1px solid rgba(216,222,233,0.10)",
                    color: selectedUnit ? NORD.text : NORD.subtle,
                  }}
                >
                  {selectedUnit ? selectedUnit : "Nothing selected"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: NORD.subtle, marginBottom: "0.5rem" }}>Standard CTB</div>
                <div
                  style={{
                    borderRadius: "0.9rem",
                    padding: "0.75rem",
                    background: NORD.panel2,
                    border: "1px solid rgba(216,222,233,0.10)",
                    color: selectedUnit ? NORD.text : NORD.subtle,
                  }}
                >
                  {selectedUnit ? selectedUnit : "Select a unit"}
                </div>
              </div>

              <Button onClick={handleStow} disabled={!selectedLocation}>
                Mark stowed
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Location">
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLocationScan();
                  }}
                  placeholder="Scan location (e.g., S1D1L1)"
                  className="w-full rounded-2xl px-4 py-2 text-sm outline-none"
                  style={{
                    background: NORD.panel2,
                    color: NORD.text,
                    border: "1px solid rgba(216,222,233,0.12)",
                  }}
                />
                <Button onClick={handleLocationScan}>Scan</Button>
              </div>
              {locationError ? (
                <div
                  className="rounded-2xl px-4 py-2 text-sm"
                  style={{ background: "rgba(191,97,106,0.18)", border: "1px solid rgba(191,97,106,0.45)", color: NORD.text }}
                >
                  {locationError}
                </div>
              ) : null}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1rem", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: NORD.subtle, marginBottom: "0.4rem" }}>Shelf</div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Button
                      variant={selectedShelf === "ALL" ? "primary" : "secondary"}
                      onClick={() => setSelectedShelf("ALL")}
                    >
                      All
                    </Button>
                    {shelves.map((s) => (
                      <Button
                        key={s}
                        variant={selectedShelf === s ? "primary" : "secondary"}
                        onClick={() => setSelectedShelf(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: NORD.subtle, marginBottom: "0.4rem" }}>Depth</div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {depthOptions.map((d) => (
                      <Button
                        key={d}
                        variant={selectedDepth === d ? "primary" : "secondary"}
                        onClick={() => setSelectedDepth(d)}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {locationsByShelf.map((shelfGroup) => (
                <div key={shelfGroup.shelf} style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: NORD.subtle }}>
                    {shelfGroup.shelf} • {selectedDepth}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "0.75rem" }}>
                    {shelfGroup.items.map((loc) => {
                      const tone = getLocationTone(loc.status);
                      const isSel = selectedLocation?.id === loc.id;
                      return (
                        <button
                          key={loc.id}
                          onClick={() => setSelectedLocation(loc)}
                          style={{
                            borderRadius: "0.9rem",
                            padding: "1rem",
                            background: isSel ? "rgba(136,192,208,0.18)" : tone.bg,
                            border: isSel ? "1px solid rgba(136,192,208,0.45)" : `1px solid ${tone.border}`,
                            color: NORD.text,
                            textAlign: "center",
                            minHeight: "90px",
                            display: "grid",
                            gap: "0.25rem",
                            alignContent: "center",
                          }}
                        >
                          <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{loc.level}</div>
                          <div style={{ fontSize: "0.75rem", color: tone.text }}>{getLocationLabel(loc.status)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
