import { useEffect, useMemo, useRef, useState } from "react";
import { api, rfidMapTag, rfidScan } from "../lib/api";
import type { ItemDTO, LocationDTO, StockDTO } from "../lib/api";
import { useKeyboardWedgeScan } from "../lib/useKeyboardWedgeScan";
import { useParamsSafe } from "../lib/ParamsContext";

type Mode = "OUT" | "IN";

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#A3ABB9",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
};

async function postJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function Inventory() {
  // fetched data from backend
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [stocks, setStocks] = useState<StockDTO[]>([]);

  // UI state
  const [query, setQuery] = useState("");

  // --- scan box (top of page) ---
  const [scanTag, setScanTag] = useState("");
  const [scanQty, setScanQty] = useState(1);
  const [scanAction, setScanAction] = useState<Mode>("OUT");
  const [scanLoc, setScanLoc] = useState("");
  const [scanMsg, setScanMsg] = useState("");
  const [scanPhase, setScanPhase] = useState<
    "idle" | "scanning" | "ok" | "unknown" | "error"
  >("idle");
  const scanPhaseTimer = useRef<number | null>(null);
  const scanRef = useRef<HTMLInputElement | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("OUT");
  const [itemId, setItemId] = useState<string>("");

  const [formLocId, setFormLocId] = useState<string>("");
  const [formQty, setFormQty] = useState<number>(1);
  const [formWO, setFormWO] = useState<string>("");
  const [formReason, setFormReason] = useState<string>("");

  const [errMsg, setErrMsg] = useState<string>("");

  const params = useParamsSafe();
  const defaultLocationId = params?.defaultLocationId ?? "";

  // RFID mapping modal state
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapCardHex, setMapCardHex] = useState("");
  const [mapItemId, setMapItemId] = useState("");
  const [mapLocId, setMapLocId] = useState(defaultLocationId || "");

  // keep mapping location in sync when params/locations arrive
  useEffect(() => {
    if (!mapModalOpen) return;
    if (!mapLocId && defaultLocationId) setMapLocId(defaultLocationId);
    if (!mapLocId && !defaultLocationId && locations.length > 0)
      setMapLocId(locations[0].id);
  }, [mapModalOpen, defaultLocationId, locations, mapLocId]);

  // initial load
  async function refreshAll() {
    const [it, loc, st] = await Promise.all([
      api.items(),
      api.locations(),
      api.stocks(),
    ]);
    setItems(it);
    setLocations(loc);
    setStocks(st);
  }

  useEffect(() => {
    refreshAll().catch(console.error);
  }, []);

  // convenient lookup maps
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // filtered view
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      return (
        it.name.toLowerCase().includes(q) ||
        it.sku.toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const activeLocId = scanLoc || defaultLocationId || locations[0]?.id || "";

  const totalByItem = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of stocks) out[s.itemId] = (out[s.itemId] || 0) + (s.qty || 0);
    return out;
  }, [stocks]);

  const locByItem = useMemo(() => {
    const out: Record<string, number> = {};
    if (!activeLocId) return out;
    for (const s of stocks) {
      if (s.locationId === activeLocId)
        out[s.itemId] = (out[s.itemId] || 0) + (s.qty || 0);
    }
    return out;
  }, [stocks, activeLocId]);

  function stopScanTimer() {
    if (scanPhaseTimer.current != null) {
      window.clearTimeout(scanPhaseTimer.current);
      scanPhaseTimer.current = null;
    }
  }
  function flashPhase(phase: typeof scanPhase, msg: string, holdMs = 900) {
    stopScanTimer();
    setScanPhase(phase);
    setScanMsg(msg);
    if (phase !== "idle") {
      scanPhaseTimer.current = window.setTimeout(() => {
        setScanPhase("idle");
      }, holdMs);
    }
  }

  async function runRFIDScan(
    cardHex: string,
    mode: Mode,
    qty: number,
    locationId?: string,
  ) {
    const cleaned = String(cardHex || "").trim();
    if (!cleaned) return;

    stopScanTimer();
    setScanPhase("scanning");
    setScanMsg("Scanning…");

    try {
      const resp = await rfidScan({
        cardHex: cleaned,
        mode,
        qty,
        actor: localStorage.getItem("actor") || "crew",
        locationId: locationId || undefined,
      });

      if (!resp.ok) {
        // should not happen (errors throw), but just in case:
        flashPhase("error", `Error: ${resp.error ?? "unknown"}`, 1200);
        return;
      }

      await refreshAll();
      flashPhase(
        "ok",
        `✓ ${resp.itemSku ?? resp.itemId} ${mode} ×${qty}`,
        1000,
      );
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? "");
      // server uses CARD_NOT_MAPPED (404)
      if (msg.includes("CARD_NOT_MAPPED")) {
        setMapCardHex(cleaned);
        setMapItemId("");
        setMapLocId(defaultLocationId || (locations[0]?.id ?? ""));
        setMapModalOpen(true);
        flashPhase("unknown", "Unknown tag — map it", 1400);
      } else if (msg.includes("UNKNOWN_LOCATION")) {
        flashPhase("error", "Unknown location", 1400);
      } else {
        flashPhase("error", `Error: ${msg || "scan failed"}`, 1500);
      }
    }
  }

  async function submitMap() {
    try {
      if (!mapCardHex || !mapItemId || !mapLocId) return;
      await rfidMapTag({
        cardHex: mapCardHex,
        itemId: mapItemId,
        locationId: mapLocId,
      });
      setMapModalOpen(false);
      flashPhase("ok", "✓ Tag mapped", 1000);
    } catch (e: any) {
      flashPhase("error", `Map failed: ${String(e?.message ?? e)}`, 1600);
    }
  }

  // manual submit button for scan box
  async function submitScanBox() {
    const effectiveLoc = scanLoc || defaultLocationId || undefined;
    await runRFIDScan(scanTag, scanAction, scanQty, effectiveLoc);
  }

  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value: string) => {
      setScanTag(value);
      const effectiveLoc = scanLoc || defaultLocationId || undefined;
      runRFIDScan(value, scanAction, scanQty, effectiveLoc);
    },
  });

  // your existing checkout/checkin modal logic (keep)
  async function submit() {
    setErrMsg("");
    try {
      const payload = {
        itemId,
        locationId: formLocId,
        qty: formQty,
        actor: "crew",
        reason: formReason || undefined,
        workOrder: formWO || undefined,
      };
      if (mode === "OUT") await postJSON("/checkout", payload);
      else await postJSON("/checkin", payload);

      setOpen(false);
      await refreshAll();
    } catch (e: any) {
      setErrMsg(String(e?.message ?? e));
    }
  }

  return (
    <div style={{ padding: 16, color: NORD.text }}>
      <h2 style={{ marginTop: 0, fontSize: "1.6rem", fontWeight: 600 }}>
        Inventory
      </h2>

      {/* Scan bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: 16,
          borderRadius: 16,
          border:
            scanPhase === "ok"
              ? `2px solid ${NORD.green}`
              : scanPhase === "unknown"
                ? `2px solid ${NORD.yellow}`
                : scanPhase === "error"
                  ? `2px solid ${NORD.red}`
                  : "1px solid rgba(216,222,233,0.12)",
          background: NORD.panel2,
          marginBottom: 16,
          transition: "border 140ms ease",
        }}
      >
        <select
          value={scanAction}
          onChange={(e) => setScanAction(e.target.value as Mode)}
          style={{
            padding: "0.95rem 1.1rem",
            borderRadius: 16,
            border: "1px solid rgba(216,222,233,0.12)",
            background: NORD.panel3,
            color: NORD.text,
            fontSize: "1rem",
          }}
        >
          <option value="OUT">OUT</option>
          <option value="IN">IN</option>
        </select>

        <input
          ref={scanRef}
          value={scanTag}
          onChange={(e) => setScanTag(e.target.value)}
          placeholder="Scan / type tag…"
          style={{
            flex: 1,
            padding: "0.95rem 1.1rem",
            borderRadius: 16,
            border: "1px solid rgba(216,222,233,0.12)",
            background: NORD.panel3,
            color: NORD.text,
            outline: "none",
            fontSize: "1rem",
          }}
        />

        <select
          value={scanLoc}
          onChange={(e) => setScanLoc(e.target.value)}
          style={{
            minWidth: 140,
            padding: "0.95rem 1.1rem",
            borderRadius: 16,
            border: "1px solid rgba(216,222,233,0.12)",
            background: NORD.panel3,
            color: NORD.text,
            fontSize: "1rem",
          }}
        >
          <option value="">(mapped loc)</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          value={scanQty}
          onChange={(e) =>
            setScanQty(Math.min(100, Math.max(1, Number(e.target.value || 1))))
          }
          style={{
            width: 88,
            padding: "0.95rem 1rem",
            borderRadius: 16,
            border: "1px solid rgba(216,222,233,0.12)",
            background: NORD.panel3,
            color: NORD.text,
            fontSize: "1rem",
          }}
        />

        <button
          onClick={submitScanBox}
          style={{
            padding: "0.9rem 1.6rem",
            borderRadius: 16,
            border: "none",
            background: NORD.blue3,
            color: "rgb(236, 239, 244)",
            cursor: "pointer",
            fontWeight: 600,
            position: "relative",
            overflow: "hidden",
            fontSize: "1rem",
          }}
        >
          {scanPhase === "scanning" ? "Scanning…" : "Scan"}
          {scanPhase === "scanning" && (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "30%",
                background: "rgba(255,255,255,0.15)",
                transform: "translateX(-100%)",
                animation: "scanSweep 0.9s linear infinite",
              }}
            />
          )}
        </button>

        <div style={{ minWidth: 220, opacity: 0.9, color: NORD.muted }}>
          {scanPhase === "idle" ? (
            <span style={{ opacity: 0.7 }}>Ready</span>
          ) : (
            <span>{scanMsg}</span>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes scanSweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(420%); }
          }
        `}
      </style>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search (name, SKU, id)…"
          style={{
            flex: 1,
            padding: "0.95rem 1.1rem",
            borderRadius: 16,
            border: "1px solid rgba(216,222,233,0.12)",
            background: NORD.panel3,
            color: NORD.text,
            outline: "none",
            fontSize: "1rem",
          }}
        />
        <button
          onClick={() => refreshAll().catch(console.error)}
          style={{
            padding: "0.9rem 1.6rem",
            borderRadius: 16,
            border: "none",
            background: NORD.blue3,
            color: "rgb(236, 239, 244)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Items table */}
      <div
        style={{
          border: "1px solid rgba(216,222,233,0.12)",
          borderRadius: 16,
          overflow: "hidden",
          background: NORD.panel2,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1.4fr 1fr 90px 90px 90px 120px",
            padding: "0.85rem 1rem",
            background: NORD.panel3,
            fontWeight: 600,
            fontSize: "0.85rem",
            borderBottom: "1px solid rgba(216,222,233,0.12)",
            color: NORD.subtle,
            gap: 0,
          }}
        >
          <div>SKU</div>
          <div>Name</div>
          <div>Desc</div>
          <div style={{ textAlign: "right" }}>Loc</div>
          <div style={{ textAlign: "right" }}>Total</div>
          <div style={{ textAlign: "right" }}>ROP</div>
          <div>Actions</div>
        </div>

        {filtered.map((it) => (
          <div
            key={it.id}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1.4fr 1fr 90px 90px 90px 120px",
              padding: "0.85rem 1rem",
              borderTop: "1px solid rgba(216,222,233,0.08)",
              alignItems: "center",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ opacity: 0.9, color: NORD.text }}>{it.sku}</div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                  color: NORD.text,
                }}
              >
                {it.name}
              </div>
              <div
                style={{ fontSize: "0.8rem", opacity: 0.7, color: NORD.subtle }}
              >
                {it.id}
              </div>
            </div>
            <div
              style={{ opacity: 0.8, fontSize: "0.85rem", color: NORD.subtle }}
            >
              {it.description}
            </div>
            <div
              style={{ textAlign: "right", opacity: 0.8, color: NORD.muted }}
            >
              {locByItem[it.id] ?? 0}
            </div>
            <div
              style={{ textAlign: "right", opacity: 0.8, color: NORD.muted }}
            >
              {totalByItem[it.id] ?? 0}
            </div>
            <div
              style={{ textAlign: "right", opacity: 0.8, color: NORD.muted }}
            >
              {it.reorderPoint ?? "-"}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => {
                  setOpen(true);
                  setMode("OUT");
                  setItemId(it.id);
                  setFormQty(1);
                  setFormWO("");
                  setFormReason("");
                  setFormLocId(defaultLocationId || locations[0]?.id || "");
                }}
                style={{
                  flex: 1,
                  padding: "0.55rem",
                  borderRadius: 12,
                  border: "none",
                  background: NORD.red,
                  color: "rgb(236, 239, 244)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                OUT
              </button>
              <button
                onClick={() => {
                  setOpen(true);
                  setMode("IN");
                  setItemId(it.id);
                  setFormQty(1);
                  setFormWO("");
                  setFormReason("");
                  setFormLocId(defaultLocationId || locations[0]?.id || "");
                }}
                style={{
                  flex: 1,
                  padding: "0.55rem",
                  borderRadius: 12,
                  border: "none",
                  background: NORD.green,
                  color: NORD.bg,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                IN
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout/Checkin modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 520,
              maxWidth: "100%",
              background: NORD.panel,
              border: "1px solid rgba(216,222,233,0.12)",
              borderRadius: 16,
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                fontSize: "1.35rem",
                fontWeight: 600,
                color: NORD.blue,
                marginBottom: "1.5rem",
              }}
            >
              {mode} — {itemById.get(itemId)?.sku}
            </h3>

            <div style={{ display: "grid", gap: "1rem" }}>
              <label style={{ display: "grid", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: NORD.subtle,
                  }}
                >
                  Location
                </span>
                <select
                  value={formLocId}
                  onChange={(e) => setFormLocId(e.target.value)}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: 14,
                    border: "1px solid rgba(216,222,233,0.12)",
                    background: NORD.panel2,
                    color: NORD.text,
                  }}
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} — {l.description}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: NORD.subtle,
                  }}
                >
                  Qty
                </span>
                <input
                  type="number"
                  min={1}
                  value={formQty}
                  onChange={(e) =>
                    setFormQty(
                      Math.min(100, Math.max(1, Number(e.target.value || 1))),
                    )
                  }
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: 14,
                    border: "1px solid rgba(216,222,233,0.12)",
                    background: NORD.panel2,
                    color: NORD.text,
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: NORD.subtle,
                  }}
                >
                  Work Order (optional)
                </span>
                <input
                  value={formWO}
                  onChange={(e) => setFormWO(e.target.value)}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: 14,
                    border: "1px solid rgba(216,222,233,0.12)",
                    background: NORD.panel2,
                    color: NORD.text,
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: NORD.subtle,
                  }}
                >
                  Reason (optional)
                </span>
                <input
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: 14,
                    border: "1px solid rgba(216,222,233,0.12)",
                    background: NORD.panel2,
                    color: NORD.text,
                  }}
                />
              </label>

              {errMsg && (
                <div
                  style={{
                    color: NORD.red,
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  {errMsg}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "flex-end",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "0.85rem 1.5rem",
                    borderRadius: 14,
                    border: "1px solid rgba(216,222,233,0.16)",
                    background: "transparent",
                    color: NORD.text,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  style={{
                    padding: "0.85rem 1.5rem",
                    borderRadius: 14,
                    border: "none",
                    background: NORD.blue3,
                    color: "rgb(236, 239, 244)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RFID map modal */}
      {mapModalOpen && (
        <div
          onClick={() => setMapModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 560,
              maxWidth: "100%",
              background: NORD.panel,
              border: "1px solid rgba(216,222,233,0.12)",
              borderRadius: 16,
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                fontSize: "1.35rem",
                fontWeight: 600,
                color: NORD.blue,
                marginBottom: "1.5rem",
              }}
            >
              Map RFID Tag
            </h3>
            <div
              style={{
                opacity: 0.75,
                marginBottom: "1rem",
                fontSize: "0.95rem",
                color: NORD.muted,
              }}
            >
              Tag:{" "}
              <span style={{ fontFamily: "monospace", color: NORD.blue }}>
                {mapCardHex}
              </span>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <label style={{ display: "grid", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: NORD.subtle,
                  }}
                >
                  Item
                </span>
                <select
                  value={mapItemId}
                  onChange={(e) => setMapItemId(e.target.value)}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: 14,
                    border: "1px solid rgba(216,222,233,0.12)",
                    background: NORD.panel2,
                    color: NORD.text,
                  }}
                >
                  <option value="">(choose)</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.sku} — {it.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: NORD.subtle,
                  }}
                >
                  Location
                </span>
                <select
                  value={mapLocId}
                  onChange={(e) => setMapLocId(e.target.value)}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: 14,
                    border: "1px solid rgba(216,222,233,0.12)",
                    background: NORD.panel2,
                    color: NORD.text,
                  }}
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} — {l.description}
                    </option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "flex-end",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  onClick={() => setMapModalOpen(false)}
                  style={{
                    padding: "0.85rem 1.5rem",
                    borderRadius: 14,
                    border: "1px solid rgba(216,222,233,0.16)",
                    background: "transparent",
                    color: NORD.text,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!mapItemId || !mapLocId}
                  onClick={submitMap}
                  style={{
                    padding: "0.85rem 1.5rem",
                    borderRadius: 14,
                    border: "none",
                    background: mapItemId && mapLocId ? NORD.blue3 : "#6b7280",
                    color:
                      mapItemId && mapLocId ? "rgb(236, 239, 244)" : NORD.text,
                    cursor: mapItemId && mapLocId ? "pointer" : "not-allowed",
                    fontWeight: 600,
                    opacity: mapItemId && mapLocId ? 1 : 0.5,
                  }}
                >
                  Save mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
