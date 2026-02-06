import { useState } from "react";

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

export default function ReceiveScreen() {
  const [shipments] = useState<Shipment[]>([
    {
      id: "SHIP-8841",
      code: "SHIP-8841",
      vendor: "Meals Vendor",
      status: "in-progress",
      expected: 48,
      counted: 36,
      items: [
        { id: "1", sku: "MEAL-PASTA-PRIM", name: "Pasta Primavera", expected: 18, counted: 12, status: "in-progress" },
        { id: "2", sku: "MEAL-CURRY-VEG", name: "Veggie Curry", expected: 18, counted: 18, status: "done" },
        { id: "3", sku: "MEAL-OAT-BFST", name: "Oatmeal Breakfast", expected: 12, counted: 6, status: "in-progress" },
      ],
    },
    {
      id: "SHIP-8910",
      code: "SHIP-8910",
      vendor: "Med Supply",
      status: "discrepancy",
      expected: 40,
      counted: 38,
      items: [],
    },
    {
      id: "SHIP-8932",
      code: "SHIP-8932",
      vendor: "Lab Equipment",
      status: "in-progress",
      expected: 31,
      counted: 31,
      items: [],
    },
    {
      id: "SHIP-8999",
      code: "SHIP-8999",
      vendor: "Hygiene + Water",
      status: "waiting",
      expected: 48,
      counted: 0,
      items: [],
    },
    {
      id: "SHIP-9050",
      code: "SHIP-9050",
      vendor: "Spare Parts (Paperwork only)",
      status: "waiting",
      expected: 0,
      counted: 0,
      items: [],
    },
  ]);

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(shipments[0]);

  const statusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "#3b82f6"; // blue
      case "complete":
        return "#22c55e"; // green
      case "discrepancy":
        return "#ef4444"; // red
      case "waiting":
        return "#8b5cf6"; // purple
      default:
        return "#6b7280"; // gray
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "in-progress":
        return "In progress";
      case "complete":
        return "Complete";
      case "discrepancy":
        return "Discrepancy";
      case "waiting":
        return "Waiting";
      default:
        return status;
    }
  };

  return (
    <section className="receive-section" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "2rem", color: "#fff", padding: "1.5rem" }}>
      <style>{`
        .receive-section { display: grid; grid-template-columns: 320px 1fr; gap: 2rem; }
        .receive-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
        .receive-content { display: flex; flex-direction: column; gap: 2rem; }
        .shipment-item { padding: 1rem; border-radius: 10px; background: #1a1a1a; border: 1px solid #333; cursor: pointer; transition: all 0.2s ease; }
        .shipment-item.active { background: rgba(59, 130, 246, 0.15); border: 2px solid #3b82f6; box-shadow: 0 0 16px rgba(59, 130, 246, 0.2); }
        .counts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
        
        @media (max-width: 1200px) {
          .receive-section { gap: 1.5rem; }
          .counts-grid { gap: 2rem; }
        }
        @media (max-width: 1024px) {
          .receive-section { grid-template-columns: 1fr; }
          .counts-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .receive-section { padding: 1rem; gap: 1rem; }
          .receive-sidebar { gap: 1rem; }
          .receive-content { gap: 1.5rem; }
          .shipment-item { padding: 0.75rem; }
        }
        @media (max-width: 480px) {
          .receive-section { padding: 0.75rem; gap: 0.75rem; }
          .counts-grid { gap: 1.5rem; }
          h2 { font-size: 1.5rem !important; }
          .counts-value { font-size: 3rem !important; }
        }
      `}</style>
      {/* Left sidebar - Shipment list */}
      <div className="receive-sidebar" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#8b5cf6", letterSpacing: "0.1em" }}>
            Receive
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#aaa" }}>5 total</p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.75rem", color: "#666" }}>Tap a shipment to select</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {shipments.map((ship) => (
            <div
              key={ship.id}
              className={`shipment-item ${selectedShipment?.id === ship.id ? 'active' : ''}`}
              onClick={() => setSelectedShipment(ship)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>{ship.code}</span>
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: statusColor(ship.status),
                    boxShadow: `0 0 8px ${statusColor(ship.status)}`,
                  }}
                />
                <span style={{ fontSize: "0.7rem", color: "#888", fontWeight: 500 }}>{statusLabel(ship.status)}</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.25rem" }}>{ship.vendor}</div>
              <div style={{ fontSize: "0.85rem", color: "#bbb", fontWeight: 500 }}>
                {ship.counted}/{ship.expected}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Shipment details */}
      {selectedShipment && (
        <div className="receive-content" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Header */}
          <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid #333" }}>
            <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: "#fff" }}>
              {selectedShipment.code}
            </h2>
            <div style={{ fontSize: "1rem", color: "#999", marginTop: "0.5rem", fontWeight: 500 }}>
              {selectedShipment.vendor}
            </div>
          </div>

          {/* Status and counts */}
          <div className="counts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Counted
              </div>
              <div style={{ fontSize: "4rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {selectedShipment.counted}
              </div>
              {/* Progress bar */}
              <div
                style={{
                  marginTop: "2rem",
                  width: "100%",
                  height: "8px",
                  background: "#222",
                  borderRadius: "4px",
                  overflow: "hidden",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    width: `${(selectedShipment.counted / selectedShipment.expected) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    transition: "width 0.3s ease",
                    boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)",
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Expected
              </div>
              <div style={{ fontSize: "4rem", fontWeight: 700, color: "#666", lineHeight: 1 }}>
                {selectedShipment.expected}
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div
            style={{
              padding: "1.25rem",
              background: selectedShipment.status === "discrepancy" ? "rgba(239, 68, 68, 0.08)" : "rgba(59, 130, 246, 0.08)",
              border: `2px solid ${statusColor(selectedShipment.status)}`,
              borderRadius: "10px",
              color: statusColor(selectedShipment.status),
              fontWeight: 600,
              fontSize: "0.95rem",
              boxShadow: `inset 0 0 1px ${statusColor(selectedShipment.status)}40`,
            }}
          >
            {selectedShipment.status === "discrepancy" && "⚠️ Discrepancy detected"}
            {selectedShipment.status === "in-progress" && "🔵 In progress"}
            {selectedShipment.status === "waiting" && "⏳ Waiting to start"}
            {selectedShipment.status === "complete" && "✅ Complete"}
          </div>

          {/* Manifest */}
          {selectedShipment.items.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Manifest</h3>
                <span style={{ fontSize: "0.85rem", color: "#aaa" }}>{selectedShipment.items.length} lines</span>
              </div>

              {/* Items table */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {selectedShipment.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "1rem",
                      background: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{item.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#aaa" }}>{item.sku}</div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.25rem" }}>Expected</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>{item.expected}</div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.25rem" }}>Counted</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 600, color: item.counted === item.expected ? "#22c55e" : "#f59e0b" }}>
                        {item.counted}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verify section */}
              <div style={{ marginTop: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>Verify</h4>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      background: selectedShipment.status === "discrepancy" ? "#ef4444" : "#3b82f6",
                      borderRadius: "3px",
                      color: "#fff",
                    }}
                  >
                    {selectedShipment.status === "discrepancy" ? "Discrepancy" : "In progress"}
                  </span>
                </div>

                <button
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Flag discrepancy
                </button>

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
                    marginTop: "0.5rem",
                  }}
                >
                  View manifest
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
