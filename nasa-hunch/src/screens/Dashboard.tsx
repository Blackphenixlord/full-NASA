// src/screens/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { ItemDTO, StockDTO } from "../lib/api";

/**
 * Dashboard — ground control view (live).
 * Pulls data from backend instead of mock store.
 */
export default function Dashboard() {
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [stocks, setStocks] = useState<StockDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch data on mount
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const [it, st] = await Promise.all([api.getItems(), api.getStocks()]);
        if (!alive) return;
        setItems(it);
        setStocks(st);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const t = window.setInterval(load, 2000);

    function onInventoryUpdated() {
      load();
    }
    window.addEventListener("inventory:updated", onInventoryUpdated);

    return () => {
      alive = false;
      window.clearInterval(t);
      window.removeEventListener("inventory:updated", onInventoryUpdated);
    };
  }, []);

  // Build helper maps
  // total quantity on station per item
  const qtyByItem = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of stocks) {
      map[row.itemId] = (map[row.itemId] || 0) + row.qty;
    }
    return map;
  }, [stocks]);

  // compute "low / at risk"
  const lowOrRiskCount = useMemo(() => {
    let count = 0;
    for (const it of items) {
      const totalQty = qtyByItem[it.id] || 0;

      // if total <= safetyStock -> "at risk"
      if (
        it.safetyStock !== undefined &&
        totalQty <= it.safetyStock
      ) {
        count++;
        continue;
      }

      // else if total <= reorderPoint -> "low"
      if (
        it.reorderPoint !== undefined &&
        totalQty <= it.reorderPoint
      ) {
        count++;
        continue;
      }
    }
    return count;
  }, [items, qtyByItem]);

  // expiring soon count (<= 60 days)
  const expiringSoon = useMemo(() => {
    const now = Date.now();
    const sixtyDays = 1000 * 60 * 60 * 24 * 60;

    let count = 0;
    for (const st of stocks) {
      if (!st.expiresAt) continue;
      const t = new Date(st.expiresAt).getTime();
      if (t - now < sixtyDays) {
        count++;
      }
    }
    return count;
  }, [stocks]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        color: "#fff",
      }}
    >
      <KPI
        label="Unique Items"
        value={items.length}
        loading={loading}
      />
      <KPI
        label="Stock Records"
        value={stocks.length}
        loading={loading}
      />
      <KPI
        label="Low / At Risk"
        value={lowOrRiskCount}
        loading={loading}
      />
      <KPI
        label="Expiring ≤ 60 d"
        value={expiringSoon}
        loading={loading}
      />
    </div>
  );
}

// KPI card component
function KPI({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div
      style={{
        background: "#2a2a2a",
        border: "1px solid #444",
        borderRadius: "10px",
        padding: "1rem",
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#aaa",
          textTransform: "uppercase",
        }}
      >
        {label}
      </h3>
      <strong
        style={{
          fontSize: "1.8rem",
          fontWeight: 600,
          color: "#fff",
        }}
      >
        {loading ? "…" : value}
      </strong>
    </div>
  );
}
