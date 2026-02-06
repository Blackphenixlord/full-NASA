import { useState } from "react";

interface ShipmentItem {
  id: string;
  sku: string;
  name: string;
  expected: number;
  counted: number;
  status: "ok" | "discrepancy" | "in-progress";
}

interface Shipment {
  id: string;
  code: string;
  supplier: string;
  expectedQty: number;
  countedQty: number;
  status: "waiting" | "in-progress" | "discrepancy" | "complete";
  items: ShipmentItem[];
}

export default function Receive() {
  const [shipments] = useState<Shipment[]>([
    {
      id: "ship-001",
      code: "SHIP-8841",
      supplier: "Meals Vendor",
      expectedQty: 48,
      countedQty: 36,
      status: "in-progress",
      items: [
        { id: "1", sku: "MEAL-PASTA-PRIM", name: "Pasta Primavera", expected: 18, counted: 12, status: "in-progress" },
        { id: "2", sku: "MEAL-CURRY-VEG", name: "Veggie Curry", expected: 18, counted: 18, status: "ok" },
        { id: "3", sku: "MEAL-OAT-BFST", name: "Oatmeal Breakfast", expected: 12, counted: 6, status: "discrepancy" },
      ],
    },
    {
      id: "ship-002",
      code: "SHIP-8910",
      supplier: "Med Supply",
      expectedQty: 40,
      countedQty: 38,
      status: "discrepancy",
      items: [],
    },
    {
      id: "ship-003",
      code: "SHIP-8932",
      supplier: "Lab Equipment",
      expectedQty: 31,
      countedQty: 31,
      status: "in-progress",
      items: [],
    },
  ]);

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(shipments[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
      case "complete":
        return "#22c55e";
      case "in-progress":
        return "#3b82f6";
      case "discrepancy":
        return "#ef4444";
      case "waiting":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in-progress":
        return "● In progress";
      case "discrepancy":
        return "● Discrepancy";
      case "waiting":
        return "● Waiting";
      case "complete":
        return "✓ Complete";
      default:
        return status;
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem", height: "100%" }}>
      {/* Sidebar - Inbound Shipments */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#aaa", textTransform: "uppercase" }}>
          Inbound
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            maxHeight: "calc(100vh - 300px)",
            overflowY: "auto",
          }}
        >
          {shipments.map((ship) => (
            <div
              key={ship.id}
              onClick={() => setSelectedShipment(ship)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: selectedShipment?.id === ship.id ? "1px solid #3b82f6" : "1px solid #444",
                background: selectedShipment?.id === ship.id ? "rgba(59, 130, 246, 0.1)" : "#222",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>{ship.code}</div>
              <div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>{ship.supplier}</div>
              <div style={{ fontSize: "0.8rem", color: "#999", marginTop: "4px" }}>
                {ship.countedQty}/{ship.expectedQty}
              </div>
              <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: getStatusColor(ship.status),
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: getStatusColor(ship.status) }}>
                  {getStatusLabel(ship.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          style={{
            marginTop: "auto",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #444",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Inspect shipment
        </button>
      </div>

      {/* Main Content - Shipment Details */}
      {selectedShipment && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Header */}
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>
              {selectedShipment.code} {selectedShipment.supplier}
            </h2>

            {/* Progress bar */}
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#3b82f6",
                      width: `${(selectedShipment.countedQty / selectedShipment.expectedQty) * 100}%`,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "2rem" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#aaa" }}>Counted</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff" }}>
                      {selectedShipment.countedQty}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#aaa" }}>Expected</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff" }}>
                      {selectedShipment.expectedQty}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manifest */}
          {selectedShipment.items.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa" }}>
                Manifest (3 lines)
              </h3>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", overflow: "hidden" }}>
                {selectedShipment.items.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "12px",
                      borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                      display: "grid",
                      gridTemplateColumns: "1fr 100px 100px",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>{item.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "4px" }}>{item.sku}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "#aaa" }}>Expected</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>{item.expected}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "#aaa" }}>Counted</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>{item.counted}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background:
                            item.status === "ok"
                              ? "rgba(34, 197, 94, 0.2)"
                              : item.status === "in-progress"
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(239, 68, 68, 0.2)",
                          color: getStatusColor(item.status),
                          textTransform: "capitalize",
                        }}
                      >
                        {item.status === "in-progress" ? "in progress" : item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verify Section */}
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa" }}>Verify</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Manifest items */}
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem", color: "#aaa" }}>
                  Manifest Items (3 lines)
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {selectedShipment.items.map((item) => (
                    <div key={item.id} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{item.name}</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "#fff", marginTop: "4px" }}>
                        {item.expected}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discrepancy flag */}
              {selectedShipment.status === "discrepancy" && (
                <button
                  style={{
                    padding: "1rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#ef4444",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Flag discrepancy
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <button
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              View manifest
            </button>
            <button
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#3b82f6",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Mark shipment as processed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
