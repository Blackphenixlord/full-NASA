import { useState } from "react";

interface Container {
  id: string;
  type: "CTB" | "irregular";
  outside: string | null;
  inside: string | null;
  outsideContents: number;
  insideContents: number;
  roomLeft: { width: number; height: number } | null;
  insideSize: { width: number; height: number } | null;
}

export default function Pack() {
  const [mode, setMode] = useState<"standard" | "irregular">("standard");
  const [containers, setContainers] = useState<Container>({
    id: "pack-001",
    type: "CTB",
    outside: null,
    inside: null,
    outsideContents: 0,
    insideContents: 0,
    roomLeft: null,
    insideSize: null,
  });

  const [scanMode, setScanMode] = useState<"outside" | "inside" | null>(null);
  const [scanInput, setScanInput] = useState("");

  const handleScan = (type: "outside" | "inside", rfidId: string) => {
    if (type === "outside") {
      setContainers((prev) => ({
        ...prev,
        outside: rfidId,
        outsideContents: prev.outsideContents + 1,
      }));
    } else {
      setContainers((prev) => ({
        ...prev,
        inside: rfidId,
        insideContents: prev.insideContents + 1,
      }));
    }
    setScanInput("");
    setScanMode(null);
  };

  const handleClear = (type: "outside" | "inside") => {
    if (type === "outside") {
      setContainers((prev) => ({ ...prev, outside: null, outsideContents: 0 }));
    } else {
      setContainers((prev) => ({ ...prev, inside: null, insideContents: 0 }));
    }
    setScanInput("");
    setScanMode(null);
  };

  return (
    <div style={{ display: "grid", gap: "2rem", color: "#fff" }}>
      {/* Mode selector */}
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => setMode("standard")}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            border: mode === "standard" ? "2px solid #3b82f6" : "1px solid #444",
            background: mode === "standard" ? "rgba(59, 130, 246, 0.1)" : "transparent",
            color: mode === "standard" ? "#3b82f6" : "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Top-level CTB
        </button>
        <button
          onClick={() => setMode("irregular")}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            border: mode === "irregular" ? "2px solid #3b82f6" : "1px solid #444",
            background: mode === "irregular" ? "rgba(59, 130, 246, 0.1)" : "transparent",
            color: mode === "irregular" ? "#3b82f6" : "#fff",
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
        {/* Left - Packing area */}
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {/* Outside scanning */}
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa" }}>Outside</h3>
            <div
              style={{
                padding: "1.5rem",
                borderRadius: "6px",
                border: "2px dashed #444",
                textAlign: "center",
                marginBottom: "1rem",
                background: "rgba(255,255,255,0.02)",
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div>
                {containers.outside ? (
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>{containers.outside}</div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "4px" }}>
                      {containers.outsideContents} item{containers.outsideContents !== 1 ? "s" : ""}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#666" }}>Nothing selected</div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={() => setScanMode(scanMode === "outside" ? null : "outside")}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: scanMode === "outside" ? "2px solid #3b82f6" : "1px solid #444",
                  background: scanMode === "outside" ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  color: scanMode === "outside" ? "#3b82f6" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Scan
              </button>
              <button
                onClick={() => handleClear("outside")}
                disabled={!containers.outside}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  background: "transparent",
                  color: "#fff",
                  cursor: containers.outside ? "pointer" : "not-allowed",
                  opacity: containers.outside ? 1 : 0.5,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Inside scanning */}
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa" }}>Inside</h3>
            <div
              style={{
                padding: "1.5rem",
                borderRadius: "6px",
                border: "2px dashed #444",
                textAlign: "center",
                marginBottom: "1rem",
                background: "rgba(255,255,255,0.02)",
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div>
                {containers.inside ? (
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>{containers.inside}</div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "4px" }}>
                      {containers.insideContents} item{containers.insideContents !== 1 ? "s" : ""}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#666" }}>Nothing selected</div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={() => setScanMode(scanMode === "inside" ? null : "inside")}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: scanMode === "inside" ? "2px solid #3b82f6" : "1px solid #444",
                  background: scanMode === "inside" ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  color: scanMode === "inside" ? "#3b82f6" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Scan
              </button>
              <button
                onClick={() => handleClear("inside")}
                disabled={!containers.inside}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  background: "transparent",
                  color: "#fff",
                  cursor: containers.inside ? "pointer" : "not-allowed",
                  opacity: containers.inside ? 1 : 0.5,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Scan input (if active) */}
          {scanMode && (
            <div style={{ border: "1px solid #3b82f6", borderRadius: "8px", padding: "1rem" }}>
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && scanInput.trim() && scanMode) {
                    handleScan(scanMode, scanInput);
                  }
                }}
                placeholder={`Scan ${scanMode} RFID/ID`}
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
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

        {/* Right - Verify & metrics */}
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {/* Verify section */}
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa" }}>Verify</h3>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {/* Outside contents */}
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#aaa" }}>Outside contents</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "#fff" }}>
                    {containers.outsideContents}
                  </div>
                </div>
              </div>

              {/* Inside contents */}
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#aaa" }}>Inside contents</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "#fff" }}>
                    {containers.insideContents}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Room left */}
            <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#aaa", marginBottom: "0.75rem" }}>
                Room left
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: "4px" }}>W</div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>—</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: "4px" }}>H</div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>—</div>
                </div>
              </div>
            </div>

            {/* Inside size */}
            <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#aaa", marginBottom: "0.75rem" }}>
                Inside size
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: "4px" }}>W</div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>—</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: "4px" }}>H</div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>—</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "auto" }}>
            <button
              style={{
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Pack
            </button>
            <button
              style={{
                padding: "12px",
                borderRadius: "6px",
                border: "none",
                background: "#ef4444",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      {/* Note */}
      <div style={{ fontSize: "0.8rem", color: "#666" }}>
        Select outside + inside
      </div>
    </div>
  );
}
