import { useState, useRef, useEffect } from "react";

interface TagItem {
  id: string;
  sku: string;
  name: string;
  status: "untagged" | "in-progress" | "tagged";
}

interface RFIDCard {
  cardHex: string;
  lastScanned?: string;
}

export default function Tag() {
  const [items, setItems] = useState<TagItem[]>([
    { id: "1", sku: "MEAL-0001", name: "Meal • Pasta Primavera", status: "untagged" },
    { id: "2", sku: "MEAL-0002", name: "Meal • Veggie Curry", status: "untagged" },
    { id: "3", sku: "BLOB-0001", name: "Blob • Mode of (Day 1)", status: "untagged" },
  ]);

  const [uid, setUid] = useState("");
  const [selectedItem, setSelectedItem] = useState<TagItem | null>(null);
  const [status, setStatus] = useState<"waiting" | "pairing" | "paired" | "error">("waiting");
  const [pairedCard, setPairedCard] = useState<RFIDCard | null>(null);
  const uidRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    uidRef.current?.focus();
  }, []);

  const handleScan = (scannedUid: string) => {
    const normalized = scannedUid.trim().toUpperCase();
    setUid(normalized);
    setPairedCard({ cardHex: normalized, lastScanned: new Date().toLocaleTimeString() });
    setStatus("paired");

    // Simulate successful scan
    setTimeout(() => {
      setStatus("waiting");
    }, 3000);
  };

  const handlePair = () => {
    if (!pairedCard || !selectedItem) {
      setStatus("error");
      return;
    }

    setStatus("pairing");
    // Simulate pairing
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? { ...item, status: "tagged" } : item))
      );
      setStatus("paired");
      setSelectedItem(null);
      setUid("");
      setPairedCard(null);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && uid.trim()) {
      handleScan(uid);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", color: "#fff" }}>
      {/* Left side - RFID scanning */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa", textTransform: "uppercase" }}>
            RFID card
          </h3>

          {/* Status indicator */}
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "6px",
              fontSize: "0.8rem",
              marginBottom: "1rem",
              color:
                status === "paired"
                  ? "#22c55e"
                  : status === "error"
                  ? "#ef4444"
                  : status === "pairing"
                  ? "#3b82f6"
                  : "#9ca3af",
            }}
          >
            {status === "waiting" && "● Waiting for scan"}
            {status === "pairing" && "● Pairing in progress..."}
            {status === "paired" && "✓ Card scanned"}
            {status === "error" && "✗ Error scanning"}
          </div>
        </div>

        {/* UID Input */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "#aaa", display: "block", marginBottom: "0.75rem" }}>UID</label>
          <input
            ref={uidRef}
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan RFID or type UID, then press Enter"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #444",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "6px" }}>No node info</div>
        </div>

        {/* Scan Button */}
        <button
          onClick={() => handleScan(uid)}
          disabled={!uid.trim()}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            background: uid.trim() ? "#3b82f6" : "#444",
            color: "#fff",
            cursor: uid.trim() ? "pointer" : "not-allowed",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Scan
        </button>

        <button
          onClick={() => {
            setUid("");
            setPairedCard(null);
            uidRef.current?.focus();
          }}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #444",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Clear
        </button>
      </div>

      {/* Right side - Item selection & pairing */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Selection */}
        <div>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa", textTransform: "uppercase" }}>
            Selection
          </h3>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.8rem", color: "#aaa", display: "block", marginBottom: "0.5rem" }}>
              Shipment
            </label>
            <select
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "#1a1a1a",
                color: "#fff",
                fontSize: "0.9rem",
              }}
            >
              <option>SHIP-8841 • Meals Vendor</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "#aaa", display: "block", marginBottom: "0.75rem" }}>Item</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                  style={{
                    padding: "12px",
                    borderRadius: "6px",
                    border: selectedItem?.id === item.id ? "1px solid #3b82f6" : "1px solid #444",
                    background: selectedItem?.id === item.id ? "rgba(59, 130, 246, 0.1)" : "#1a1a1a",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>{item.sku}</div>
                  <div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>{item.name}</div>
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background:
                          item.status === "tagged"
                            ? "#22c55e"
                            : item.status === "in-progress"
                            ? "#3b82f6"
                            : "#666",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color:
                          item.status === "tagged"
                            ? "#22c55e"
                            : item.status === "in-progress"
                            ? "#3b82f6"
                            : "#999",
                        textTransform: "capitalize",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pair + Verify */}
        <div>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#aaa", textTransform: "uppercase" }}>
            Pair + verify
          </h3>
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#aaa", marginBottom: "0.5rem" }}>Card UID</div>
                <div style={{ fontSize: "0.9rem", fontFamily: "monospace", color: "#fff" }}>
                  {pairedCard?.cardHex || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#aaa", marginBottom: "0.5rem" }}>Object</div>
                <div style={{ fontSize: "0.9rem", color: "#fff" }}>
                  {selectedItem ? `${selectedItem.sku} • ${selectedItem.name}` : "—"}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#999", lineHeight: 1.5 }}>
              Pair writes the association (UID ↔ object). Verify checks that the reader can re-read the same UID.
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <button
              onClick={handlePair}
              disabled={!pairedCard || !selectedItem}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: pairedCard && selectedItem ? "#3b82f6" : "#444",
                color: "#fff",
                cursor: pairedCard && selectedItem ? "pointer" : "not-allowed",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Pair
            </button>
            <button
              disabled={!pairedCard}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "transparent",
                color: "#fff",
                cursor: pairedCard ? "pointer" : "not-allowed",
                opacity: pairedCard ? 1 : 0.5,
                fontSize: "0.9rem",
              }}
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
