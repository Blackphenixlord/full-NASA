import { useRef, useState } from "react";
import { useKeyboardWedgeScan } from "../lib/useKeyboardWedgeScan";

interface TagItem {
  id: string;
  code: string;
  name: string;
  status: "tagged" | "untagged" | "needs-verify";
}

interface Pairing {
  cardUid: string;
  itemId: string;
  timestamp: string;
}

export default function TagScreen() {
  const [scanInput, setScanInput] = useState("");
  // const [scanMode, setScanMode] = useState<"rfid" | "uid">("rfid");
  const [items, setItems] = useState<TagItem[]>([
    { id: "1", code: "MEAL-0001", name: "Meal • Pasta Primavera", status: "untagged" },
    { id: "2", code: "MEAL-0002", name: "Meal • Veggie Curry", status: "tagged" },
    { id: "3", code: "BLOB-0001", name: "Blob • Modular (Pan 1)", status: "needs-verify" },
  ]);

  const [selectedItem, setSelectedItem] = useState<TagItem | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [lastCardUid, setLastCardUid] = useState<string>("");
  const [status, setStatus] = useState<"waiting" | "scanning" | "paired" | "error">("waiting");
  const [message, setMessage] = useState("");
  const scanRef = useRef<HTMLInputElement>(null);

  // Keyboard wedge scanner
  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value) => {
      setScanInput(value);
      setLastCardUid(value);
      if (selectedItem) {
        handlePair(value, selectedItem.id);
      } else {
        setStatus("error");
        setMessage("Select an item first");
      }
    },
    minLength: 8,
    maxDelayMs: 35,
  });

  function handlePair(cardUid: string, itemId: string) {
    setStatus("scanning");
    setTimeout(() => {
      const pairing: Pairing = {
        cardUid,
        itemId,
        timestamp: new Date().toISOString(),
      };
      setPairings([...pairings, pairing]);

      const item = items.find((i) => i.id === itemId);
      if (item) {
        setItems(
          items.map((i) =>
            i.id === itemId ? { ...i, status: "tagged" as const } : i
          )
        );
        setStatus("paired");
        setMessage(`Paired ${item.code}`);
        setTimeout(() => {
          setStatus("waiting");
          setScanInput("");
        }, 1500);
      }
    }, 400);
  }

  function handleManualScan() {
    if (!scanInput.trim()) return;
    if (!selectedItem) {
      setStatus("error");
      setMessage("Select an item first");
      return;
    }
    handlePair(scanInput.trim(), selectedItem.id);
    setScanInput("");
  }

  function handleClear() {
    setScanInput("");
    setStatus("waiting");
    setMessage("");
    setSelectedItem(null);
  }

  const statusColor = {
    waiting: "#6b7280",
    scanning: "#3b82f6",
    paired: "#22c55e",
    error: "#ef4444",
  };

  const statusLabel = {
    waiting: "Waiting for scan",
    scanning: "Scanning…",
    paired: "Paired successfully",
    error: "Error",
  };

  return (
    <section
      className="tag-section"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1.25rem",
        color: "#fff",
        padding: "1rem",
        alignContent: "start",
        height: "100%",
        minHeight: 0,
      }}
    >
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
      {/* Left side - RFID scanning */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: 0, height: "100%" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.15rem", fontWeight: 600 }}>RFID card</h2>

        {/* Status indicator */}
        <div
          style={{
            padding: "1rem",
            background: "#2a2a2a",
            border: `2px solid ${statusColor[status]}`,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#aaa", marginBottom: "0.5rem", fontWeight: 600 }}>
              Status
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: statusColor[status] }}>
              {statusLabel[status]}
            </div>
          </div>

          {status === "scanning" && (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "30%",
                background: "rgba(255,255,255,0.12)",
                transform: "translateX(-100%)",
                animation: "scanSweep 0.9s linear infinite",
              }}
            />
          )}
        </div>

        {/* UID input */}
        <div>
          <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            UID
          </label>
          <input
            ref={scanRef}
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="Scan RFID or type UID, then press Enter"
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "0.9rem",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleManualScan();
            }}
          />
        </div>

        {/* Node info */}
        <div
          style={{
            padding: "0.75rem",
            background: "#1a1a1a",
            border: "1px solid #444",
            borderRadius: "8px",
            fontSize: "0.85rem",
            color: "#aaa",
          }}
        >
          No node info
        </div>

        {/* Scan and Clear buttons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleManualScan}
            style={{
              flex: 1,
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
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Right side - Item selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: 0 }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.15rem", fontWeight: 600 }}>Selection</h2>

        {/* Item dropdown */}
        <div>
          <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Shipment
          </label>
          <div
            style={{
              padding: "0.75rem",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#ccc",
              cursor: "pointer",
            }}
          >
            SHIP-8841 • Meals Vendor
          </div>
        </div>

        {/* Item selection */}
        <div>
          <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Item
          </label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              maxHeight: "200px",
              overflowY: "auto",
              paddingBottom: "0.25rem",
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: "0.75rem",
                  background: selectedItem?.id === item.id ? "rgba(59, 130, 246, 0.2)" : "#2a2a2a",
                  border: selectedItem?.id === item.id ? "1px solid #3b82f6" : "1px solid #444",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{item.code}</div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "0.25rem" }}>{item.name}</div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.25rem 0.5rem",
                      background:
                        item.status === "tagged"
                          ? "#22c55e"
                          : item.status === "needs-verify"
                          ? "#f59e0b"
                          : "#6b7280",
                      borderRadius: "3px",
                      whiteSpace: "nowrap",
                      color: item.status === "tagged" || item.status === "needs-verify" ? "#000" : "#fff",
                    }}
                  >
                    {item.status === "tagged"
                      ? "Tagged"
                      : item.status === "needs-verify"
                      ? "Needs verify"
                      : "Untagged"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pair + Verify section */}
        <div style={{ marginTop: "0.5rem", paddingTop: "0.6rem", borderTop: "1px solid #444" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600 }}>Pair + verify</h3>
          <p style={{ fontSize: "0.8rem", color: "#aaa", margin: "0 0 1rem 0", lineHeight: 1.5 }}>
            Pair the scanned card to an item in the shipment, then verify the read
          </p>

          {/* Pairing info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: "0.25rem", fontWeight: 600 }}>
                Card UID
              </div>
              <div style={{ fontSize: "0.85rem", fontFamily: "monospace", color: lastCardUid ? "#fff" : "#666" }}>
                {lastCardUid || "—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: "0.25rem", fontWeight: 600 }}>
                Object
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {selectedItem ? `${selectedItem.code} • ${selectedItem.name}` : "—"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <button
              onClick={() => {
                if (lastCardUid && selectedItem) {
                  handlePair(lastCardUid, selectedItem.id);
                }
              }}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: lastCardUid && selectedItem ? "#3b82f6" : "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: lastCardUid && selectedItem ? "pointer" : "not-allowed",
                opacity: lastCardUid && selectedItem ? 1 : 0.5,
              }}
            >
              Pair
            </button>
            <button
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Verify
            </button>
          </div>

          {message && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: status === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                border: `1px solid ${status === "error" ? "#ef4444" : "#22c55e"}`,
                borderRadius: "8px",
                color: status === "error" ? "#ef4444" : "#22c55e",
                fontSize: "0.85rem",
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}
