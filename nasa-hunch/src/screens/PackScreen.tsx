import { useState } from "react";

interface Container {
  id: string;
  code: string;
  capacity: number;
  used: number;
  items: string[];
}

export default function PackScreen() {
  const [containers] = useState<Container[]>([
    { id: "CTB-001", code: "CTB-0001/CTB-0002", capacity: 100, used: 0, items: [] },
    { id: "CTB-002", code: "CTB-0001/CTB-0002", capacity: 100, used: 35, items: ["MEAL-0001", "MEAL-0002"] },
  ]);

  const [selectedOutside, setSelectedOutside] = useState<Container | null>(null);
  const [selectedInside, setSelectedInside] = useState<Container | null>(null);
  const [outsideInput, setOutsideInput] = useState("");
  const [insideInput, setInsideInput] = useState("");
  const [roomLeft, setRoomLeft] = useState(0);
  const [insideSize, setInsideSize] = useState(0);

  function handleOutsideScan() {
    if (!outsideInput.trim()) return;
    const container = containers.find((c) => c.code.includes(outsideInput.trim()));
    if (container) {
      setSelectedOutside(container);
      setOutsideInput("");
      setRoomLeft(container.capacity - container.used);
    }
  }

  function handleInsideScan() {
    if (!insideInput.trim()) return;
    const container = containers.find((c) => c.code.includes(insideInput.trim()));
    if (container) {
      setSelectedInside(container);
      setInsideInput("");
      setInsideSize(container.used);
    }
  }

  function handlePack() {
    if (selectedOutside && selectedInside) {
      setSelectedOutside(null);
      setSelectedInside(null);
      setRoomLeft(0);
      setInsideSize(0);
    }
  }

  function handleClearAll() {
    setSelectedOutside(null);
    setSelectedInside(null);
    setOutsideInput("");
    setInsideInput("");
    setRoomLeft(0);
    setInsideSize(0);
  }

  return (
    <section className="pack-section" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", color: "#fff", padding: "1.5rem" }}>
      <style>{`
        @media (max-width: 1024px) {
          .pack-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          section { padding: 1rem !important; gap: 1rem !important; }
        }
        @media (max-width: 480px) {
          section { padding: 0.75rem !important; gap: 0.75rem !important; }
          h3 { font-size: 1rem !important; }
        }
      `}</style>
      {/* Top section - Outside and Inside scanning */}
      <div className="pack-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Outside */}
        <div>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 600 }}>Outside</h3>

          <div
            style={{
              padding: "1rem",
              background: "#2a2a2a",
              border: selectedOutside ? "2px solid #3b82f6" : "1px solid #444",
              borderRadius: "8px",
              minHeight: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              color: selectedOutside ? "#fff" : "#666",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {selectedOutside ? selectedOutside.code : "Nothing selected"}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={outsideInput}
              onChange={(e) => setOutsideInput(e.target.value)}
              placeholder="Scan outside RFID/ID"
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.9rem",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleOutsideScan();
              }}
            />
            <button
              onClick={handleOutsideScan}
              style={{
                padding: "0.75rem 1.5rem",
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
          </div>
        </div>

        {/* Inside */}
        <div>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 600 }}>Inside</h3>

          <div
            style={{
              padding: "1rem",
              background: "#2a2a2a",
              border: selectedInside ? "2px solid #3b82f6" : "1px solid #444",
              borderRadius: "8px",
              minHeight: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              color: selectedInside ? "#fff" : "#666",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {selectedInside ? selectedInside.code : "Nothing selected"}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={insideInput}
              onChange={(e) => setInsideInput(e.target.value)}
              placeholder="Scan inside RFID/ID"
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.9rem",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInsideScan();
              }}
            />
            <button
              onClick={handleInsideScan}
              style={{
                padding: "0.75rem 1.5rem",
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
          </div>
        </div>
      </div>

      {/* Verify section */}
      <div>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 600 }}>Verify</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Outside contents */}
          <div style={{ padding: "1rem", background: "#2a2a2a", borderRadius: "8px", border: "1px solid #444" }}>
            <div style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "1rem", fontWeight: 600 }}>
              Outside contents
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#fff" }}>
              {selectedOutside ? selectedOutside.items.length : 0}
            </div>
          </div>

          {/* Inside contents */}
          <div style={{ padding: "1rem", background: "#2a2a2a", borderRadius: "8px", border: "1px solid #444" }}>
            <div style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "1rem", fontWeight: 600 }}>
              Inside contents
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#fff" }}>
              {selectedInside ? selectedInside.items.length : 0}
            </div>
          </div>
        </div>

        {/* Room and size metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1rem" }}>
          {/* Room left */}
          <div>
            <div style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "0.75rem", fontWeight: 600 }}>
              Room left
            </div>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#6b7280",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                −
              </button>
              <div style={{ fontSize: "1.3rem", fontWeight: 600, minWidth: "60px" }}>
                {roomLeft}
              </div>
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#6b7280",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Inside size */}
          <div>
            <div style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "0.75rem", fontWeight: 600 }}>
              Inside size
            </div>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#6b7280",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                −
              </button>
              <div style={{ fontSize: "1.3rem", fontWeight: 600, minWidth: "60px" }}>
                {insideSize}
              </div>
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#6b7280",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.75rem" }}>
        <button
          onClick={handlePack}
          disabled={!selectedOutside || !selectedInside}
          style={{
            padding: "0.75rem",
            background: selectedOutside && selectedInside ? "#3b82f6" : "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: selectedOutside && selectedInside ? "pointer" : "not-allowed",
            opacity: selectedOutside && selectedInside ? 1 : 0.5,
          }}
        >
          Pack
        </button>

        <button
          onClick={handleClearAll}
          style={{
            padding: "0.75rem",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Clear all
        </button>
      </div>

      <div style={{ fontSize: "0.75rem", color: "#999", textAlign: "center", marginTop: "1rem" }}>
        Select outside + inside
      </div>
    </section>
  );
}
