// src/lib/store.ts
import type {
  Item,
  Location,
  StockRecord,
  TransactionLog,
} from "./types";

// --- Mock data --------------------------------------------------------------

// Items on board
let ITEMS: Item[] = [
  {
    id: "itm-001",
    sku: "CO2-FLTR-A",
    name: "CO₂ Scrubber Cartridge – Type A",
    description: "Life-support CO₂ removal cartridge",
    safetyStock: 4,
    reorderPoint: 8,
  },
  {
    id: "itm-002",
    sku: "PWR-CKT-12V",
    name: "12 V Power Converter Board",
    description: "DC step-down module for avionics panel",
    safetyStock: 2,
    reorderPoint: 5,
  },
  {
    id: "itm-003",
    sku: "MED-SEALKIT",
    name: "Emergency Seal Kit",
    description: "Adhesive patch kit for minor pressure leaks",
    safetyStock: 1,
    reorderPoint: 3,
  },
];

// Physical storage locations
let LOCATIONS: Location[] = [
  {
    id: "loc-airlock",
    code: "AIRLOCK",
    description: "Airlock Locker A",
  },
  {
    id: "loc-bay-a",
    code: "BAY-A",
    description: "Equipment Bay A",
  },
  {
    id: "loc-med",
    code: "MED",
    description: "Medical / Trauma",
  },
];

// Stock records = how many of each item is at each location
let STOCKS: StockRecord[] = [
  {
    id: "stk-001",
    itemId: "itm-001",
    locationId: "loc-airlock",
    qty: 6,
    expiresAt: "2025-12-01",
  },
  {
    id: "stk-002",
    itemId: "itm-001",
    locationId: "loc-bay-a",
    qty: 4,
    expiresAt: "2025-12-01",
  },
  {
    id: "stk-003",
    itemId: "itm-002",
    locationId: "loc-bay-a",
    qty: 3,
  },
  {
    id: "stk-004",
    itemId: "itm-003",
    locationId: "loc-med",
    qty: 2,
    expiresAt: "2025-11-10",
  },
];

// Log of movements (check-outs/check-ins)
let LOGS: TransactionLog[] = [];

// --- Helpers ----------------------------------------------------------------

const nowISO = () => new Date().toISOString();

// sum quantities in a list of stock records
function sumQty(records: StockRecord[]) {
  return records.reduce((a, b) => a + b.qty, 0);
}

// qty of itemId at locId
function qtyAt(itemId: string, locId: string) {
  return sumQty(
    STOCKS.filter(
      (r) => r.itemId === itemId && r.locationId === locId
    )
  );
}

// remove qty from a specific location (used in checkout)
function removeStock(
  itemId: string,
  locId: string,
  qty: number
) {
  let remaining = qty;

  for (const rec of STOCKS) {
    if (
      rec.itemId === itemId &&
      rec.locationId === locId &&
      remaining > 0
    ) {
      const take = Math.min(rec.qty, remaining);
      rec.qty -= take;
      remaining -= take;
    }
  }

  // clean up empty rows
  STOCKS = STOCKS.filter((rec) => rec.qty > 0);

  if (remaining > 0) {
    throw new Error("Not enough stock at that location.");
  }
}

// add qty to a location (used in checkin)
function addStock(
  itemId: string,
  locId: string,
  qty: number,
  expiresAt?: string
) {
  // try to merge with an existing row of same item+loc+expiry
  const match = STOCKS.find(
    (rec) =>
      rec.itemId === itemId &&
      rec.locationId === locId &&
      rec.expiresAt === expiresAt
  );

  if (match) {
    match.qty += qty;
  } else {
    STOCKS.push({
      id: "stk-" + Math.random().toString(36).slice(2, 8),
      itemId,
      locationId: locId,
      qty,
      expiresAt,
    });
  }
}

// --- Public API --------------------------------------------------------------

export const db = {
  // raw collections
  items(): Item[] {
    return ITEMS;
  },

  locations(): Location[] {
    return LOCATIONS;
  },

  stocks(): StockRecord[] {
    return STOCKS;
  },

  logs(): TransactionLog[] {
    // newest first
    return [...LOGS].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  },

  // search items by name, sku, or description
  searchItems(q: string): Item[] {
    const needle = q.toLowerCase().trim();
    if (!needle) return ITEMS;
    return ITEMS.filter(
      (i) =>
        i.sku.toLowerCase().includes(needle) ||
        i.name.toLowerCase().includes(needle) ||
        (i.description ?? "")
          .toLowerCase()
          .includes(needle)
    );
  },

  // get availability of one item split by each location
  // -> [{ locationId, qty, expiresAt? }, ...]
  itemAvailability(itemId: string) {
    return STOCKS.filter((s) => s.itemId === itemId).map((s) => ({
      locationId: s.locationId,
      qty: s.qty,
      expiresAt: s.expiresAt,
    }));
  },

  // astronaut takes hardware
  checkOut(
    itemId: string,
    locId: string,
    qty: number,
    actor: string,
    reason?: string,
    workOrder?: string
  ) {
    if (qty <= 0) {
      throw new Error("Quantity must be > 0");
    }

    const availableHere = qtyAt(itemId, locId);
    if (availableHere < qty) {
      throw new Error(
        `Only ${availableHere} units available at this location.`
      );
    }

    removeStock(itemId, locId, qty);

    LOGS.push({
      id: "log-" + Math.random().toString(36).slice(2, 8),
      timestamp: nowISO(),
      itemId,
      locationId: locId,
      mode: "OUT",
      qty,
      actor,
      reason,
      workOrder,
    });
  },

  // astronaut returns / restocks
  checkIn(
    itemId: string,
    locId: string,
    qty: number,
    actor: string,
    reason?: string,
    workOrder?: string
  ) {
    if (qty <= 0) {
      throw new Error("Quantity must be > 0");
    }

    addStock(itemId, locId, qty);

    LOGS.push({
      id: "log-" + Math.random().toString(36).slice(2, 8),
      timestamp: nowISO(),
      itemId,
      locationId: locId,
      mode: "IN",
      qty,
      actor,
      reason,
      workOrder,
    });
  },
};
