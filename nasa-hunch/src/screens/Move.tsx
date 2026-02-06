import { useState } from "react";

interface MoveOperation {
  fromLocation: string | null;
  fromItems: string[];
  toLocation: string | null;
  toItems: string[];
  reason: string;
  sourceContainer: string | null;
  destContainer: string | null;
}

export default function Move() {
  const [operation, setOperation] = useState<MoveOperation>({
    fromLocation: null,
    fromItems: [],
    toLocation: null,
    toItems: [],
    reason: "Space constraint",
    sourceContainer: null,
    destContainer: null,
  });

  const [scanMode, setScanMode] = useState<"from" | "to" | null>(null);
  const [scanInput, setScanInput] = useState("");

  // const availableLocations = [
  //   { code: "S1-L12/CTB-0001/CTB-0002", label: "S1-L12/CTB-0001/CTB-0002" },
  //   { code: "S2-L02/CTB-0001/CTB-0002", label: "S2-L02/CTB-0001/CTB-0002" },
  // ];

  const reasons = [
    "Space constraint",
    "Inventory management",
    "Consolidation",
    "Quality control",
    "Rotation",
    "Other",
  ];

  const handleScan = (mode: "from" | "to", value: string) => {
    if (mode === "from") {
      setOperation((prev) => ({
        ...prev,
        fromLocation: value,
        fromItems: [...prev.fromItems, value],
      }));
    } else {
      setOperation((prev) => ({
        ...prev,
        toLocation: value,
        toItems: [...prev.toItems, value],
      }));
    }
    setScanInput("");
    setScanMode(null);
  };

  const handleClear = (mode: "from" | "to") => {
    if (mode === "from") {
      setOperation((prev) => ({
        ...prev,
        fromLocation: null,
        fromItems: [],
        sourceContainer: null,
      }));
    } else {
      setOperation((prev) => ({
        ...prev,
        toLocation: null,
        toItems: [],
        destContainer: null,
      }));
    }
    setScanInput("");
    setScanMode(null);
  };

  return (
    <div style={{ display: "grid", gap: "3rem", color: "#fff", padding: "2.5rem" }}>
      <style>{`
        @media (max-width: 1024px) {
          .move-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          div { padding: 1.5rem !important; }
        }
        @media (max-width: 480px) {
          div { padding: 1rem !important; }
          h2 { font-size: 1.1rem !important; }
          h3 { font-size: 0.85rem !important; }
        }
      `}</style>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, letterSpacing: "0.5px" }}>Move</h2>
      </div>

      {/* Main content */}
      <div className="move-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3.5rem" }}>
        {/* Left - From/To selection */}
        <div style={{ display: "grid", gap: "2.5rem" }}>
          {/* From section */}
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "2rem" }}>
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1rem", fontWeight: 600, color: "#aaa", letterSpacing: "0.3px" }}>From</h3>

            {/* From location display */}
            <div
              style={{
                padding: "1.5rem",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "rgba(255,255,255,0.02)",
                marginBottom: "1.5rem",
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div>
                {operation.fromLocation ? (
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                      {operation.fromLocation}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "4px" }}>
                      {operation.fromItems.length} item{operation.fromItems.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#666" }}>None selected</div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <button
                onClick={() => setScanMode(scanMode === "from" ? null : "from")}
                style={{
                  padding: "14px",
                  borderRadius: "6px",
                  border: scanMode === "from" ? "2px solid #3b82f6" : "1px solid #444",
                  background: scanMode === "from" ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  color: scanMode === "from" ? "#3b82f6" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                Scan
              </button>
              <button
                onClick={() => handleClear("from")}
                disabled={!operation.fromLocation}
                style={{
                  padding: "14px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  background: "transparent",
                  color: "#fff",
                  cursor: operation.fromLocation ? "pointer" : "not-allowed",
                  opacity: operation.fromLocation ? 1 : 0.5,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* To section */}
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "2rem" }}>
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1rem", fontWeight: 600, color: "#aaa", letterSpacing: "0.3px" }}>To</h3>

            {/* To location display */}
            <div
              style={{
                padding: "1.5rem",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "rgba(255,255,255,0.02)",
                marginBottom: "1.5rem",
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div>
                {operation.toLocation ? (
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                      {operation.toLocation}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "4px" }}>
                      {operation.toItems.length} item{operation.toItems.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#666" }}>None selected</div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <button
                onClick={() => setScanMode(scanMode === "to" ? null : "to")}
                style={{
                  padding: "14px",
                  borderRadius: "6px",
                  border: scanMode === "to" ? "2px solid #3b82f6" : "1px solid #444",
                  background: scanMode === "to" ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  color: scanMode === "to" ? "#3b82f6" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                Scan
              </button>
              <button
                onClick={() => handleClear("to")}
                disabled={!operation.toLocation}
                style={{
                  padding: "14px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  background: "transparent",
                  color: "#fff",
                  cursor: operation.toLocation ? "pointer" : "not-allowed",
                  opacity: operation.toLocation ? 1 : 0.5,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Scan input */}
          {scanMode && (
            <div style={{ border: "1px solid #3b82f6", borderRadius: "8px", padding: "1.5rem" }}>
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && scanInput.trim() && scanMode) {
                    handleScan(scanMode, scanInput);
                  }
                }}
                placeholder={`Scan ${scanMode === "from" ? "source" : "destination"} location`}
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px 14px",
                  borderRadius: "6px",
                  border: "1px solid #3b82f6",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>

        {/* Right - Move details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Move section */}
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "2rem" }}>
            <h3 style={{ margin: "0 0 2rem 0", fontSize: "1rem", fontWeight: 600, color: "#aaa", letterSpacing: "0.3px" }}>Move</h3>

            {/* Reason dropdown */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.85rem" }}>
                Reason
              </label>
              <select
                value={operation.reason}
                onChange={(e) => setOperation((prev) => ({ ...prev, reason: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: "0.9rem",
                }}
              >
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Source & Destination containers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "1.5rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#aaa", marginBottom: "0.85rem" }}>
                  Source container
                </div>
                <div style={{ fontSize: "0.9rem", color: "#999" }}>
                  {operation.sourceContainer ? operation.sourceContainer : "No context available."}
                </div>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "1.5rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#aaa", marginBottom: "0.85rem" }}>
                  Destination container
                </div>
                <div style={{ fontSize: "0.9rem", color: "#999" }}>
                  {operation.destContainer ? operation.destContainer : "No context available."}
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            disabled={!operation.fromLocation || !operation.toLocation}
            style={{
              padding: "16px",
              borderRadius: "6px",
              border: "none",
              background:
                operation.fromLocation && operation.toLocation
                  ? "#3b82f6"
                  : "#444",
              color: "#fff",
              cursor:
                operation.fromLocation && operation.toLocation
                  ? "pointer"
                  : "not-allowed",
              fontSize: "1rem",
              fontWeight: 600,
              marginTop: "auto",
            }}
          >
            Execute move
          </button>

          {/* Open Draft button */}
          <button
            style={{
              padding: "16px",
              borderRadius: "6px",
              border: "1px solid #444",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            Open Draft
          </button>
        </div>
      </div>
    </div>
  );
}
