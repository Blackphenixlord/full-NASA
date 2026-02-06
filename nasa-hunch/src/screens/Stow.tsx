import { useState } from "react";

interface ShelfLocation {
  shelf: string;
  depth: string;
  slots: {
    id: string;
    status: "occupied" | "reserved" | "empty";
  }[];
}

export default function Stow() {
  const [itemMode, setItemMode] = useState<"standard" | "irregular">("standard");
  const [selectedShelf, setSelectedShelf] = useState("S1");
  const [selectedDepth, setSelectedDepth] = useState("D1");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const shelves = ["S1", "S2", "S3"];
  const depths = ["D1", "D2", "D3", "D4"];

  const slots: ShelfLocation = {
    shelf: selectedShelf,
    depth: selectedDepth,
    slots: [
      { id: "L1", status: "occupied" },
      { id: "L2", status: "occupied" },
      { id: "L3", status: "reserved" },
      { id: "L4", status: "reserved" },
      { id: "L5", status: "empty" },
      { id: "L6", status: "empty" },
      { id: "L7", status: "empty" },
      { id: "L8", status: "empty" },
      { id: "L9", status: "empty" },
      { id: "L10", status: "reserved" },
      { id: "L11", status: "empty" },
      { id: "L12", status: "empty" },
      { id: "L13", status: "empty" },
      { id: "L14", status: "empty" },
      { id: "L15", status: "empty" },
      { id: "L16", status: "empty" },
    ],
  };

  const getSlotColor = (status: string) => {
    switch (status) {
      case "occupied":
        return { bg: "#1a4d2e", text: "#4ade80", border: "#22c55e" };
      case "reserved":
        return { bg: "#4c1f1f", text: "#fca5a5", border: "#fca5a5" };
      case "empty":
        return { bg: "#333", text: "#999", border: "#444" };
      default:
        return { bg: "#333", text: "#999", border: "#444" };
    }
  };

  return (
    <div style={{ display: "grid", gap: "2rem", color: "#fff" }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 600 }}>Stow</h2>
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => setItemMode("standard")}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            border: itemMode === "standard" ? "2px solid #3b82f6" : "1px solid #444",
            background: itemMode === "standard" ? "rgba(59, 130, 246, 0.1)" : "transparent",
            color: itemMode === "standard" ? "#3b82f6" : "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Top-level CTB
        </button>
        <button
          onClick={() => setItemMode("irregular")}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            border: itemMode === "irregular" ? "2px solid #3b82f6" : "1px solid #444",
            background: itemMode === "irregular" ? "rgba(59, 130, 246, 0.1)" : "transparent",
            color: itemMode === "irregular" ? "#3b82f6" : "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Irregular item
        </button>
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Left - Stow section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa", textTransform: "uppercase" }}>
              Stow
            </h3>

            {/* Standard CTB / Irregular toggle */}
            <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#aaa", marginBottom: "1rem" }}>Standard CTB</div>

              <button
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  borderRadius: "6px",
                  border: "2px dashed #3b82f6",
                  background: "rgba(59, 130, 246, 0.05)",
                  color: "#3b82f6",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                Scan
              </button>
            </div>
          </div>

          {/* Unit selection */}
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: 600, color: "#aaa" }}>
              Select a unit
            </h3>
            <button
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #3b82f6",
                background: "rgba(59, 130, 246, 0.1)",
                color: "#3b82f6",
                cursor: "pointer",
                fontSize: "0.85rem",
                width: "100%",
              }}
            >
              Mark stowed
            </button>
          </div>
        </div>

        {/* Right - Location selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa", textTransform: "uppercase" }}>
              Location
            </h3>

            {/* Shelf selector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.8rem", color: "#aaa", display: "block", marginBottom: "0.75rem" }}>
                Shelf
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                {shelves.map((shelf) => (
                  <button
                    key={shelf}
                    onClick={() => setSelectedShelf(shelf)}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: selectedShelf === shelf ? "2px solid #3b82f6" : "1px solid #444",
                      background: selectedShelf === shelf ? "rgba(59, 130, 246, 0.1)" : "transparent",
                      color: selectedShelf === shelf ? "#3b82f6" : "#fff",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {shelf}
                  </button>
                ))}
              </div>
            </div>

            {/* Depth selector */}
            <div>
              <label style={{ fontSize: "0.8rem", color: "#aaa", display: "block", marginBottom: "0.75rem" }}>
                Depth
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {depths.map((depth) => (
                  <button
                    key={depth}
                    onClick={() => setSelectedDepth(depth)}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: selectedDepth === depth ? "2px solid #3b82f6" : "1px solid #444",
                      background: selectedDepth === depth ? "rgba(59, 130, 246, 0.1)" : "transparent",
                      color: selectedDepth === depth ? "#3b82f6" : "#fff",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {depth}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Warehouse grid */}
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", fontWeight: 600, color: "#999" }}>
              {selectedShelf} - {selectedDepth}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
              {slots.slots.map((slot) => {
                const colors = getSlotColor(slot.status);
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(selectedSlot === slot.id ? null : slot.id)}
                    style={{
                      padding: "1rem",
                      borderRadius: "6px",
                      border: `2px solid ${colors.border}`,
                      background: colors.bg,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                      transform: selectedSlot === slot.id ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: colors.text }}>{slot.id}</div>
                    <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "4px", textTransform: "capitalize" }}>
                      {slot.status}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#1a4d2e" }} />
                <span style={{ fontSize: "0.8rem", color: "#999" }}>Occupied</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#4c1f1f" }} />
                <span style={{ fontSize: "0.8rem", color: "#999" }}>Reserved</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#333" }} />
                <span style={{ fontSize: "0.8rem", color: "#999" }}>Empty</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div style={{ marginTop: "1rem" }}>
        <button
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #444",
            background: "transparent",
            color: "#999",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Details
        </button>
      </div>
    </div>
  );
}
