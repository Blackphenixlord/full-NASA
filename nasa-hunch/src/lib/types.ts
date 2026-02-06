// src/lib/types.ts

// High-level definition of an inventory item / SKU
export interface Item {
  id: string;              // stable internal ID, like "itm-001"
  sku: string;             // human code, like "CO2-FLTR-A"
  name: string;            // display name
  description?: string;    // details / notes
  safetyStock?: number;    // if qty <= this, it's red "AT RISK"
  reorderPoint?: number;   // if qty <= this, it's yellow "LOW"
}

// Physical storage location (airlock locker, bay, med kit, etc.)
export interface Location {
  id: string;              // internal ID like "loc-airlock"
  code: string;            // short label to show in UI: "AIRLOCK"
  description?: string;    // longer explanation for ground crew
}

// A stock record = "we have X units of Y in Z"
export interface StockRecord {
  id: string;              // row id for this stock batch
  itemId: string;          // which Item
  locationId: string;      // where it's stored
  qty: number;             // how many are currently there
  expiresAt?: string;      // optional ISO date string for shelf life
}

// Every movement of inventory in or out gets logged here
export interface TransactionLog {
  id: string;
  timestamp: string;       // ISO datetime when it happened
  itemId: string;
  locationId: string;
  mode: "OUT" | "IN";      // OUT = astronaut took it, IN = restocked/returned
  qty: number;
  actor: string;           // "astronaut", "ground", etc.
  reason?: string;         // why they took/returned it
  workOrder?: string;      // e.g. "WO-1234"
}
