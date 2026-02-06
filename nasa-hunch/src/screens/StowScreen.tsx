import { useState } from "react";

interface StowLocation {
  id: string;
  shelf: string;
  depth: string;
  level: string;
  status: "occupied" | "empty" | "reserved";
}

export default function StowScreen() {
  const [stowType, setStowType] = useState<"top-level-ctb" | "irregular-item">("top-level-ctb");

  const [selectedLocation, setSelectedLocation] = useState<StowLocation | null>(null);
  const [locations, setLocations] = useState<StowLocation[]>([
    { id: "S1-D1-L1", shelf: "S1", depth: "D1", level: "L1", status: "occupied" },
    { id: "S1-D1-L2", shelf: "S1", depth: "D1", level: "L2", status: "occupied" },
    { id: "S1-D1-L3", shelf: "S1", depth: "D1", level: "L3", status: "occupied" },
    { id: "S1-D1-L4", shelf: "S1", depth: "D1", level: "L4", status: "reserved" },
    { id: "S1-D2-L1", shelf: "S1", depth: "D2", level: "L1", status: "empty" },
    { id: "S1-D2-L2", shelf: "S1", depth: "D2", level: "L2", status: "empty" },
    { id: "S1-D2-L3", shelf: "S1", depth: "D2", level: "L3", status: "empty" },
    { id: "S1-D2-L4", shelf: "S1", depth: "D2", level: "L4", status: "empty" },
    { id: "S1-D3-L1", shelf: "S1", depth: "D3", level: "L1", status: "occupied" },
    { id: "S1-D3-L2", shelf: "S1", depth: "D3", level: "L2", status: "empty" },
    { id: "S1-D3-L3", shelf: "S1", depth: "D3", level: "L3", status: "reserved" },
    { id: "S1-D3-L4", shelf: "S1", depth: "D3", level: "L4", status: "empty" },
    { id: "S1-D4-L1", shelf: "S1", depth: "D4", level: "L1", status: "empty" },
    { id: "S1-D4-L2", shelf: "S1", depth: "D4", level: "L2", status: "occupied" },
    { id: "S1-D4-L3", shelf: "S1", depth: "D4", level: "L3", status: "empty" },
    { id: "S1-D4-L4", shelf: "S1", depth: "D4", level: "L4", status: "empty" },
  ]);

  const depthOptions = ["D1", "D2", "D3", "D4"];
  // const levelOptions = ["L1", "L2", "L3", "L4"];
  const shelves = ["S1", "S2", "S3"];

  function getLocationColor(status: string) {
    switch (status) {
      case "occupied":
        return "#3b82f6";
      case "reserved":
        return "#f59e0b";
      case "empty":
        return "transparent";
      default:
        return "#6b7280";
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
      setSelectedLocation(null);
      // Mark location as occupied
      setLocations(
        locations.map((loc) =>
          loc.id === selectedLocation.id ? { ...loc, status: "occupied" as const } : loc
        )
      );
    }
  }

  // Group locations by shelf
  const locationsByShelf = shelves.map((shelf) => ({
    shelf,
    items: locations.filter((loc) => loc.shelf === shelf),
  }));

  return (
    <section className="stow-section" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem", color: "#fff", padding: "1.5rem" }}>
      <style>{`
        @media (max-width: 1024px) {
          section { grid-template-columns: 1fr !important; gap: 1rem !important; }
        }
        @media (max-width: 768px) {
          section { padding: 1rem !important; }
        }
        @media (max-width: 480px) {
          section { padding: 0.75rem !important; gap: 0.75rem !important; }
          h2 { font-size: 1rem !important; }
        }
      `}</style>
      {/* Left sidebar - Stow controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", fontWeight: 600 }}>Stow</h2>

        {/* Type selection */}
        <div>
          <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
            Type
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setStowType("top-level-ctb")}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: stowType === "top-level-ctb" ? "#3b82f6" : "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Top-level CTB
            </button>
            <button
              onClick={() => setStowType("irregular-item")}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: stowType === "irregular-item" ? "#3b82f6" : "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Irregular item
            </button>
          </div>
        </div>

        {/* Scan */}
        <div>
          <button
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Scan
          </button>
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "#ccc",
              minHeight: "40px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Nothing selected
          </div>
        </div>

        {/* Unit info */}
        <div style={{ marginTop: "2rem" }}>
          <div style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "0.75rem", fontWeight: 600 }}>
            Standard CTB
          </div>
          <div
            style={{
              padding: "0.75rem",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            Select a unit
          </div>
        </div>

        {/* Mark stowed button */}
        <button
          onClick={handleStow}
          disabled={!selectedLocation}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: selectedLocation ? "#22c55e" : "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: selectedLocation ? "pointer" : "not-allowed",
            opacity: selectedLocation ? 1 : 0.5,
            marginTop: "1rem",
          }}
        >
          Mark stowed
        </button>
      </div>

      {/* Right side - Location grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>Location</h2>

        {/* Dimension selectors */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "1rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              Shelf
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {shelves.map((s) => (
                <button
                  key={s}
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              Depth
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {depthOptions.map((d) => (
                <button
                  key={d}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              Depth
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {depthOptions.map((d) => (
                <button
                  key={`d2-${d}`}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              Depth
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {depthOptions.map((d) => (
                <button
                  key={`d3-${d}`}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location grid */}
        <div>
          {locationsByShelf.map((shelfGroup) => (
            <div key={shelfGroup.shelf} style={{ marginBottom: "2rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", color: "#aaa" }}>
                {shelfGroup.shelf} • D1
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "1rem",
                }}
              >
                {shelfGroup.items.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    style={{
                      padding: "1.25rem",
                      background: getLocationColor(loc.status) === "transparent" ? "#2a2a2a" : "rgba(0,0,0,0.3)",
                      border:
                        selectedLocation?.id === loc.id
                          ? "2px solid #22c55e"
                          : getLocationColor(loc.status) !== "transparent"
                          ? `2px solid ${getLocationColor(loc.status)}`
                          : "2px solid #444",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                      minHeight: "100px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      {loc.level}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa" }}>
                      {getLocationLabel(loc.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
