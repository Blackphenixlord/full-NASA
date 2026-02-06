import { useState } from "react";

interface Move {
  fromContainer: string | null;
  toContainer: string | null;
  reason: string;
  sourceContext: string;
  destContext: string;
}

export default function MoveScreen() {
  const [move, setMove] = useState<Move>({
    fromContainer: null,
    toContainer: null,
    reason: "Space constraint",
    sourceContext: "",
    destContext: "",
  });

  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [draftOpen, setDraftOpen] = useState(false);

  // const locations: Location[] = [
  //   { id: "1", code: "S1-L12/CTB-0001/CTB-0002", description: "Shelf 1, Level 12" },
  //   { id: "2", code: "S2-L02/CTB-0001/CTB-0002", description: "Shelf 2, Level 2" },
  //   { id: "3", code: "S3-L08/CTB-0001/CTB-0002", description: "Shelf 3, Level 8" },
  // ];

  const reasonOptions = [
    "Space constraint",
    "Environmental condition",
    "Accessibility",
    "Weight distribution",
    "Organization",
    "Maintenance",
  ];

  function handleFromScan() {
    if (!fromInput.trim()) return;
    setMove({ ...move, fromContainer: fromInput.trim() });
    setFromInput("");
  }

  function handleToScan() {
    if (!toInput.trim()) return;
    setMove({ ...move, toContainer: toInput.trim() });
    setToInput("");
  }

  function handleExecuteMove() {
    if (!move.fromContainer || !move.toContainer) return;
    // Log move
    console.log("Move executed:", move);
    // Reset
    setMove({
      fromContainer: null,
      toContainer: null,
      reason: "Space constraint",
      sourceContext: "",
      destContext: "",
    });
  }

  function handleOpenDraft() {
    setDraftOpen(true);
  }

  return (
    <section
      className="move-section"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", color: "#fff" }}
    >
      {/* From section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>From</h2>

        <div
          style={{
            padding: "1.5rem",
            background: "#2a2a2a",
            border: move.fromContainer ? "2px solid #3b82f6" : "1px solid #444",
            borderRadius: "8px",
            minHeight: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: move.fromContainer ? "#fff" : "#666",
            fontSize: "0.95rem",
            fontWeight: 500,
            marginBottom: "1rem",
          }}
        >
          {move.fromContainer ? move.fromContainer : "None selected"}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            placeholder="Scan source container"
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
              if (e.key === "Enter") handleFromScan();
            }}
          />
          <button
            onClick={handleFromScan}
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

        {/* Source context */}
        <div style={{ marginTop: "1rem" }}>
          <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Source container
          </label>
          <div
            style={{
              padding: "0.75rem",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "#aaa",
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            No context available.
          </div>
        </div>
      </div>

      {/* To section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>To</h2>

        <div
          style={{
            padding: "1.5rem",
            background: "#2a2a2a",
            border: move.toContainer ? "2px solid #3b82f6" : "1px solid #444",
            borderRadius: "8px",
            minHeight: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: move.toContainer ? "#fff" : "#666",
            fontSize: "0.95rem",
            fontWeight: 500,
            marginBottom: "1rem",
          }}
        >
          {move.toContainer ? move.toContainer : "None selected"}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            placeholder="Scan destination container"
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
              if (e.key === "Enter") handleToScan();
            }}
          />
          <button
            onClick={handleToScan}
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

        {/* Destination context */}
        <div style={{ marginTop: "1rem" }}>
          <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Destination container
          </label>
          <div
            style={{
              padding: "0.75rem",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "#aaa",
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            No context available.
          </div>
        </div>
      </div>

      {/* Move configuration section */}
      <div style={{ gridColumn: "1 / -1", paddingTop: "1.5rem", borderTop: "1px solid #444" }}>
        <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", fontWeight: 600 }}>Move</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Reason dropdown */}
          <div>
            <label style={{ fontSize: "0.85rem", color: "#aaa", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              Reason
            </label>
            <select
              value={move.reason}
              onChange={(e) => setMove({ ...move, reason: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              {reasonOptions.map((reason) => (
                <option key={reason} value={reason} style={{ background: "#2a2a2a", color: "#fff" }}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Empty space */}
          <div />
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
          <button
            onClick={handleOpenDraft}
            style={{
              padding: "0.75rem",
              background: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Open Draft
          </button>

          <button
            onClick={handleExecuteMove}
            disabled={!move.fromContainer || !move.toContainer}
            style={{
              padding: "0.75rem",
              background: move.fromContainer && move.toContainer ? "#3b82f6" : "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: move.fromContainer && move.toContainer ? "pointer" : "not-allowed",
              opacity: move.fromContainer && move.toContainer ? 1 : 0.5,
            }}
          >
            Execute move
          </button>
        </div>
      </div>

      {/* Draft modal overlay */}
      {draftOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setDraftOpen(false)}
        >
          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid #444",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "500px",
              color: "#fff",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", fontWeight: 600 }}>
              Open Draft
            </h3>

            <p style={{ color: "#aaa", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Create a draft move for later review and execution. This allows you to plan and validate moves before committing them to the system.
            </p>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => {
                  setDraftOpen(false);
                  console.log("Draft created:", move);
                }}
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
                Create Draft
              </button>
              <button
                onClick={() => setDraftOpen(false)}
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
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
