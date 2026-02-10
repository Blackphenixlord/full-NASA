import "dotenv/config";
import Fastify from "fastify";
import { Pool } from "pg";

const app = Fastify({
  logger: { transport: { target: "pino-pretty" } },
});

// Basic CORS support (handles preflight without extra deps)
app.addHook("onRequest", async (req, rep) => {
  rep.header("Access-Control-Allow-Origin", "*");
  rep.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  rep.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return rep.code(204).send();
  }
});

const pool = new Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? "aether",
  password: process.env.PGPASSWORD ?? "aether",
  database: process.env.PGDATABASE ?? "aether",
});

const USE_MEMORY = process.env.NO_DB === "1";

// --- helpers -------------------------------------------------------
const q = (text, params = []) => pool.query(text, params);
const INV_SCHEMA = "inventory";
const DSLM_SCHEMA = "dlsm";

function normalizeHex(s) {
  return String(s || "").trim().toUpperCase().replace(/^0x/i, "");
}

function normalizeUnitId(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeShelf(value) {
  const v = String(value || "").trim().toUpperCase();
  return v;
}

function normalizeSlot(value) {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return v;
  return v.startsWith("L") ? v : `L${v}`;
}

function normalizeDepth(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n;
}

function normalizeBadgeTag(s) {
  return String(s || "").replace(/[^0-9A-Za-z]/g, "");
}

function createMemoryStore() {
  const units = new Map();
  const identifiers = new Map();
  const events = [];
  const badges = new Map([
    ["0003070837", { actor: "crew", ui_mode: "crew" }],
    ["0003104127", { actor: "ground", ui_mode: "ground" }],
  ]);

  const addUnit = (id, kind, name, category, metadata = {}) => {
    const meta = { ...(metadata ?? {}) };
    if (kind === "Item") {
      if (typeof meta.maxQty !== "number") meta.maxQty = 100;
      if (typeof meta.qty !== "number") meta.qty = 10;
    }
    units.set(id, {
      id,
      kind,
      name,
      category,
      status: "ACTIVE",
      metadata: meta,
    });
  };

  const addIdentifier = (value, unitId, status = "TAGGED", type = "RFID") => {
    identifiers.set(value, { value, unitId, status, type, updated_at: new Date().toISOString() });
  };

  addUnit("CTB-0001", "CTB", "CTB Standard", "Container");
  addUnit("CTB-0002", "CTB", "CTB Nested", "Container");
  addUnit("CTB-0044", "CTB", "CTB Payload", "Container");
  addUnit("BOB-FOOD-01", "Bob", "Food Bob", "Food");
  addUnit("MEAL-0001", "Meal", "Pasta Primavera", "Food", { type: "Vegetarian", calories: 650, expiry: "2026-08-01" });
  addUnit("MEAL-0002", "Meal", "Veggie Curry", "Food", { type: "Vegetarian", calories: 630, expiry: "2026-08-06" });
  addUnit("BLOB-0001", "Blob", "Meals x4 (Day 1)", "Food");
  addUnit("CTB-001", "CTB", "0.05 CTB — Day 1 Meals", "Container");
  addUnit("CTB-002", "CTB", "0.05 CTB — Day 2 Meals", "Container");
  addUnit("CTB-010", "CTB", "0.03 CTB — Med tote A", "Container");
  addUnit("CTB-020", "CTB", "0.02 CTB — Lab crate", "Container");
  addUnit("CTB-SUP-007", "CTB", "CTB Supply 007", "Container");
  addUnit("CTB-Meal-015", "CTB", "CTB Meal 015", "Container");
  addUnit("MED-0001", "Med", "Trauma Kit", "Medical");
  addUnit("MED-0002", "Med", "Gauze Pack (sterile)", "Medical");
  addUnit("LAB-0001", "Lab", "Sensor Module", "Lab");
  addUnit("LAB-0002", "Lab", "Harness Cable", "Lab");
  addUnit("HYG-0001", "Hygiene", "Potable Water (1L)", "Hygiene");
  addUnit("HYG-0002", "Hygiene", "Hand Sanitizer", "Hygiene");
  addUnit("PKG-LAB-01", "Package", "Lab Pack", "Lab");
  addUnit("ITEM-LAB-01", "Item", "Experiment Kit", "Lab");
  addUnit("ITEM-MED-01", "Item", "Med Kit", "Med");
  addUnit("IRR-001", "Irregular", "Oversize Panel", "Irregular");
  addUnit("ITEM-0142", "Item", "Protein Bar (Vanilla)", "Food", { homeLocation: "S1D3L8/CTB-FOOD-07/BOB-DAY12/ITEM-0142" });
  addUnit("ITEM-0311", "Item", "Multitool", "Tools", { homeLocation: "S2D1L15/CTB-TOOLS-02/CTB-HAND-01/ITEM-0311" });
  addUnit("ITEM-0904", "Item", "Cable (USB-C, 1m)", "Electrical", { homeLocation: "S3D2L4/CTB-ELEC-01/CTB-CABLE-03/ITEM-0904" });
  addUnit("ITEM-1007", "Item", "Notebook", "Misc", { homeLocation: "IRAL8L12" });
  addUnit("ITEM-2048", "Item", "Medical Tape", "Medical", { homeLocation: "S1D4L13/CTB-MED-03/CTB-WOUND-02/ITEM-2048" });
  addUnit("ITEM-0081", "Item", "Protein Bar", "Waste", { trashType: "WET" });
  addUnit("ITEM-0144", "Item", "Gloves (nitrile)", "Waste", { trashType: "DRY" });
  addUnit("ITEM-0207", "Item", "Lab Vial", "Waste", { trashType: "SHARP" });
  addUnit("ITEM-0330", "Item", "Solvent Wipe", "Waste", { trashType: "CHEM" });
  addUnit("ITEM-0412", "Item", "Packaging Film", "Waste", { trashType: "REC" });
  addUnit("CTB-030", "CTB", "CTB Tooling 030", "Container");
  addUnit("CTB-031", "CTB", "CTB Tooling 031", "Container");
  addUnit("CTB-032", "CTB", "CTB Tooling 032", "Container");
  addUnit("CTB-040", "CTB", "CTB Hygiene 040", "Container");
  addUnit("CTB-041", "CTB", "CTB Hygiene 041", "Container");
  addUnit("ITEM-1101", "Item", "Soldering Kit", "Tools", { homeLocation: "S2D2L6/CTB-030/ITEM-1101" });
  addUnit("ITEM-1102", "Item", "Torque Wrench", "Tools", { homeLocation: "S2D2L7/CTB-030/ITEM-1102" });
  addUnit("ITEM-1103", "Item", "Wire Strippers", "Tools", { homeLocation: "S2D2L8/CTB-031/ITEM-1103" });
  addUnit("ITEM-2101", "Item", "Water Filter", "Hygiene", { homeLocation: "S1D3L2/CTB-040/ITEM-2101" });
  addUnit("ITEM-2102", "Item", "Disinfectant Wipes", "Hygiene", { homeLocation: "S1D3L3/CTB-040/ITEM-2102" });
  addUnit("ITEM-3101", "Item", "Patch Kit", "Repair", { homeLocation: "S3D1L4/CTB-032/ITEM-3101" });
  addUnit("ITEM-3102", "Item", "Sealant Tube", "Repair", { homeLocation: "S3D1L5/CTB-032/ITEM-3102" });

  addIdentifier("CTB-0001", "CTB-0001", "TAGGED");
  addIdentifier("BOB-FOOD-01", "BOB-FOOD-01", "TAGGED");
  addIdentifier("MEAL-0001", "MEAL-0001", "TAGGED");
  addIdentifier("IRR-001", "IRR-001", "NEEDS_VERIFY");
  addIdentifier("RFID-7F3A-0142", "ITEM-0142", "TAGGED");
  addIdentifier("RFID-2C1D-0311", "ITEM-0311", "TAGGED");
  addIdentifier("RFID-99AA-0904", "ITEM-0904", "TAGGED");
  addIdentifier("RFID-0B77-1007", "ITEM-1007", "TAGGED");
  addIdentifier("RFID-6D20-2048", "ITEM-2048", "TAGGED");
  addIdentifier("RFID-0081", "ITEM-0081", "TAGGED");
  addIdentifier("RFID-0144", "ITEM-0144", "TAGGED");
  addIdentifier("RFID-0207", "ITEM-0207", "TAGGED");
  addIdentifier("RFID-0330", "ITEM-0330", "TAGGED");
  addIdentifier("RFID-0412", "ITEM-0412", "TAGGED");
  addIdentifier("RFID-BLOB-0001", "BLOB-0001", "NEEDS_VERIFY");
  addIdentifier("RFID-MED-0002", "MED-0002", "NEEDS_VERIFY");

  const mappedItemIds = [
    "0003138947",
    "0003084076",
    "0003139575",
    "0003038450",
    "0003128176",
    "0003082313",
    "0003140629",
    "0013737098",
    "0002870955",
    "0013680655",
    "0013697581",
    "0013800542",
    "0013799976",
    "0013828338",
    "0013745255",
    "0003106029",
    "0003027875",
    "0003041362",
    "0003114390",
    "0003063286",
    "0003094604",
    "0003091798",
    "0003033083",
    "0003056867",
    "0003123469",
    "0002965516",
    "0002994945",
    "0003091849",
    "0003124054",
    "0003013703",
    "0003027858",
    "0003072641",
    "0002997035",
    "0003086175",
    "0003141806",
    "0003075165",
    "0002933646",
    "0002916951",
    "0002842169",
    "0002946486",
    "0002925567",
    "0013695997",
    "0002901004",
    "0013718646",
    "0013649759",
    "0013790353",
    "0013820524",
    "0013681328",
    "0013754352",
    "0013708649",
    "0013690115",
    "0003142038",
    "0003110429",
    "0003062298",
    "0003064618",
    "0013717692",
    "0003068224",
    "0003097484",
    "0003118028",
    "0003135890",
    "0003123356",
    "0003003802",
    "0003042597",
    "0003087690",
    "0003033387",
    "0003103047",
    "0013802138",
    "0013660696",
    "0013736682",
    "0003031326",
    "0003018976",
    "0002976747",
    "0003141637",
    "0013764071",
    "0013716209",
    "0003065212",
    "0002990302",
    "0003014257",
    "0003091863",
    "0003146794",
    "0003056124",
    "0013966892",
    "0005596154",
    "0013708865",
    "0013720002",
    "0013817115",
    "0013732580",
    "0013759143",
    "0013770795",
    "0013689309",
    "0013729662",
    "0013674717",
    "0005596139",
    "0013751699",
    "0003100581",
    "0013676340",
    "0013681406",
    "0013763240",
    "0013683194",
  ];

  const mappedSet = new Set(mappedItemIds);
  for (const id of mappedSet) {
    const unitId = id.startsWith("ITEM-") ? id : `ITEM-${id}`;
    if (!units.has(unitId)) {
      addUnit(unitId, "Item", id, "Mapped", { homeLocation: "" });
    }
    if (!identifiers.has(id)) {
      addIdentifier(id, unitId, "TAGGED");
    }
  }

  // Ensure every unit has a default mapped identifier
  for (const unit of units.values()) {
    if (!identifiers.has(unit.id)) {
      addIdentifier(unit.id, unit.id, "TAGGED");
    }
  }

  const shipments = [
    {
      id: "SHIP-8841",
      code: "SHIP-8841",
      vendor: "Meals Vendor",
      status: "in-progress",
      expected: 48,
      counted: 36,
      items: [
        { id: "MEAL-PASTA-PRIM", sku: "MEAL-PASTA-PRIM", name: "Pasta Primavera", expected: 18, counted: 12, status: "in-progress" },
        { id: "MEAL-CURRY-VEG", sku: "MEAL-CURRY-VEG", name: "Veggie Curry", expected: 18, counted: 18, status: "done" },
        { id: "MEAL-OAT-BFST", sku: "MEAL-OAT-BFST", name: "Oatmeal Breakfast", expected: 12, counted: 6, status: "in-progress" },
      ],
    },
    {
      id: "SHIP-8910",
      code: "SHIP-8910",
      vendor: "Med Supply",
      status: "discrepancy",
      expected: 40,
      counted: 38,
      items: [
        { id: "MED-TRAUMA-KIT", sku: "MED-TRAUMA-KIT", name: "Trauma Kit", expected: 4, counted: 4, status: "done" },
        { id: "MED-GAUZE-PACK", sku: "MED-GAUZE-PACK", name: "Gauze Pack (sterile)", expected: 10, counted: 8, status: "in-progress" },
        { id: "MED-NITRILE-M", sku: "MED-NITRILE-M", name: "Nitrile Gloves (M)", expected: 6, counted: 6, status: "done" },
        { id: "MED-ALC-WIPES", sku: "MED-ALC-WIPES", name: "Alcohol Wipes", expected: 20, counted: 20, status: "done" },
      ],
    },
    {
      id: "SHIP-8932",
      code: "SHIP-8932",
      vendor: "Lab Equipment",
      status: "complete",
      expected: 31,
      counted: 31,
      items: [
        { id: "LAB-SENSOR-MOD", sku: "LAB-SENSOR-MOD", name: "Sensor Module", expected: 4, counted: 4, status: "done" },
        { id: "LAB-HARNESS-CBL", sku: "LAB-HARNESS-CBL", name: "Harness Cable", expected: 2, counted: 2, status: "done" },
        { id: "LAB-ESD-BAGS", sku: "LAB-ESD-BAGS", name: "ESD Bags", expected: 25, counted: 25, status: "done" },
      ],
    },
    {
      id: "SHIP-8999",
      code: "SHIP-8999",
      vendor: "Hygiene + Water",
      status: "waiting",
      expected: 48,
      counted: 0,
      items: [
        { id: "HYG-WATER-1L", sku: "HYG-WATER-1L", name: "Potable Water (1L)", expected: 24, counted: 0, status: "pending" },
        { id: "HYG-SANITIZER", sku: "HYG-SANITIZER", name: "Hand Sanitizer", expected: 6, counted: 0, status: "pending" },
        { id: "HYG-WIPES", sku: "HYG-WIPES", name: "Surface Wipes", expected: 10, counted: 0, status: "pending" },
        { id: "HYG-TPACK", sku: "HYG-TPACK", name: "Toiletry Pack", expected: 8, counted: 0, status: "pending" },
      ],
    },
    {
      id: "SHIP-9050",
      code: "SHIP-9050",
      vendor: "Spare Parts (Paperwork only)",
      status: "waiting",
      expected: 0,
      counted: 0,
      items: [],
    },
  ];

  const containers = [
    { id: "CTB-001", code: "CTB-001", capacity: 12, items: ["MEAL-0001", "MEAL-0002"] },
    { id: "CTB-002", code: "CTB-002", capacity: 12, items: [] },
    { id: "CTB-010", code: "CTB-010", capacity: 8, items: ["MED-0001", "MED-0002"] },
    { id: "CTB-020", code: "CTB-020", capacity: 8, items: ["LAB-0001", "LAB-0002"] },
    { id: "CTB-SUP-007", code: "CTB-SUP-007", capacity: 10, items: [] },
    { id: "CTB-Meal-015", code: "CTB-Meal-015", capacity: 10, items: [] },
    { id: "CTB-030", code: "CTB-030", capacity: 10, items: ["ITEM-1101", "ITEM-1102"] },
    { id: "CTB-031", code: "CTB-031", capacity: 10, items: ["ITEM-1103"] },
    { id: "CTB-032", code: "CTB-032", capacity: 10, items: ["ITEM-3101", "ITEM-3102"] },
    { id: "CTB-040", code: "CTB-040", capacity: 10, items: ["ITEM-2101", "ITEM-2102"] },
    { id: "CTB-041", code: "CTB-041", capacity: 10, items: [] },
  ];

  const stowLocations = [];
  const shelves = ["S1", "S2", "S3"];
  const depths = ["D1", "D2", "D3", "D4"];
  const levels = Array.from({ length: 12 }, (_, i) => `L${i + 1}`);
  let index = 0;
  for (const shelf of shelves) {
    for (const depth of depths) {
      for (const level of levels) {
        const status = index % 9 === 0 ? "reserved" : index % 3 === 0 ? "occupied" : "empty";
        stowLocations.push({ id: `${shelf}${depth}${level}`, shelf, depth, level, status });
        index += 1;
      }
    }
  }

  const stowIds = stowLocations.map((loc) => loc.id);
  const hash = (s) =>
    String(s)
      .split("")
      .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);

  for (const unit of units.values()) {
    const meta = unit.metadata ?? {};
    const home = String(meta.homeLocation || "").trim();
    const top = home ? home.split("/")[0] : "";
    if (top) {
      meta.location = top;
    } else if (!meta.location && stowIds.length) {
      const idx = hash(unit.id) % stowIds.length;
      meta.location = stowIds[idx];
    }
    unit.metadata = meta;
  }

  return {
    units,
    identifiers,
    events,
    badges,
    shipments,
    containers,
    stowLocations,
  };
}

const memory = USE_MEMORY ? createMemoryStore() : null;

function memFindUnitByScan(raw) {
  if (!memory) return null;
  const value = normalizeUnitId(raw);
  const byIdentifier = memory.identifiers.get(value);
  if (byIdentifier) {
    const unit = memory.units.get(byIdentifier.unitId);
    if (unit) return { unit, tagId: byIdentifier.value };
  }
  const direct = memory.units.get(value);
  if (direct) return { unit: direct, tagId: value };
  return null;
}

function memEnsureUnitForScan(raw) {
  if (!memory) return null;
  const existing = memFindUnitByScan(raw);
  if (existing) return existing;
  const base = normalizeUnitId(raw);
  const unitId = base.startsWith("ITEM-") ? base : `ITEM-${base}`;
  if (!memory.units.has(unitId)) {
    memory.units.set(unitId, {
      id: unitId,
      kind: "Item",
      name: "Unmapped item",
      category: "Unknown",
      status: "ACTIVE",
      metadata: { homeLocation: "", trashType: "", qty: 10, maxQty: 100 },
    });
  }
  memory.identifiers.set(base, { value: base, unitId, status: "NEEDS_VERIFY", type: "RFID", updated_at: new Date().toISOString() });
  return { unit: memory.units.get(unitId), tagId: base };
}

function memTagItems() {
  if (!memory) return [];
  const items = [];
  for (const unit of memory.units.values()) {
    let status = "untagged";
    let latest = null;
    for (const ident of memory.identifiers.values()) {
      if (ident.unitId === unit.id) {
        latest = ident;
      }
    }
    if (latest?.status === "NEEDS_VERIFY") status = "needs-verify";
    else if (latest?.status === "TAGGED") status = "tagged";
    const meta = unit.metadata ?? {};
    items.push({
      id: unit.id,
      code: unit.id,
      name: unit.name ?? unit.id,
      status,
      location: meta.location ?? meta.homeLocation ?? "",
    });
  }
  return items.sort((a, b) => a.id.localeCompare(b.id));
}

function buildLocationId(shelf, depth, slot) {
  return `${normalizeShelf(shelf)}-D${Number(depth)}-${normalizeSlot(slot)}`;
}

function slotNumber(slot) {
  const n = Number(String(slot).replace(/[^0-9]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function buildSlotKey(shelf, slot) {
  return `${normalizeShelf(shelf)}-${normalizeSlot(slot)}`;
}

function buildSlotCode(shelf, depth, slot) {
  const s = normalizeShelf(shelf);
  const d = Number(depth);
  const slotNum = slotNumber(slot);
  if (!s || !d || !slotNum) return "";
  return `${s}D${d}L${slotNum}`;
}

async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await fn(client);
    await client.query("COMMIT");
    return res;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function ensureInventorySchema() {
  await q(`CREATE SCHEMA IF NOT EXISTS ${INV_SCHEMA};`);
  await q(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      sku text NOT NULL UNIQUE,
      name text NOT NULL,
      description text,
      safety_stock integer,
      reorder_point integer,
      status text NOT NULL DEFAULT 'OK',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.locations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE,
      description text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.stocks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      item_id uuid NOT NULL REFERENCES ${INV_SCHEMA}.items(id) ON DELETE CASCADE,
      location_id uuid NOT NULL REFERENCES ${INV_SCHEMA}.locations(id) ON DELETE CASCADE,
      qty integer NOT NULL DEFAULT 0,
      expires_at date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (item_id, location_id, expires_at)
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp timestamptz NOT NULL DEFAULT now(),
      item_id uuid NOT NULL REFERENCES ${INV_SCHEMA}.items(id) ON DELETE CASCADE,
      location_id uuid NOT NULL REFERENCES ${INV_SCHEMA}.locations(id) ON DELETE CASCADE,
      mode text NOT NULL CHECK (mode IN ('IN','OUT')),
      qty integer NOT NULL,
      actor text,
      reason text,
      work_order text
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.rfid_mappings (
      card_hex text PRIMARY KEY,
      item_id uuid NOT NULL REFERENCES ${INV_SCHEMA}.items(id) ON DELETE CASCADE,
      last_location_id uuid REFERENCES ${INV_SCHEMA}.locations(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT 'TAGGED',
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.rfid_unknown (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp timestamptz NOT NULL DEFAULT now(),
      card_hex text NOT NULL,
      mode text NOT NULL CHECK (mode IN ('IN','OUT')),
      qty integer NOT NULL DEFAULT 1,
      actor text NOT NULL DEFAULT 'unknown',
      location_id uuid REFERENCES ${INV_SCHEMA}.locations(id) ON DELETE SET NULL,
      error text NOT NULL DEFAULT 'CARD_NOT_MAPPED'
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.shipments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE,
      vendor text NOT NULL,
      status text NOT NULL,
      expected integer NOT NULL DEFAULT 0,
      counted integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.shipment_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      shipment_id uuid NOT NULL REFERENCES ${INV_SCHEMA}.shipments(id) ON DELETE CASCADE,
      sku text NOT NULL,
      name text NOT NULL,
      expected integer NOT NULL DEFAULT 0,
      counted integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'pending'
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.containers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE,
      capacity integer NOT NULL DEFAULT 0,
      used integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.container_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      container_id uuid NOT NULL REFERENCES ${INV_SCHEMA}.containers(id) ON DELETE CASCADE,
      item_sku text NOT NULL,
      item_name text
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.moves (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      from_container text,
      to_container text,
      reason text,
      source_context text,
      dest_context text,
      status text NOT NULL DEFAULT 'COMPLETED',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${INV_SCHEMA}.stow_locations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE,
      shelf text NOT NULL,
      depth text NOT NULL,
      level text NOT NULL,
      status text NOT NULL DEFAULT 'empty',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function seedInventoryData() {
  const { rows: itemCountRows } = await q(`SELECT COUNT(*)::int AS count FROM ${INV_SCHEMA}.items`);
  if (itemCountRows[0]?.count > 0) return;

  const seedItems = [
    { sku: "CO2-FLTR-A", name: "CO₂ Scrubber Cartridge – Type A", description: "Life-support CO₂ removal cartridge", safety: 4, reorder: 8 },
    { sku: "PWR-CKT-12V", name: "12 V Power Converter Board", description: "DC step-down module for avionics panel", safety: 2, reorder: 5 },
    { sku: "MED-SEALKIT", name: "Emergency Seal Kit", description: "Adhesive patch kit for minor pressure leaks", safety: 1, reorder: 3 },
    { sku: "MEAL-0001", name: "Meal • Pasta Primavera", description: "Prepared meal", safety: 10, reorder: 5 },
    { sku: "MEAL-0002", name: "Meal • Veggie Curry", description: "Prepared meal", safety: 10, reorder: 5 },
    { sku: "BLOB-0001", name: "Blob • Modular (Pan 1)", description: "CTB blob unit", safety: 2, reorder: 1 },
    { sku: "MEAL-PASTA-PRIM", name: "Pasta Primavera", description: "Prepared meal", safety: 10, reorder: 5 },
    { sku: "MEAL-CURRY-VEG", name: "Veggie Curry", description: "Prepared meal", safety: 10, reorder: 5 },
    { sku: "MEAL-OAT-BFST", name: "Oatmeal Breakfast", description: "Prepared meal", safety: 10, reorder: 5 },
  ];

  for (const it of seedItems) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.items (sku, name, description, safety_stock, reorder_point, status)
       VALUES ($1,$2,$3,$4,$5,'OK')
       ON CONFLICT (sku) DO NOTHING;`,
      [it.sku, it.name, it.description, it.safety, it.reorder]
    );
  }

  const seedLocations = [
    { code: "AIRLOCK", description: "Airlock Locker A" },
    { code: "BAY-A", description: "Equipment Bay A" },
    { code: "MED", description: "Medical / Trauma" },
  ];
  for (const loc of seedLocations) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.locations (code, description)
       VALUES ($1,$2)
       ON CONFLICT (code) DO NOTHING;`,
      [loc.code, loc.description]
    );
  }

  const { rows: itemRows } = await q(`SELECT id, sku FROM ${INV_SCHEMA}.items`);
  const { rows: locRows } = await q(`SELECT id, code FROM ${INV_SCHEMA}.locations`);
  const itemBySku = new Map(itemRows.map((r) => [r.sku, r.id]));
  const locByCode = new Map(locRows.map((r) => [r.code, r.id]));

  const seedStocks = [
    { sku: "CO2-FLTR-A", loc: "AIRLOCK", qty: 6, expires: "2025-12-01" },
    { sku: "CO2-FLTR-A", loc: "BAY-A", qty: 4, expires: "2025-12-01" },
    { sku: "PWR-CKT-12V", loc: "BAY-A", qty: 3 },
    { sku: "MED-SEALKIT", loc: "MED", qty: 2, expires: "2025-11-10" },
  ];
  for (const st of seedStocks) {
    const itemId = itemBySku.get(st.sku);
    const locId = locByCode.get(st.loc);
    if (!itemId || !locId) continue;
    await q(
      `INSERT INTO ${INV_SCHEMA}.stocks (item_id, location_id, qty, expires_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (item_id, location_id, expires_at) DO UPDATE SET qty = EXCLUDED.qty;`,
      [itemId, locId, st.qty, st.expires ?? null]
    );
  }

  const seedShipments = [
    { code: "SHIP-8841", vendor: "Meals Vendor", status: "in-progress", expected: 48, counted: 36 },
    { code: "SHIP-8910", vendor: "Med Supply", status: "discrepancy", expected: 40, counted: 38 },
    { code: "SHIP-8932", vendor: "Lab Equipment", status: "in-progress", expected: 31, counted: 31 },
    { code: "SHIP-8999", vendor: "Hygiene + Water", status: "waiting", expected: 48, counted: 0 },
    { code: "SHIP-9050", vendor: "Spare Parts (Paperwork only)", status: "waiting", expected: 0, counted: 0 },
  ];

  for (const sh of seedShipments) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.shipments (code, vendor, status, expected, counted)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (code) DO NOTHING;`,
      [sh.code, sh.vendor, sh.status, sh.expected, sh.counted]
    );
  }

  const { rows: shipmentRows } = await q(`SELECT id, code FROM ${INV_SCHEMA}.shipments`);
  const shipByCode = new Map(shipmentRows.map((r) => [r.code, r.id]));

  const shipmentItems = [
    { ship: "SHIP-8841", sku: "MEAL-PASTA-PRIM", name: "Pasta Primavera", expected: 18, counted: 12, status: "in-progress" },
    { ship: "SHIP-8841", sku: "MEAL-CURRY-VEG", name: "Veggie Curry", expected: 18, counted: 18, status: "done" },
    { ship: "SHIP-8841", sku: "MEAL-OAT-BFST", name: "Oatmeal Breakfast", expected: 12, counted: 6, status: "in-progress" },
  ];

  for (const it of shipmentItems) {
    const shipmentId = shipByCode.get(it.ship);
    if (!shipmentId) continue;
    await q(
      `INSERT INTO ${INV_SCHEMA}.shipment_items (shipment_id, sku, name, expected, counted, status)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING;`,
      [shipmentId, it.sku, it.name, it.expected, it.counted, it.status]
    );
  }

  const seedContainers = [
    { code: "CTB-0001/CTB-0002", capacity: 100, used: 0 },
    { code: "CTB-0003/CTB-0004", capacity: 100, used: 35 },
  ];

  for (const c of seedContainers) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.containers (code, capacity, used)
       VALUES ($1,$2,$3)
       ON CONFLICT (code) DO NOTHING;`,
      [c.code, c.capacity, c.used]
    );
  }

  const { rows: containerRows } = await q(`SELECT id, code FROM ${INV_SCHEMA}.containers`);
  const containerByCode = new Map(containerRows.map((r) => [r.code, r.id]));
  const containerItems = [
    { code: "CTB-0003/CTB-0004", sku: "MEAL-0001", name: "Meal • Pasta Primavera" },
    { code: "CTB-0003/CTB-0004", sku: "MEAL-0002", name: "Meal • Veggie Curry" },
  ];
  for (const ci of containerItems) {
    const cid = containerByCode.get(ci.code);
    if (!cid) continue;
    await q(
      `INSERT INTO ${INV_SCHEMA}.container_items (container_id, item_sku, item_name)
       VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING;`,
      [cid, ci.sku, ci.name]
    );
  }

  const stowLocations = [
    { code: "S1-D1-L1", shelf: "S1", depth: "D1", level: "L1", status: "occupied" },
    { code: "S1-D1-L2", shelf: "S1", depth: "D1", level: "L2", status: "occupied" },
    { code: "S1-D1-L3", shelf: "S1", depth: "D1", level: "L3", status: "occupied" },
    { code: "S1-D1-L4", shelf: "S1", depth: "D1", level: "L4", status: "reserved" },
    { code: "S1-D2-L1", shelf: "S1", depth: "D2", level: "L1", status: "empty" },
    { code: "S1-D2-L2", shelf: "S1", depth: "D2", level: "L2", status: "empty" },
    { code: "S1-D2-L3", shelf: "S1", depth: "D2", level: "L3", status: "empty" },
    { code: "S1-D2-L4", shelf: "S1", depth: "D2", level: "L4", status: "empty" },
    { code: "S1-D3-L1", shelf: "S1", depth: "D3", level: "L1", status: "occupied" },
    { code: "S1-D3-L2", shelf: "S1", depth: "D3", level: "L2", status: "empty" },
    { code: "S1-D3-L3", shelf: "S1", depth: "D3", level: "L3", status: "reserved" },
    { code: "S1-D3-L4", shelf: "S1", depth: "D3", level: "L4", status: "empty" },
    { code: "S1-D4-L1", shelf: "S1", depth: "D4", level: "L1", status: "empty" },
    { code: "S1-D4-L2", shelf: "S1", depth: "D4", level: "L2", status: "occupied" },
    { code: "S1-D4-L3", shelf: "S1", depth: "D4", level: "L3", status: "empty" },
    { code: "S1-D4-L4", shelf: "S1", depth: "D4", level: "L4", status: "empty" },
  ];

  for (const loc of stowLocations) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.stow_locations (code, shelf, depth, level, status)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (code) DO NOTHING;`,
      [loc.code, loc.shelf, loc.depth, loc.level, loc.status]
    );
  }

  const itemIdMeal1 = itemBySku.get("MEAL-0001");
  const itemIdMeal2 = itemBySku.get("MEAL-0002");
  const itemIdBlob = itemBySku.get("BLOB-0001");
  const defaultLoc = locRows[0]?.id ?? null;
  if (itemIdMeal1) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.rfid_mappings (card_hex, item_id, last_location_id, status)
       VALUES ($1,$2,$3,'TAGGED')
       ON CONFLICT (card_hex) DO NOTHING;`,
      [normalizeHex("3D00D51E2C"), itemIdMeal1, defaultLoc]
    );
  }
  if (itemIdMeal2) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.rfid_mappings (card_hex, item_id, last_location_id, status)
       VALUES ($1,$2,$3,'NEEDS_VERIFY')
       ON CONFLICT (card_hex) DO NOTHING;`,
      [normalizeHex("3D00D51E2D"), itemIdMeal2, defaultLoc]
    );
  }
  if (itemIdBlob) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.rfid_mappings (card_hex, item_id, last_location_id, status)
       VALUES ($1,$2,$3,'TAGGED')
       ON CONFLICT (card_hex) DO NOTHING;`,
      [normalizeHex("3D00D51E2E"), itemIdBlob, defaultLoc]
    );
  }
}

// ===================== DSLM schema (authoritative) =====================
async function ensureDlsmSchema() {
  await q(`CREATE SCHEMA IF NOT EXISTS ${DSLM_SCHEMA};`);
  await q(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.badges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      badge_value text NOT NULL UNIQUE,
      actor text NOT NULL,
      ui_mode text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.units (
      id text PRIMARY KEY,
      kind text NOT NULL,
      name text,
      category text,
      status text,
      metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.unit_identifiers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL,
      value text NOT NULL UNIQUE,
      status text NOT NULL DEFAULT 'NEEDS_VERIFY',
      unit_id text NOT NULL REFERENCES ${DSLM_SCHEMA}.units(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.containment_edges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id text NOT NULL REFERENCES ${DSLM_SCHEMA}.units(id) ON DELETE CASCADE,
      child_id text NOT NULL REFERENCES ${DSLM_SCHEMA}.units(id) ON DELETE CASCADE,
      added_at timestamptz NOT NULL DEFAULT now(),
      removed_at timestamptz,
      added_by text
    );
  `);

  await q(`
    CREATE UNIQUE INDEX IF NOT EXISTS dlsm_containment_child_active
    ON ${DSLM_SCHEMA}.containment_edges (child_id)
    WHERE removed_at IS NULL;
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.locations (
      id text PRIMARY KEY,
      shelf text NOT NULL,
      depth integer NOT NULL,
      slot text NOT NULL,
      row integer NOT NULL,
      col integer NOT NULL,
      UNIQUE (shelf, depth, slot)
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.reservations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      location_id text NOT NULL REFERENCES ${DSLM_SCHEMA}.locations(id) ON DELETE CASCADE,
      reason text,
      created_by text,
      expires_at timestamptz,
      released_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.location_state (
      location_id text PRIMARY KEY REFERENCES ${DSLM_SCHEMA}.locations(id) ON DELETE CASCADE,
      state text NOT NULL DEFAULT 'empty',
      label text,
      occupied_unit_id text REFERENCES ${DSLM_SCHEMA}.units(id) ON DELETE SET NULL,
      reservation_id uuid REFERENCES ${DSLM_SCHEMA}.reservations(id) ON DELETE SET NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.shipments (
      id text PRIMARY KEY,
      supplier text NOT NULL,
      status text NOT NULL,
      processed_at timestamptz,
      metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.shipment_lines (
      shipment_id text NOT NULL REFERENCES ${DSLM_SCHEMA}.shipments(id) ON DELETE CASCADE,
      sku text NOT NULL,
      name text NOT NULL,
      expected_qty integer NOT NULL DEFAULT 0,
      counted_qty integer NOT NULL DEFAULT 0,
      issue_flag boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (shipment_id, sku)
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL,
      actor_id text,
      entity_type text,
      entity_id text,
      payload jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.moves (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id text REFERENCES ${DSLM_SCHEMA}.units(id) ON DELETE SET NULL,
      from_path text,
      to_path text,
      reason text,
      executed_at timestamptz NOT NULL DEFAULT now(),
      executed_by text,
      result jsonb
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS ${DSLM_SCHEMA}.irregular_footprints (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id text NOT NULL REFERENCES ${DSLM_SCHEMA}.units(id) ON DELETE CASCADE,
      shelf text NOT NULL,
      slot_ids text[] NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function seedDlsmData() {
  const { rows: unitCountRows } = await q(`SELECT COUNT(*)::int AS count FROM ${DSLM_SCHEMA}.units;`);
  if (unitCountRows[0]?.count > 0) return;

  const seedUnits = [
    { id: "CTB-0001", kind: "CTB", name: "CTB Standard", category: "Container" },
    { id: "CTB-0002", kind: "CTB", name: "CTB Nested", category: "Container" },
    { id: "CTB-0044", kind: "CTB", name: "CTB Payload", category: "Container" },
    { id: "BOB-FOOD-01", kind: "Bob", name: "Food Bob", category: "Food" },
    { id: "MEAL-0001", kind: "Meal", name: "Pasta Primavera", category: "Food", metadata: { type: "Vegetarian", calories: 650, expiry: "2026-08-01" } },
    { id: "MEAL-0002", kind: "Meal", name: "Veggie Curry", category: "Food", metadata: { type: "Vegetarian", calories: 630, expiry: "2026-08-06" } },
    { id: "PKG-LAB-01", kind: "Package", name: "Lab Pack", category: "Lab" },
    { id: "ITEM-LAB-01", kind: "Item", name: "Experiment Kit", category: "Lab" },
    { id: "ITEM-MED-01", kind: "Item", name: "Med Kit", category: "Med" },
    { id: "IRR-001", kind: "Irregular", name: "Oversize Panel", category: "Irregular" },
    { id: "ITEM-0142", kind: "Item", name: "Protein Bar (Vanilla)", category: "Food", metadata: { homeLocation: "S1D3L8/CTB-FOOD-07/BOB-DAY12/ITEM-0142" } },
    { id: "ITEM-0311", kind: "Item", name: "Multitool", category: "Tools", metadata: { homeLocation: "S2D1L15/CTB-TOOLS-02/CTB-HAND-01/ITEM-0311" } },
    { id: "ITEM-0904", kind: "Item", name: "Cable (USB-C, 1m)", category: "Electrical", metadata: { homeLocation: "S3D2L4/CTB-ELEC-01/CTB-CABLE-03/ITEM-0904" } },
    { id: "ITEM-1007", kind: "Item", name: "Notebook", category: "Misc", metadata: { homeLocation: "IRAL8L12" } },
    { id: "ITEM-2048", kind: "Item", name: "Medical Tape", category: "Medical", metadata: { homeLocation: "S1D4L13/CTB-MED-03/CTB-WOUND-02/ITEM-2048" } },
    { id: "ITEM-0081", kind: "Item", name: "Protein Bar", category: "Waste", metadata: { trashType: "WET" } },
    { id: "ITEM-0144", kind: "Item", name: "Gloves (nitrile)", category: "Waste", metadata: { trashType: "DRY" } },
    { id: "ITEM-0207", kind: "Item", name: "Lab Vial", category: "Waste", metadata: { trashType: "SHARP" } },
    { id: "ITEM-0330", kind: "Item", name: "Solvent Wipe", category: "Waste", metadata: { trashType: "CHEM" } },
    { id: "ITEM-0412", kind: "Item", name: "Packaging Film", category: "Waste", metadata: { trashType: "REC" } },
  ];

  for (const u of seedUnits) {
    await q(
      `INSERT INTO ${DSLM_SCHEMA}.units (id, kind, name, category, status, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING;`,
      [u.id, u.kind, u.name ?? null, u.category ?? null, "ACTIVE", u.metadata ? JSON.stringify(u.metadata) : null]
    );
  }

  await q(
    `INSERT INTO ${DSLM_SCHEMA}.unit_identifiers (type, value, status, unit_id)
     VALUES
     ('RFID', 'CTB-0001', 'TAGGED', 'CTB-0001'),
     ('RFID', 'BOB-FOOD-01', 'TAGGED', 'BOB-FOOD-01'),
     ('RFID', 'MEAL-0001', 'TAGGED', 'MEAL-0001'),
      ('RFID', 'IRR-001', 'NEEDS_VERIFY', 'IRR-001'),
      ('RFID', 'RFID-7F3A-0142', 'TAGGED', 'ITEM-0142'),
      ('RFID', 'RFID-2C1D-0311', 'TAGGED', 'ITEM-0311'),
      ('RFID', 'RFID-99AA-0904', 'TAGGED', 'ITEM-0904'),
      ('RFID', 'RFID-0B77-1007', 'TAGGED', 'ITEM-1007'),
      ('RFID', 'RFID-6D20-2048', 'TAGGED', 'ITEM-2048'),
      ('RFID', 'RFID-0081', 'TAGGED', 'ITEM-0081'),
      ('RFID', 'RFID-0144', 'TAGGED', 'ITEM-0144'),
      ('RFID', 'RFID-0207', 'TAGGED', 'ITEM-0207'),
      ('RFID', 'RFID-0330', 'TAGGED', 'ITEM-0330'),
      ('RFID', 'RFID-0412', 'TAGGED', 'ITEM-0412')
     ON CONFLICT (value) DO NOTHING;`
  );

  const edges = [
    { parent: "CTB-0001", child: "BOB-FOOD-01" },
    { parent: "BOB-FOOD-01", child: "MEAL-0001" },
    { parent: "BOB-FOOD-01", child: "MEAL-0002" },
  ];
  for (const e of edges) {
    await q(
      `INSERT INTO ${DSLM_SCHEMA}.containment_edges (parent_id, child_id)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING;`,
      [e.parent, e.child]
    );
  }

  const shelves = ["S1", "S2", "S3", "C1", "C2"];
  for (const shelf of shelves) {
    const depths = shelf.startsWith("C") ? [1] : [1, 2, 3, 4];
    for (const depth of depths) {
      for (let i = 1; i <= 16; i += 1) {
        const slot = `L${i}`;
        const row = Math.ceil(i / 4);
        const col = ((i - 1) % 4) + 1;
        const id = buildLocationId(shelf, depth, slot);
        await q(
          `INSERT INTO ${DSLM_SCHEMA}.locations (id, shelf, depth, slot, row, col)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (id) DO NOTHING;`,
          [id, shelf, depth, slot, row, col]
        );
        await q(
          `INSERT INTO ${DSLM_SCHEMA}.location_state (location_id, state)
           VALUES ($1,'empty')
           ON CONFLICT (location_id) DO NOTHING;`,
          [id]
        );
      }
    }
  }

  const occupied = [
    { shelf: "S1", depth: 1, slot: "L3", unit: "CTB-0001" },
    { shelf: "S2", depth: 2, slot: "L2", unit: "CTB-0044" },
  ];
  for (const o of occupied) {
    const id = buildLocationId(o.shelf, o.depth, o.slot);
    await q(
      `UPDATE ${DSLM_SCHEMA}.location_state
       SET state = 'occupied', label = $2, occupied_unit_id = $3, updated_at = now()
       WHERE location_id = $1;`,
      [id, o.unit, o.unit]
    );
  }

  const reserved = [
    { shelf: "S1", depth: 1, slot: "L4", label: "Reserved: CTB" },
    { shelf: "S3", depth: 3, slot: "L8", label: "Reserved" },
  ];
  for (const r of reserved) {
    const id = buildLocationId(r.shelf, r.depth, r.slot);
    await q(
      `UPDATE ${DSLM_SCHEMA}.location_state
       SET state = 'reserved', label = $2, updated_at = now()
       WHERE location_id = $1;`,
      [id, r.label]
    );
  }

  await q(
    `INSERT INTO ${DSLM_SCHEMA}.irregular_footprints (unit_id, shelf, slot_ids)
     VALUES ('IRR-001', 'C1', ARRAY['L1','L2','L5'])
     ON CONFLICT DO NOTHING;`
  );

  const shipments = [
    { id: "SHIP-8841", supplier: "KSC Ground Freight", status: "in-progress", meta: { po: "PO-KSC-ML-8841", carrier: "KSC Ground", dock: "Bay-2", containers: "4", handling: "Cold" } },
    { id: "SHIP-8910", supplier: "Med Supply", status: "discrepancy", meta: { po: "PO-MED-8910", carrier: "Orbital", dock: "Bay-1", containers: "2", handling: "Sterile" } },
  ];
  for (const s of shipments) {
    await q(
      `INSERT INTO ${DSLM_SCHEMA}.shipments (id, supplier, status, metadata)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO NOTHING;`,
      [s.id, s.supplier, s.status, JSON.stringify(s.meta ?? {})]
    );
  }

  const lines = [
    { ship: "SHIP-8841", sku: "MEAL-PASTA-PRIM", name: "Pasta Primavera", expected: 18, counted: 12, issue: false },
    { ship: "SHIP-8841", sku: "MEAL-CURRY-VEG", name: "Veggie Curry", expected: 18, counted: 18, issue: false },
    { ship: "SHIP-8841", sku: "MEAL-OAT-BFST", name: "Oatmeal Breakfast", expected: 12, counted: 6, issue: false },
    { ship: "SHIP-8910", sku: "MED-KIT-ALPHA", name: "Med Kit Alpha", expected: 10, counted: 8, issue: true },
  ];
  for (const l of lines) {
    await q(
      `INSERT INTO ${DSLM_SCHEMA}.shipment_lines (shipment_id, sku, name, expected_qty, counted_qty, issue_flag)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (shipment_id, sku) DO NOTHING;`,
      [l.ship, l.sku, l.name, l.expected, l.counted, l.issue]
    );
  }

  await q(
    `INSERT INTO ${DSLM_SCHEMA}.badges (badge_value, actor, ui_mode)
     VALUES
     ('0003070837', 'crew', 'crew'),
     ('0003104127', 'ground', 'ground'),
     ('0003138947', 'crew', 'crew'),
     ('0003084076', 'crew', 'crew'),
     ('0003139575', 'crew', 'crew'),
     ('0003038450', 'crew', 'crew'),
     ('0003128176', 'crew', 'crew'),
     ('0003082313', 'crew', 'crew'),
     ('0003140629', 'crew', 'crew'),
     ('0013737098', 'crew', 'crew'),
     ('0002870955', 'crew', 'crew'),
     ('0013680655', 'crew', 'crew'),
     ('0013697581', 'crew', 'crew'),
     ('0013800542', 'crew', 'crew'),
     ('0013799976', 'crew', 'crew'),
     ('0013828338', 'crew', 'crew'),
     ('0013745255', 'crew', 'crew'),
     ('0003106029', 'crew', 'crew'),
     ('0003027875', 'crew', 'crew'),
     ('0003041362', 'crew', 'crew'),
     ('0003114390', 'crew', 'crew'),
     ('0003063286', 'crew', 'crew'),
     ('0003094604', 'crew', 'crew'),
     ('0003091798', 'crew', 'crew'),
     ('0003033083', 'crew', 'crew'),
     ('0003056867', 'crew', 'crew'),
     ('0003123469', 'crew', 'crew'),
     ('0002965516', 'crew', 'crew'),
     ('0002994945', 'crew', 'crew'),
     ('0003091849', 'crew', 'crew'),
     ('0003124054', 'crew', 'crew'),
     ('0003013703', 'crew', 'crew'),
     ('0003027858', 'crew', 'crew'),
     ('0003072641', 'crew', 'crew'),
     ('0002997035', 'crew', 'crew'),
     ('0003086175', 'crew', 'crew'),
     ('0003141806', 'crew', 'crew'),
     ('0003075165', 'crew', 'crew'),
     ('0002933646', 'crew', 'crew'),
     ('0002916951', 'crew', 'crew'),
     ('0002842169', 'crew', 'crew'),
     ('0002946486', 'crew', 'crew'),
     ('0002925567', 'crew', 'crew'),
     ('0013695997', 'crew', 'crew'),
     ('0002901004', 'crew', 'crew'),
     ('0013718646', 'crew', 'crew'),
     ('0013649759', 'crew', 'crew'),
     ('0013790353', 'crew', 'crew'),
     ('0013820524', 'crew', 'crew'),
     ('0013681328', 'crew', 'crew'),
     ('0013754352', 'crew', 'crew'),
     ('0013708649', 'crew', 'crew'),
     ('0013690115', 'crew', 'crew'),
     ('0003142038', 'crew', 'crew'),
     ('0003110429', 'crew', 'crew'),
     ('0003062298', 'crew', 'crew'),
     ('0003064618', 'crew', 'crew'),
     ('0013717692', 'crew', 'crew'),
     ('0003068224', 'crew', 'crew'),
     ('0003097484', 'crew', 'crew'),
     ('0003118028', 'crew', 'crew'),
     ('0003135890', 'crew', 'crew'),
     ('0003123356', 'crew', 'crew'),
     ('0003003802', 'crew', 'crew'),
     ('0003042597', 'crew', 'crew'),
     ('0003087690', 'crew', 'crew'),
     ('0003033387', 'crew', 'crew'),
     ('0003103047', 'crew', 'crew'),
     ('0013802138', 'crew', 'crew'),
     ('0013660696', 'crew', 'crew'),
     ('0013736682', 'crew', 'crew'),
     ('0003031326', 'crew', 'crew'),
     ('0003018976', 'crew', 'crew'),
     ('0002976747', 'crew', 'crew'),
     ('0003141637', 'crew', 'crew'),
     ('0013764071', 'crew', 'crew'),
     ('0013716209', 'crew', 'crew'),
     ('0003065212', 'crew', 'crew'),
     ('0002990302', 'crew', 'crew'),
     ('0003014257', 'crew', 'crew'),
     ('0003091863', 'crew', 'crew'),
     ('0003146794', 'crew', 'crew'),
     ('0003056124', 'crew', 'crew'),
     ('0013966892', 'crew', 'crew'),
     ('0005596154', 'crew', 'crew'),
     ('0013708865', 'crew', 'crew'),
     ('0013720002', 'crew', 'crew'),
     ('0013817115', 'crew', 'crew'),
     ('0013732580', 'crew', 'crew'),
     ('0013759143', 'crew', 'crew'),
     ('0013770795', 'crew', 'crew'),
     ('0013689309', 'crew', 'crew'),
     ('0013729662', 'crew', 'crew'),
     ('0013674717', 'crew', 'crew'),
     ('0005596139', 'crew', 'crew'),
     ('0013751699', 'ground', 'ground'),
     ('0003100581', 'crew', 'crew'),
     ('0013676340', 'crew', 'crew'),
     ('0013681406', 'crew', 'crew'),
     ('0013763240', 'crew', 'crew'),
     ('0013683194', 'crew', 'crew')
     ON CONFLICT (badge_value) DO NOTHING;`
  );
}

const CONTAINER_CAPACITY = {
  CTB: 12,
  Bob: 4,
  Package: 8,
};

function isContainerKind(kind) {
  return ["CTB", "Bob", "Package"].includes(kind);
}

async function buildNodesById(client = pool) {
  const { rows: unitRows } = await client.query(
    `SELECT id, kind, name FROM ${DSLM_SCHEMA}.units ORDER BY id;`
  );
  const { rows: edgeRows } = await client.query(
    `SELECT parent_id, child_id FROM ${DSLM_SCHEMA}.containment_edges WHERE removed_at IS NULL;`
  );

  const nodesById = {};
  unitRows.forEach((u) => {
    nodesById[u.id] = { id: u.id, kind: u.kind, name: u.name ?? u.id, parentId: null, childrenIds: [] };
  });

  edgeRows.forEach((e) => {
    if (!nodesById[e.child_id]) return;
    nodesById[e.child_id].parentId = e.parent_id;
    if (nodesById[e.parent_id]) nodesById[e.parent_id].childrenIds.push(e.child_id);
  });

  return nodesById;
}

async function buildStowedByLocation(client = pool) {
  // Resolution rule: slotKey (e.g., S1-L12) maps to the smallest occupied depth (frontmost).
  const { rows } = await client.query(
    `SELECT l.shelf, l.slot, l.depth, ls.occupied_unit_id
     FROM ${DSLM_SCHEMA}.locations l
     JOIN ${DSLM_SCHEMA}.location_state ls ON ls.location_id = l.id
     WHERE ls.state = 'occupied' AND ls.occupied_unit_id IS NOT NULL
     ORDER BY l.shelf, l.slot, l.depth ASC;`
  );

  const mapping = {};
  rows.forEach((r) => {
    const key = buildSlotKey(r.shelf, r.slot);
    if (!mapping[key]) {
      mapping[key] = r.occupied_unit_id;
    }
  });
  return mapping;
}

async function getUnitLocationPath(client, unitId) {
  const nodesById = await buildNodesById(client);
  if (!nodesById[unitId]) return "";

  const chain = [];
  let cursor = unitId;
  while (cursor) {
    chain.unshift(cursor);
    cursor = nodesById[cursor]?.parentId ?? null;
  }

  const rootId = chain[0];
  const { rows: locRows } = await client.query(
    `SELECT l.shelf, l.depth, l.slot
     FROM ${DSLM_SCHEMA}.location_state ls
     JOIN ${DSLM_SCHEMA}.locations l ON l.id = ls.location_id
     WHERE ls.occupied_unit_id = $1
     ORDER BY l.depth ASC
     LIMIT 1;`,
    [rootId]
  );
  if (!locRows[0]) return chain.join("/");
  const loc = locRows[0];
  const slotCode = buildSlotCode(loc.shelf, loc.depth, loc.slot);
  return slotCode ? `${slotCode}/${chain.join("/")}` : chain.join("/");
}

async function buildSlotGrid(client, shelf, depth) {
  const { rows } = await client.query(
    `SELECT l.slot, l.row, l.col,
            COALESCE(ls.state, 'empty') AS state,
            COALESCE(ls.label, '') AS label
     FROM ${DSLM_SCHEMA}.locations l
     LEFT JOIN ${DSLM_SCHEMA}.location_state ls ON ls.location_id = l.id
     WHERE l.shelf = $1 AND l.depth = $2
     ORDER BY l.row, l.col;`,
    [shelf, depth]
  );
  return rows.map((r) => ({ id: r.slot, state: r.state, label: r.label }));
}

async function executePack(outsideId, insideId, rep) {
  if (!outsideId || !insideId) return rep.code(400).send({ error: "BAD_REQUEST" });

  const outside = normalizeUnitId(outsideId);
  const inside = normalizeUnitId(insideId);

  return withTx(async (client) => {
    const { rows: outsideRows } = await client.query(
      `SELECT id, kind FROM ${DSLM_SCHEMA}.units WHERE id = $1;`,
      [outside]
    );
    const { rows: insideRows } = await client.query(
      `SELECT id, kind FROM ${DSLM_SCHEMA}.units WHERE id = $1;`,
      [inside]
    );
    if (!outsideRows[0] || !insideRows[0]) return rep.code(404).send({ error: "UNIT_NOT_FOUND" });

    if (!isContainerKind(outsideRows[0].kind)) return rep.code(400).send({ error: "OUTSIDE_NOT_CONTAINER" });
    if (outsideRows[0].kind === "Bob" && insideRows[0].kind !== "Meal") {
      return rep.code(400).send({ error: "BOB_MEALS_ONLY" });
    }

    const { rows: existingParent } = await client.query(
      `SELECT parent_id FROM ${DSLM_SCHEMA}.containment_edges WHERE child_id = $1 AND removed_at IS NULL;`,
      [inside]
    );
    if (existingParent.length > 0) return rep.code(400).send({ error: "ALREADY_CONTAINED" });

    const { rows: cycleRows } = await client.query(
      `WITH RECURSIVE ancestors AS (
         SELECT parent_id
           FROM ${DSLM_SCHEMA}.containment_edges
          WHERE child_id = $1 AND removed_at IS NULL
         UNION ALL
         SELECT ce.parent_id
           FROM ${DSLM_SCHEMA}.containment_edges ce
           JOIN ancestors a ON a.parent_id = ce.child_id
          WHERE ce.removed_at IS NULL
       )
       SELECT 1 FROM ancestors WHERE parent_id = $2 LIMIT 1;`,
      [outside, inside]
    );
    if (cycleRows.length > 0) return rep.code(400).send({ error: "CYCLE_DETECTED" });

    const { rows: childRows } = await client.query(
      `SELECT COUNT(*)::int AS count FROM ${DSLM_SCHEMA}.containment_edges WHERE parent_id = $1 AND removed_at IS NULL;`,
      [outside]
    );
    const capacity = CONTAINER_CAPACITY[outsideRows[0].kind] ?? 0;
    if (capacity && childRows[0].count + 1 > capacity) {
      return rep.code(400).send({ error: "CAPACITY_EXCEEDED" });
    }

    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.containment_edges (parent_id, child_id) VALUES ($1,$2);`,
      [outside, inside]
    );
    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id, payload)
       VALUES ('PACK','unit',$1,$2);`,
      [outside, JSON.stringify({ outsideId: outside, insideId: inside })]
    );
    return { ok: true };
  });
}

async function getShipmentSummary(client = pool) {
  const { rows: shipRows } = await client.query(
    `SELECT id, supplier, status, processed_at FROM ${DSLM_SCHEMA}.shipments ORDER BY id;`
  );
  const { rows: lineRows } = await client.query(
    `SELECT shipment_id, sku, name, expected_qty, counted_qty, issue_flag FROM ${DSLM_SCHEMA}.shipment_lines ORDER BY sku;`
  );
  const byShip = new Map();
  shipRows.forEach((s) => {
    byShip.set(s.id, { id: s.id, code: s.id, vendor: s.supplier, status: s.status, expected: 0, counted: 0, items: [] });
  });
  lineRows.forEach((l) => {
    const ship = byShip.get(l.shipment_id);
    if (!ship) return;
    ship.items.push({ id: `${l.shipment_id}:${l.sku}`, sku: l.sku, name: l.name, expected: l.expected_qty, counted: l.counted_qty, status: l.issue_flag ? "pending" : l.counted_qty >= l.expected_qty ? "done" : l.counted_qty > 0 ? "in-progress" : "pending" });
    ship.expected += l.expected_qty;
    ship.counted += l.counted_qty;
    if (l.issue_flag && ship.status !== "complete") ship.status = "discrepancy";
  });

  return Array.from(byShip.values());
}

async function refreshShipmentStatus(client, shipmentId) {
  const { rows } = await client.query(
    `SELECT expected_qty, counted_qty, issue_flag FROM ${DSLM_SCHEMA}.shipment_lines WHERE shipment_id = $1;`,
    [shipmentId]
  );
  if (rows.length === 0) return;
  const anyIssue = rows.some((r) => r.issue_flag);
  const anyCounted = rows.some((r) => r.counted_qty > 0);
  const allMatch = rows.every((r) => r.counted_qty === r.expected_qty);
  let status = "in-progress";
  if (anyIssue) status = "discrepancy";
  else if (allMatch) status = "complete";
  else if (!anyCounted) status = "waiting";

  await client.query(
    `UPDATE ${DSLM_SCHEMA}.shipments SET status = $2, updated_at = now() WHERE id = $1;`,
    [shipmentId, status]
  );
}

function parseMovePath(pathStr) {
  const parts = String(pathStr || "")
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  const rawSlot = parts[0] ?? "";
  const chainIds = parts.slice(1).map(normalizeUnitId);

  if (!rawSlot) return { slotKey: "", chainIds };
  const [shelfRaw, slotRaw] = rawSlot.split("-");
  const shelf = normalizeShelf(shelfRaw);
  const slot = normalizeSlot(slotRaw);
  return { slotKey: buildSlotKey(shelf, slot), chainIds };
}

async function resolveTopStowedForSlot(client, shelf, slot) {
  const { rows } = await client.query(
    `SELECT l.depth, ls.occupied_unit_id
     FROM ${DSLM_SCHEMA}.locations l
     JOIN ${DSLM_SCHEMA}.location_state ls ON ls.location_id = l.id
     WHERE l.shelf = $1 AND l.slot = $2 AND ls.state = 'occupied'
     ORDER BY l.depth ASC
     LIMIT 1;`,
    [shelf, slot]
  );
  return rows[0]?.occupied_unit_id ?? null;
}

async function findEmptyDepthForSlot(client, shelf, slot) {
  const { rows } = await client.query(
    `SELECT l.depth
     FROM ${DSLM_SCHEMA}.locations l
     JOIN ${DSLM_SCHEMA}.location_state ls ON ls.location_id = l.id
     WHERE l.shelf = $1 AND l.slot = $2 AND ls.state = 'empty'
     ORDER BY l.depth ASC
     LIMIT 1;`,
    [shelf, slot]
  );
  return rows[0]?.depth ?? null;
}

async function getUnitById(client, unitId) {
  const { rows } = await client.query(
    `SELECT id, kind, name, category FROM ${DSLM_SCHEMA}.units WHERE id = $1;`,
    [unitId]
  );
  return rows[0] ?? null;
}

async function getActiveParent(client, childId) {
  const { rows } = await client.query(
    `SELECT parent_id FROM ${DSLM_SCHEMA}.containment_edges WHERE child_id = $1 AND removed_at IS NULL;`,
    [childId]
  );
  return rows[0]?.parent_id ?? null;
}

async function removeActiveParent(client, childId) {
  await client.query(
    `UPDATE ${DSLM_SCHEMA}.containment_edges SET removed_at = now() WHERE child_id = $1 AND removed_at IS NULL;`,
    [childId]
  );
}

async function findStowLocationsForUnit(client, unitId) {
  const { rows } = await client.query(
    `SELECT location_id FROM ${DSLM_SCHEMA}.location_state WHERE occupied_unit_id = $1;`,
    [unitId]
  );
  return rows.map((r) => r.location_id);
}

async function clearStowForUnit(client, unitId) {
  await client.query(
    `UPDATE ${DSLM_SCHEMA}.location_state
     SET state = 'empty', label = NULL, occupied_unit_id = NULL, updated_at = now()
     WHERE occupied_unit_id = $1;`,
    [unitId]
  );
}

app.get("/healthz", async () => ({ ok: true }));

// ===================== Inventory API =====================
app.get("/api/items", async () => {
  const sql = `
    SELECT
      i.id,
      i.sku,
      i.name,
      i.description,
      i.safety_stock AS "safetyStock",
      i.reorder_point AS "reorderPoint",
      COALESCE(t.total, 0) AS total,
      COALESCE(l.loc_qty, 0) AS "locQty",
      CASE
        WHEN COALESCE(t.total, 0) <= COALESCE(i.reorder_point, 0) THEN 'RISK'
        ELSE 'OK'
      END AS status
    FROM ${INV_SCHEMA}.items i
    LEFT JOIN (
      SELECT item_id, SUM(qty) AS total
      FROM ${INV_SCHEMA}.stocks
      GROUP BY item_id
    ) t ON t.item_id = i.id
    LEFT JOIN LATERAL (
      SELECT qty AS loc_qty
      FROM ${INV_SCHEMA}.stocks s
      WHERE s.item_id = i.id
      ORDER BY s.created_at ASC
      LIMIT 1
    ) l ON true
    ORDER BY i.sku;
  `;
  const { rows } = await q(sql);
  return rows;
});

app.get("/api/locations", async (req, rep) => {
  const shelf = req.query?.shelf ? normalizeShelf(req.query.shelf) : null;
  const depth = req.query?.depth ? normalizeDepth(req.query.depth) : null;
  if (shelf && depth) {
    const slots = await buildSlotGrid(pool, shelf, depth);
    return { shelf, depth, slots };
  }

  const { rows } = await q(`SELECT id, code, description FROM ${INV_SCHEMA}.locations ORDER BY code;`);
  return rows;
});

app.get("/api/stocks", async () => {
  const { rows } = await q(
    `SELECT item_id AS "itemId", location_id AS "locationId", qty, expires_at AS "expiresAt" FROM ${INV_SCHEMA}.stocks ORDER BY item_id;`
  );
  return rows;
});

app.get("/api/logs", async () => {
  const { rows } = await q(
    `SELECT id, timestamp, item_id AS "itemId", location_id AS "locationId", mode, qty, actor, reason, work_order AS "workOrder" FROM ${INV_SCHEMA}.logs ORDER BY timestamp DESC;`
  );
  return rows;
});

app.get("/api/config", async (req) => {
  const mode = String(req.query?.mode || "crew").toLowerCase();
  if (USE_MEMORY) {
    return {
      ok: true,
      params: {
        role: mode,
        missionId: "HUNCH-001",
        defaultLocationId: "",
        organization: "NASA HUNCH",
        uiMode: mode,
      },
    };
  }
  const { rows } = await q(`SELECT id FROM ${INV_SCHEMA}.locations ORDER BY code LIMIT 1;`);
  const defaultLocationId = rows[0]?.id ?? "";
  return {
    ok: true,
    params: {
      role: mode,
      missionId: "HUNCH-001",
      defaultLocationId,
      organization: "NASA HUNCH",
      uiMode: mode,
    },
  };
});

app.post("/api/checkin", async (req, rep) => {
  const { itemId, locationId, qty, actor, reason, workOrder } = req.body ?? {};
  if (!itemId || !locationId || !qty) return rep.code(400).send({ error: "BAD_REQUEST" });

  await q(
    `INSERT INTO ${INV_SCHEMA}.stocks (item_id, location_id, qty, expires_at)
     VALUES ($1,$2,$3,NULL)
     ON CONFLICT (item_id, location_id, expires_at)
     DO UPDATE SET qty = ${INV_SCHEMA}.stocks.qty + EXCLUDED.qty, updated_at = now();`,
    [itemId, locationId, Number(qty)]
  );

  const { rows: logRows } = await q(
    `INSERT INTO ${INV_SCHEMA}.logs (item_id, location_id, mode, qty, actor, reason, work_order)
     VALUES ($1,$2,'IN',$3,$4,$5,$6)
     RETURNING id, timestamp, item_id AS "itemId", location_id AS "locationId", mode, qty, actor, reason, work_order AS "workOrder";`,
    [itemId, locationId, Number(qty), actor || "crew", reason ?? null, workOrder ?? null]
  );

  return { ok: true, log: logRows[0] };
});

app.post("/api/checkout", async (req, rep) => {
  const { itemId, locationId, qty, actor, reason, workOrder } = req.body ?? {};
  if (!itemId || !locationId || !qty) return rep.code(400).send({ error: "BAD_REQUEST" });

  const { rows: stockRows } = await q(
    `SELECT id, qty FROM ${INV_SCHEMA}.stocks WHERE item_id = $1 AND location_id = $2 AND expires_at IS NULL LIMIT 1;`,
    [itemId, locationId]
  );
  const current = stockRows[0]?.qty ?? 0;
  if (current < Number(qty)) return rep.code(400).send({ error: "INSUFFICIENT_STOCK" });

  await q(`UPDATE ${INV_SCHEMA}.stocks SET qty = qty - $1, updated_at = now() WHERE item_id = $2 AND location_id = $3 AND expires_at IS NULL;`, [Number(qty), itemId, locationId]);
  await q(`DELETE FROM ${INV_SCHEMA}.stocks WHERE qty <= 0;`);

  const { rows: logRows } = await q(
    `INSERT INTO ${INV_SCHEMA}.logs (item_id, location_id, mode, qty, actor, reason, work_order)
     VALUES ($1,$2,'OUT',$3,$4,$5,$6)
     RETURNING id, timestamp, item_id AS "itemId", location_id AS "locationId", mode, qty, actor, reason, work_order AS "workOrder";`,
    [itemId, locationId, Number(qty), actor || "crew", reason ?? null, workOrder ?? null]
  );

  return { ok: true, log: logRows[0] };
});

app.post("/api/rfid/scan", async (req, rep) => {
  const { cardHex, mode, qty = 1, actor, locationId, reason, workOrder } = req.body ?? {};
  const card = normalizeHex(cardHex);
  if (!card || !mode) return rep.code(400).send({ error: "BAD_REQUEST" });

  const { rows: mapRows } = await q(
    `SELECT card_hex, item_id, last_location_id, status FROM ${INV_SCHEMA}.rfid_mappings WHERE card_hex = $1;`,
    [card]
  );
  if (mapRows.length === 0) {
    await q(
      `INSERT INTO ${INV_SCHEMA}.rfid_unknown (card_hex, mode, qty, actor, location_id, error)
       VALUES ($1,$2,$3,$4,$5,'CARD_NOT_MAPPED');`,
      [card, mode, Number(qty), actor || "unknown", locationId ?? null]
    );
    return rep.code(404).send({ error: "CARD_NOT_MAPPED" });
  }

  const mapping = mapRows[0];
  const effectiveLocationId = locationId || mapping.last_location_id;
  if (!effectiveLocationId) return rep.code(400).send({ error: "UNKNOWN_LOCATION" });

  const { rows: itemRows } = await q(
    `SELECT id, sku FROM ${INV_SCHEMA}.items WHERE id = $1;`,
    [mapping.item_id]
  );
  const itemSku = itemRows[0]?.sku ?? mapping.item_id;

  if (mode === "OUT") {
    const { rows: stockRows } = await q(
      `SELECT qty FROM ${INV_SCHEMA}.stocks WHERE item_id = $1 AND location_id = $2 AND expires_at IS NULL LIMIT 1;`,
      [mapping.item_id, effectiveLocationId]
    );
    const current = stockRows[0]?.qty ?? 0;
    if (current < Number(qty)) return rep.code(400).send({ error: "INSUFFICIENT_STOCK" });

    await q(
      `UPDATE ${INV_SCHEMA}.stocks SET qty = qty - $1, updated_at = now() WHERE item_id = $2 AND location_id = $3 AND expires_at IS NULL;`,
      [Number(qty), mapping.item_id, effectiveLocationId]
    );
    await q(`DELETE FROM ${INV_SCHEMA}.stocks WHERE qty <= 0;`);
  } else {
    await q(
      `INSERT INTO ${INV_SCHEMA}.stocks (item_id, location_id, qty, expires_at)
       VALUES ($1,$2,$3,NULL)
       ON CONFLICT (item_id, location_id, expires_at)
       DO UPDATE SET qty = ${INV_SCHEMA}.stocks.qty + EXCLUDED.qty, updated_at = now();`,
      [mapping.item_id, effectiveLocationId, Number(qty)]
    );
  }

  const { rows: logRows } = await q(
    `INSERT INTO ${INV_SCHEMA}.logs (item_id, location_id, mode, qty, actor, reason, work_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, timestamp, item_id AS "itemId", location_id AS "locationId", mode, qty, actor, reason, work_order AS "workOrder";`,
    [mapping.item_id, effectiveLocationId, mode, Number(qty), actor || "crew", reason ?? null, workOrder ?? null]
  );

  await q(
    `UPDATE ${INV_SCHEMA}.rfid_mappings SET last_location_id = $1, updated_at = now() WHERE card_hex = $2;`,
    [effectiveLocationId, card]
  );

  const { rows: stockAfter } = await q(
    `SELECT qty FROM ${INV_SCHEMA}.stocks WHERE item_id = $1 AND location_id = $2 AND expires_at IS NULL LIMIT 1;`,
    [mapping.item_id, effectiveLocationId]
  );
  const newQty = stockAfter[0]?.qty ?? 0;

  return {
    ok: true,
    action: mode === "OUT" ? "CHECKOUT" : "CHECKIN",
    itemId: mapping.item_id,
    itemSku,
    locationId: effectiveLocationId,
    cardHex: card,
    qty: Number(qty),
    newQty,
    status: mapping.status,
    log: logRows[0],
  };
});

app.post("/api/rfid/map", async (req, rep) => {
  const { cardHex, itemId, locationId } = req.body ?? {};
  const card = normalizeHex(cardHex);
  if (!card || !itemId || !locationId) return rep.code(400).send({ error: "BAD_REQUEST" });

  await q(
    `INSERT INTO ${INV_SCHEMA}.rfid_mappings (card_hex, item_id, last_location_id, status)
     VALUES ($1,$2,$3,'NEEDS_VERIFY')
     ON CONFLICT (card_hex)
     DO UPDATE SET item_id = EXCLUDED.item_id, last_location_id = EXCLUDED.last_location_id, status = 'NEEDS_VERIFY', updated_at = now();`,
    [card, itemId, locationId]
  );

  return { ok: true, cardHex: card, itemId, locationId };
});

app.get("/api/rfid/mappings", async () => {
  const { rows } = await q(
    `SELECT card_hex AS "cardHex", item_id AS "itemId", last_location_id AS "lastLocationId" FROM ${INV_SCHEMA}.rfid_mappings ORDER BY card_hex;`
  );
  return rows;
});

app.get("/api/rfid/unknown", async () => {
  const { rows } = await q(
    `SELECT id, timestamp, card_hex AS "cardHex", mode, qty, actor, location_id AS "locationId", error FROM ${INV_SCHEMA}.rfid_unknown ORDER BY timestamp DESC;`
  );
  return rows;
});

app.post("/api/rfid/move", async (req, rep) => {
  const { cardHex, locationId } = req.body ?? {};
  const card = normalizeHex(cardHex);
  if (!card || !locationId) return rep.code(400).send({ error: "BAD_REQUEST" });

  await q(
    `UPDATE ${INV_SCHEMA}.rfid_mappings SET last_location_id = $1, updated_at = now() WHERE card_hex = $2;`,
    [locationId, card]
  );

  return { ok: true, cardHex: card, locationId };
});

// ===================== DSLM Bootstrap + Core APIs =====================
app.get("/api/bootstrap", async () => {
  const shelves = ["S1", "S2", "S3", "C1", "C2"];
  const stacks = {};
  const slotGrids = {};

  for (const shelf of shelves) {
    const depths = shelf.startsWith("C") ? [1] : [1, 2, 3, 4];
    for (const depth of depths) {
      const grid = await buildSlotGrid(pool, shelf, depth);
      slotGrids[`${shelf}-D${depth}`] = grid;
      if (depth === 1) stacks[shelf] = grid;
    }
  }

  const stowedByLocation = await buildStowedByLocation();
  const nodesById = await buildNodesById();

  const { rows: mealRows } = await q(
    `SELECT id, name, metadata FROM ${DSLM_SCHEMA}.units WHERE kind = 'Meal' ORDER BY id;`
  );
  const sourceMeals = mealRows.map((m) => ({
    id: m.id,
    name: m.name ?? m.id,
    type: m.metadata?.type ?? "Standard",
    calories: m.metadata?.calories ?? 0,
    expiry: m.metadata?.expiry ?? null,
  }));

  const inbound = (await getShipmentSummary()).map((s) => ({
    id: s.id,
    supplier: s.vendor,
    status: s.status,
  }));

  return { stacks, slotGrids, stowedByLocation, nodesById, sourceMeals, inbound };
});

app.post("/api/scan", async (req, rep) => {
  const { raw } = req.body ?? {};
  const value = normalizeUnitId(raw);
  if (!value) return rep.code(400).send({ error: "BAD_SCAN" });

  const { rows: mapRows } = await q(
    `SELECT unit_id FROM ${DSLM_SCHEMA}.unit_identifiers WHERE value = $1;`,
    [value]
  );
  const unitId = mapRows[0]?.unit_id ?? value;
  const unit = await getUnitById(pool, unitId);
  if (!unit) return rep.code(404).send({ error: "UNIT_NOT_FOUND" });
  return { unitId: unit.id, kind: unit.kind, label: unit.name ?? unit.id };
});

app.post("/api/crew/scan", async (req, rep) => {
  const { raw } = req.body ?? {};
  const scanned = normalizeUnitId(raw);
  if (!scanned) return rep.code(400).send({ error: "BAD_SCAN" });

  if (USE_MEMORY) {
    const resolved = memEnsureUnitForScan(scanned);
    if (!resolved?.unit) return rep.code(404).send({ error: "UNIT_NOT_FOUND" });
    const meta = resolved.unit.metadata ?? {};
    return {
      id: resolved.unit.id,
      name: resolved.unit.name ?? resolved.unit.id,
      tagId: resolved.tagId ?? scanned,
      kind: resolved.unit.kind,
      home: meta.homeLocation ?? "",
      location: meta.location ?? meta.homeLocation ?? "",
      trashType: meta.trashType ?? "",
      qty: typeof meta.qty === "number" ? meta.qty : null,
      maxQty: typeof meta.maxQty === "number" ? meta.maxQty : null,
    };
  }

  const { rows: mapRows } = await q(
    `SELECT value, unit_id FROM ${DSLM_SCHEMA}.unit_identifiers WHERE value = $1;`,
    [scanned]
  );
  const unitId = mapRows[0]?.unit_id ?? scanned;
  let unit = await getUnitById(pool, unitId);
  if (!unit) {
    const createdId = unitId.startsWith("ITEM-") ? unitId : `ITEM-${unitId}`;
    await q(
      `INSERT INTO ${DSLM_SCHEMA}.units (id, kind, name, category, status, metadata)
       VALUES ($1,'Item','Unmapped item','Unknown','ACTIVE',$2)
       ON CONFLICT (id) DO NOTHING;`,
      [createdId, JSON.stringify({ homeLocation: "", trashType: "", qty: 10, maxQty: 100 })]
    );
    await q(
      `INSERT INTO ${DSLM_SCHEMA}.unit_identifiers (type, value, status, unit_id)
       VALUES ('RFID',$1,'NEEDS_VERIFY',$2)
       ON CONFLICT (value) DO NOTHING;`,
      [scanned, createdId]
    );
    unit = await getUnitById(pool, createdId);
  }
  if (!unit) return rep.code(404).send({ error: "UNIT_NOT_FOUND" });

  const { rows: metaRows } = await q(
    `SELECT metadata FROM ${DSLM_SCHEMA}.units WHERE id = $1;`,
    [unit.id]
  );
  const metadata = metaRows[0]?.metadata ?? {};
  const location = await getUnitLocationPath(pool, unitId);

  const qty = typeof metadata.qty === "number" ? metadata.qty : unit.kind === "Item" ? 10 : null;
  const maxQty = typeof metadata.maxQty === "number" ? metadata.maxQty : unit.kind === "Item" ? 100 : null;

  return {
    id: unitId,
    name: unit.name ?? unitId,
    tagId: mapRows[0]?.value ?? scanned,
    kind: unit.kind,
    home: metadata.homeLocation ?? "",
    location,
    trashType: metadata.trashType ?? "",
    qty,
    maxQty,
  };
});

app.post("/api/crew/return", async (req, rep) => {
  const { unitId, home, qty, amount } = req.body ?? {};
  const id = normalizeUnitId(unitId);
  if (!id) return rep.code(400).send({ error: "BAD_REQUEST" });
  if (USE_MEMORY) {
    if (memory) {
      const unit = memory.units.get(id);
      const parsedQty = Number(qty ?? amount ?? 1);
      const requested = Math.min(100, Math.max(1, Number.isFinite(parsedQty) ? parsedQty : 1));
      const meta = unit?.metadata ?? {};
      const maxQty = typeof meta.maxQty === "number" ? meta.maxQty : 100;
      if (typeof meta.qty === "number") {
        meta.qty = Math.min(maxQty, meta.qty + requested);
      } else if (unit) {
        meta.qty = Math.min(maxQty, requested);
      }
      if (unit) unit.metadata = meta;
      memory.events.push({ type: "RETURN", unitId: id, payload: { home, qty: requested }, when: new Date().toISOString() });
    }
    return { ok: true };
  }
  await q(
    `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id, payload)
     VALUES ('RETURN','unit',$1,$2);`,
    [id, JSON.stringify({ home })]
  );
  return { ok: true };
});

app.post("/api/crew/remove", async (req, rep) => {
  const { unitId, qty, amount } = req.body ?? {};
  const id = normalizeUnitId(unitId);
  if (!id) return rep.code(400).send({ error: "BAD_REQUEST" });
  if (USE_MEMORY) {
    if (memory) {
      const unit = memory.units.get(id);
      const parsedQty = Number(qty ?? amount ?? 1);
      const requested = Math.min(100, Math.max(1, Number.isFinite(parsedQty) ? parsedQty : 1));
      const meta = unit?.metadata ?? {};
      if (typeof meta.qty === "number") {
        if (requested > meta.qty) {
          return rep.code(409).send({ error: "INSUFFICIENT_QTY", available: meta.qty });
        }
        meta.qty = Math.max(0, meta.qty - requested);
        if (unit) unit.metadata = meta;
      }
      memory.events.push({
        type: "REMOVE",
        unitId: id,
        payload: { qty: requested },
        when: new Date().toISOString(),
      });
    }
    return { ok: true };
  }
  const parsedQty = Number(qty ?? amount ?? 1);
  const requested = Math.min(100, Math.max(1, Number.isFinite(parsedQty) ? parsedQty : 1));
  const { rows: unitRows } = await q(
    `SELECT kind, metadata FROM ${DSLM_SCHEMA}.units WHERE id = $1;`,
    [id]
  );
  if (!unitRows.length) return rep.code(404).send({ error: "UNIT_NOT_FOUND" });
  const meta = unitRows[0]?.metadata ?? {};
  const isItem = unitRows[0]?.kind === "Item";
  if (isItem) {
    const maxQty = typeof meta.maxQty === "number" ? meta.maxQty : 100;
    const currentQty = typeof meta.qty === "number" ? meta.qty : 10;
    if (requested > currentQty) {
      return rep.code(409).send({ error: "INSUFFICIENT_QTY", available: currentQty });
    }
    const nextQty = Math.max(0, currentQty - requested);
    await q(
      `UPDATE ${DSLM_SCHEMA}.units
       SET metadata = jsonb_set(
         jsonb_set(coalesce(metadata, '{}'::jsonb), '{maxQty}', to_jsonb($2::int), true),
         '{qty}', to_jsonb($3::int), true
       )
       WHERE id = $1;`,
      [id, maxQty, nextQty]
    );
  }
  await q(
    `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id)
     VALUES ('REMOVE','unit',$1);`,
    [id]
  );
  return { ok: true };
});

app.post("/api/crew/dispose", async (req, rep) => {
  const { unitId, trashType, stationId, binId } = req.body ?? {};
  const id = normalizeUnitId(unitId);
  if (!id) return rep.code(400).send({ error: "BAD_REQUEST" });
  if (USE_MEMORY) {
    if (memory) {
      const unit = memory.units.get(id);
      if (unit) {
        unit.status = "DISPOSED";
        unit.metadata = { ...(unit.metadata ?? {}), trashType: trashType ?? unit.metadata?.trashType };
      }
      memory.events.push({ type: "DISPOSE", unitId: id, payload: { trashType, stationId, binId }, when: new Date().toISOString() });
    }
    return { ok: true };
  }
  await q(
    `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id, payload)
     VALUES ('DISPOSE','unit',$1,$2);`,
    [id, JSON.stringify({ trashType, stationId, binId })]
  );
  await q(`UPDATE ${DSLM_SCHEMA}.units SET status = 'DISPOSED', updated_at = now() WHERE id = $1;`, [id]);
  return { ok: true };
});

app.post("/api/auth/badge", async (req, rep) => {
  const { raw } = req.body ?? {};
  const cleaned = normalizeBadgeTag(raw);
  if (!cleaned) return rep.code(400).send({ error: "BAD_BADGE" });

  if (USE_MEMORY) {
    const keys = memory ? Array.from(memory.badges.keys()) : [];
    let matchKey = keys.find((k) => cleaned.endsWith(k)) ?? null;
    if (!matchKey && /^\d+$/.test(cleaned) && cleaned.length > 10) {
      const last = cleaned.slice(-10);
      matchKey = keys.find((k) => k === last) ?? null;
    }
    if (!matchKey) matchKey = keys.find((k) => k === cleaned) ?? null;
    if (!matchKey) return rep.code(404).send({ error: "BADGE_NOT_FOUND" });
    const badge = memory.badges.get(matchKey);
    return { ok: true, actor: badge.actor, uiMode: badge.ui_mode, badge: matchKey };
  }

  const allowed = ["0003070837", "0003104127"];
  const allowedMatch = allowed.find((badge) => cleaned.endsWith(badge));
  if (!allowedMatch) return rep.code(404).send({ error: "BADGE_NOT_FOUND" });

  const { rows } = await q(
    `SELECT badge_value, actor, ui_mode FROM ${DSLM_SCHEMA}.badges ORDER BY badge_value;`
  );
  if (!rows.length) return rep.code(404).send({ error: "BADGE_NOT_FOUND" });

  const keys = rows.map((r) => r.badge_value);
  let match = null;
  for (const k of keys) {
    if (cleaned.endsWith(k)) {
      match = rows.find((r) => r.badge_value === k) ?? null;
      break;
    }
  }
  if (!match && /^\d+$/.test(cleaned) && cleaned.length > 10) {
    const last = cleaned.slice(-10);
    match = rows.find((r) => r.badge_value === last) ?? null;
  }
  if (!match) {
    match = rows.find((r) => r.badge_value === cleaned) ?? null;
  }

  if (!match) return rep.code(404).send({ error: "BADGE_NOT_FOUND" });
  return { ok: true, actor: match.actor, uiMode: match.ui_mode, badge: match.badge_value };
});

app.post("/api/auth/badge/register", async (req, rep) => {
  const { raw, uiMode } = req.body ?? {};
  const cleaned = normalizeBadgeTag(raw);
  const mode = String(uiMode || "").toLowerCase();
  if (!cleaned || (mode !== "crew" && mode !== "ground")) {
    return rep.code(400).send({ error: "BAD_REQUEST" });
  }

  if (USE_MEMORY) {
    const allowed = ["0003070837", "0003104127"];
    if (!allowed.includes(cleaned)) return rep.code(403).send({ error: "BADGE_NOT_ALLOWED" });
    const actor = mode === "ground" ? "ground" : "crew";
    if (memory) memory.badges.set(cleaned, { actor, ui_mode: mode });
    return { ok: true, actor, uiMode: mode, badge: cleaned };
  }

  const actor = mode === "ground" ? "ground" : "crew";
  await q(
    `INSERT INTO ${DSLM_SCHEMA}.badges (badge_value, actor, ui_mode)
     VALUES ($1,$2,$3)
     ON CONFLICT (badge_value) DO UPDATE SET actor = EXCLUDED.actor, ui_mode = EXCLUDED.ui_mode;`,
    [cleaned, actor, mode]
  );

  return { ok: true, actor, uiMode: mode, badge: cleaned };
});

app.post("/api/stow", async (req, rep) => {
  const { mode, unitId, shelf, depth, slotIds } = req.body ?? {};
  const resolvedUnit = normalizeUnitId(unitId);
  const resolvedShelf = normalizeShelf(shelf);
  const resolvedDepth = normalizeDepth(depth);
  const slots = Array.isArray(slotIds) ? slotIds.map(normalizeSlot) : [];

  if (!mode || !resolvedUnit || !resolvedShelf || !resolvedDepth || slots.length === 0) {
    return rep.code(400).send({ error: "BAD_REQUEST" });
  }

  return withTx(async (client) => {
    const unit = await getUnitById(client, resolvedUnit);
    if (!unit) return rep.code(404).send({ error: "UNIT_NOT_FOUND" });

    if (mode === "ctb") {
      if (unit.kind !== "CTB") return rep.code(400).send({ error: "MODE_MISMATCH" });
      if (slots.length !== 1) return rep.code(400).send({ error: "SLOT_COUNT" });
      if (!resolvedShelf.startsWith("S")) return rep.code(400).send({ error: "SHELF_INVALID" });
    } else if (mode === "irregular") {
      if (unit.kind !== "Irregular") return rep.code(400).send({ error: "MODE_MISMATCH" });
      if (!resolvedShelf.startsWith("C")) return rep.code(400).send({ error: "SHELF_INVALID" });
      if (resolvedDepth !== 1) return rep.code(400).send({ error: "DEPTH_INVALID" });
    } else {
      return rep.code(400).send({ error: "UNKNOWN_MODE" });
    }

    const parent = await getActiveParent(client, resolvedUnit);
    if (parent) return rep.code(400).send({ error: "UNIT_CONTAINED" });

    const stowed = await findStowLocationsForUnit(client, resolvedUnit);
    if (stowed.length > 0) return rep.code(400).send({ error: "UNIT_ALREADY_STOWED" });

    const { rows: slotRows } = await client.query(
      `SELECT l.id, l.slot, ls.state
       FROM ${DSLM_SCHEMA}.locations l
       JOIN ${DSLM_SCHEMA}.location_state ls ON ls.location_id = l.id
       WHERE l.shelf = $1 AND l.depth = $2 AND l.slot = ANY($3);`,
      [resolvedShelf, resolvedDepth, slots]
    );
    if (slotRows.length !== slots.length) return rep.code(400).send({ error: "INVALID_SLOT" });
    if (slotRows.some((r) => r.state !== "empty")) return rep.code(400).send({ error: "SLOT_UNAVAILABLE" });

    for (const row of slotRows) {
      await client.query(
        `UPDATE ${DSLM_SCHEMA}.location_state
         SET state = 'occupied', label = $2, occupied_unit_id = $3, updated_at = now()
         WHERE location_id = $1;`,
        [row.id, resolvedUnit, resolvedUnit]
      );
    }

    if (mode === "irregular") {
      await client.query(
        `INSERT INTO ${DSLM_SCHEMA}.irregular_footprints (unit_id, shelf, slot_ids)
         VALUES ($1,$2,$3);`,
        [resolvedUnit, resolvedShelf, slots]
      );
    }

    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id, payload)
       VALUES ('STOW','unit',$1,$2);`,
      [resolvedUnit, JSON.stringify({ shelf: resolvedShelf, depth: resolvedDepth, slots })]
    );

    const updated = await buildSlotGrid(client, resolvedShelf, resolvedDepth);
    return { ok: true, updated: { shelf: resolvedShelf, depth: resolvedDepth, slots: updated } };
  });
});

app.post("/api/pack", async (req, rep) => {
  const { outsideId, insideId } = req.body ?? {};
  return executePack(outsideId, insideId, rep);
});

app.post("/api/unpack", async (req, rep) => {
  const { outsideId, insideId } = req.body ?? {};
  if (!outsideId || !insideId) return rep.code(400).send({ error: "BAD_REQUEST" });

  const outside = normalizeUnitId(outsideId);
  const inside = normalizeUnitId(insideId);

  return withTx(async (client) => {
    await client.query(
      `UPDATE ${DSLM_SCHEMA}.containment_edges
       SET removed_at = now()
       WHERE parent_id = $1 AND child_id = $2 AND removed_at IS NULL;`,
      [outside, inside]
    );
    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id, payload)
       VALUES ('UNPACK','unit',$1,$2);`,
      [outside, JSON.stringify({ outsideId: outside, insideId: inside })]
    );
    return { ok: true };
  });
});

app.post("/api/move", async (req, rep) => {
  if (USE_MEMORY) {
    if (memory) memory.events.push({ type: "MOVE", payload: req.body ?? {}, when: new Date().toISOString() });
    return { ok: true };
  }
  const { unitId, from, to, reason } = req.body ?? {};
  const normalizedUnit = unitId ? normalizeUnitId(unitId) : null;
  const fromParsed = parseMovePath(from);
  const toParsed = parseMovePath(to);

  return withTx(async (client) => {
    const nodesById = await buildNodesById(client);

    const resolveTarget = async (parsed) => {
      if (!parsed.slotKey) return { slotKey: "", shelf: "", slot: "", topId: null, targetId: null };
      const [shelf, slot] = parsed.slotKey.split("-");
      const topId = await resolveTopStowedForSlot(client, shelf, slot);
      let targetId = topId;
      for (const id of parsed.chainIds) {
        if (nodesById[id]) targetId = id;
      }
      return { slotKey: parsed.slotKey, shelf, slot, topId, targetId };
    };

    const fromResolved = await resolveTarget(fromParsed);
    const toResolved = await resolveTarget(toParsed);

    const movingUnit = normalizedUnit || fromResolved.targetId || fromResolved.topId;
    if (!movingUnit) return rep.code(400).send({ error: "UNIT_REQUIRED" });

    const unit = await getUnitById(client, movingUnit);
    if (!unit) return rep.code(404).send({ error: "UNIT_NOT_FOUND" });

    let destType = "slot";
    let destId = null;
    let destShelf = null;
    let destSlot = null;
    let destDepth = null;

    if (toParsed.chainIds.length > 0) {
      destType = "container";
      destId = toParsed.chainIds[toParsed.chainIds.length - 1];
    } else {
      if (!toResolved.slotKey) return rep.code(400).send({ error: "DEST_REQUIRED" });
      destShelf = toResolved.shelf;
      destSlot = toResolved.slot;
      destDepth = destShelf.startsWith("C") ? 1 : await findEmptyDepthForSlot(client, destShelf, destSlot);
      if (!destDepth) return rep.code(400).send({ error: "NO_EMPTY_DEPTH" });
      if (unit.kind === "Irregular" && !destShelf.startsWith("C")) return rep.code(400).send({ error: "IRREGULAR_SHELF_ONLY" });
      if (unit.kind !== "Irregular" && destShelf.startsWith("C")) return rep.code(400).send({ error: "STANDARD_SHELF_ONLY" });
    }

    if (destType === "container") {
      const destUnit = await getUnitById(client, destId);
      if (!destUnit) return rep.code(404).send({ error: "DEST_NOT_FOUND" });
      if (!isContainerKind(destUnit.kind)) return rep.code(400).send({ error: "DEST_NOT_CONTAINER" });
      if (destUnit.kind === "Bob" && unit.kind !== "Meal") return rep.code(400).send({ error: "BOB_MEALS_ONLY" });

      const { rows: cycleRows } = await client.query(
        `WITH RECURSIVE descendants AS (
           SELECT child_id
             FROM ${DSLM_SCHEMA}.containment_edges
            WHERE parent_id = $1 AND removed_at IS NULL
           UNION ALL
           SELECT ce.child_id
             FROM ${DSLM_SCHEMA}.containment_edges ce
             JOIN descendants d ON d.child_id = ce.parent_id
            WHERE ce.removed_at IS NULL
         )
         SELECT 1 FROM descendants WHERE child_id = $2 LIMIT 1;`,
        [movingUnit, destId]
      );
      if (cycleRows.length > 0) return rep.code(400).send({ error: "CYCLE_DETECTED" });

      const { rows: childRows } = await client.query(
        `SELECT COUNT(*)::int AS count FROM ${DSLM_SCHEMA}.containment_edges WHERE parent_id = $1 AND removed_at IS NULL;`,
        [destId]
      );
      const capacity = CONTAINER_CAPACITY[destUnit.kind] ?? 0;
      if (capacity && childRows[0].count + 1 > capacity) {
        return rep.code(400).send({ error: "CAPACITY_EXCEEDED" });
      }
    }

    await removeActiveParent(client, movingUnit);
    await clearStowForUnit(client, movingUnit);

    if (destType === "container") {
      await client.query(
        `INSERT INTO ${DSLM_SCHEMA}.containment_edges (parent_id, child_id) VALUES ($1,$2);`,
        [destId, movingUnit]
      );
    } else {
      const locationId = buildLocationId(destShelf, destDepth, destSlot);
      await client.query(
        `UPDATE ${DSLM_SCHEMA}.location_state
         SET state = 'occupied', label = $2, occupied_unit_id = $3, updated_at = now()
         WHERE location_id = $1;`,
        [locationId, movingUnit, movingUnit]
      );
    }

    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id, payload)
       VALUES ('MOVE','unit',$1,$2);`,
      [movingUnit, JSON.stringify({ from, to, reason })]
    );

    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.moves (unit_id, from_path, to_path, reason, result)
       VALUES ($1,$2,$3,$4,$5);`,
      [movingUnit, from ?? null, to ?? null, reason ?? null, JSON.stringify({ fromResolved, toResolved })]
    );

    const stowedByLocation = await buildStowedByLocation(client);
    const nodesByIdUpdated = await buildNodesById(client);
    return { ok: true, nodesById: nodesByIdUpdated, stowedByLocation };
  });
});

app.get("/api/shipments/inbound", async () => {
  const summary = await getShipmentSummary();
  return summary.map((s) => ({ id: s.id, supplier: s.vendor, status: s.status }));
});

app.get("/api/shipments/:id/manifest", async (req, rep) => {
  const id = normalizeUnitId(req.params.id);
  const { rows: shipRows } = await q(
    `SELECT id, supplier, status, metadata FROM ${DSLM_SCHEMA}.shipments WHERE id = $1;`,
    [id]
  );
  if (!shipRows[0]) return rep.code(404).send({ error: "NOT_FOUND" });
  const ship = shipRows[0];

  const { rows: lineRows } = await q(
    `SELECT sku, name, expected_qty, counted_qty, issue_flag FROM ${DSLM_SCHEMA}.shipment_lines WHERE shipment_id = $1 ORDER BY sku;`,
    [id]
  );

  const meta = ship.metadata ?? {};
  return {
    shipmentId: ship.id,
    supplier: ship.supplier,
    title: `MFT-${ship.id}`,
    subtitle: `${ship.supplier} • ${meta.po ?? ship.id}`,
    stateLabel: ship.status === "discrepancy" ? "Discrepancy" : ship.status === "complete" ? "Done" : ship.status === "waiting" ? "Waiting" : "In progress",
    stateTone: ship.status === "discrepancy" ? "issue" : ship.status === "complete" ? "verified" : ship.status === "waiting" ? "waiting" : "progress",
    meta: [
      { k: "PO", v: meta.po ?? "—" },
      { k: "Carrier", v: meta.carrier ?? "—" },
      { k: "Dock", v: meta.dock ?? "—" },
      { k: "Containers", v: meta.containers ?? "—" },
      { k: "Handling", v: meta.handling ?? "—" },
    ],
    lines: lineRows.map((l) => ({
      sku: l.sku,
      name: l.name,
      expected: l.expected_qty,
      counted: l.counted_qty,
      stateLabel: l.counted_qty >= l.expected_qty ? "Done" : l.counted_qty === 0 ? "Waiting" : "In progress",
      stateTone: l.counted_qty >= l.expected_qty ? "verified" : l.counted_qty === 0 ? "waiting" : "progress",
    })),
  };
});

app.post("/api/shipments/:id/lines/:sku/count", async (req, rep) => {
  const id = normalizeUnitId(req.params.id);
  const sku = String(req.params.sku || "").trim();
  const delta = Number(req.body?.delta ?? 0);
  if (!sku || !Number.isFinite(delta)) return rep.code(400).send({ error: "BAD_REQUEST" });

  return withTx(async (client) => {
    const { rows } = await client.query(
      `UPDATE ${DSLM_SCHEMA}.shipment_lines
       SET counted_qty = GREATEST(0, counted_qty + $1), updated_at = now()
       WHERE shipment_id = $2 AND sku = $3
       RETURNING counted_qty, expected_qty;`,
      [delta, id, sku]
    );
    if (rows.length === 0) return rep.code(404).send({ error: "NOT_FOUND" });

    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id, payload)
       VALUES ('RECEIVE_COUNT','shipment',$1,$2);`,
      [id, JSON.stringify({ sku, delta })]
    );
    await refreshShipmentStatus(client, id);
    return { ok: true, counted: rows[0].counted_qty, expected: rows[0].expected_qty };
  });
});

app.post("/api/shipments/:id/lines/:sku/toggle-issue", async (req, rep) => {
  const id = normalizeUnitId(req.params.id);
  const sku = String(req.params.sku || "").trim();
  if (!sku) return rep.code(400).send({ error: "BAD_REQUEST" });

  return withTx(async (client) => {
    const { rows } = await client.query(
      `UPDATE ${DSLM_SCHEMA}.shipment_lines
       SET issue_flag = NOT issue_flag, updated_at = now()
       WHERE shipment_id = $1 AND sku = $2
       RETURNING issue_flag;`,
      [id, sku]
    );
    if (rows.length === 0) return rep.code(404).send({ error: "NOT_FOUND" });

    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id, payload)
       VALUES ('RECEIVE_ISSUE_TOGGLE','shipment',$1,$2);`,
      [id, JSON.stringify({ sku, issue: rows[0].issue_flag })]
    );
    await refreshShipmentStatus(client, id);
    return { ok: true, issue: rows[0].issue_flag };
  });
});

app.post("/api/shipments/:id/process", async (req, rep) => {
  const id = normalizeUnitId(req.params.id);
  return withTx(async (client) => {
    const { rows: lines } = await client.query(
      `SELECT expected_qty, counted_qty, issue_flag FROM ${DSLM_SCHEMA}.shipment_lines WHERE shipment_id = $1;`,
      [id]
    );
    const anyIssue = lines.some((l) => l.issue_flag);
    const allMatch = lines.every((l) => l.counted_qty === l.expected_qty);
    if (anyIssue || !allMatch) return rep.code(400).send({ error: "NOT_READY" });

    await client.query(
      `UPDATE ${DSLM_SCHEMA}.shipments SET status = 'complete', processed_at = now(), updated_at = now() WHERE id = $1;`,
      [id]
    );
    await client.query(
      `INSERT INTO ${DSLM_SCHEMA}.events (type, entity_type, entity_id)
       VALUES ('SHIPMENT_PROCESSED','shipment',$1);`,
      [id]
    );
    return { ok: true };
  });
});

app.get("/api/containers/:id/tree", async (req, rep) => {
  const id = normalizeUnitId(req.params.id);
  const depth = Number(req.query?.depth ?? 4);
  const nodesById = await buildNodesById();
  if (!nodesById[id]) return rep.code(404).send({ error: "NOT_FOUND" });

  const nodes = {};
  const queue = [{ id, level: 0 }];
  while (queue.length) {
    const { id: curr, level } = queue.shift();
    const node = nodesById[curr];
    if (!node || nodes[curr]) continue;
    nodes[curr] = node;
    if (level < depth) {
      node.childrenIds.forEach((child) => queue.push({ id: child, level: level + 1 }));
    }
  }
  return { rootId: id, nodes };
});

app.get("/api/inspect/:kind/:id", async (req, rep) => {
  const kind = String(req.params.kind || "").toLowerCase();
  const id = normalizeUnitId(req.params.id);

  if (kind === "shipment") {
    const manifest = await app.inject({ method: "GET", url: `/api/shipments/${id}/manifest` }).then((r) => r.json());
    return { ...manifest, kind: "shipment", manifest: true, title: manifest.shipmentId, subtitle: manifest.supplier, pills: [{ label: manifest.stateLabel, tone: manifest.stateTone }], details: { Supplier: manifest.supplier, Status: manifest.stateLabel } };
  }

  if (kind === "slot") {
    const slotKey = String(req.params.id || "").trim().toUpperCase();
    const parts = slotKey.split("-");
    const shelf = normalizeShelf(parts[0]);
    const slot = normalizeSlot(parts[parts.length - 1]);
    const depth = slotKey.includes("-D") ? Number(slotKey.split("-D")[1].split("-")[0]) : null;
    const locationId = depth ? buildLocationId(shelf, depth, slot) : null;
    const { rows } = await q(
      `SELECT l.id, l.shelf, l.depth, l.slot, ls.state, ls.label, ls.occupied_unit_id
       FROM ${DSLM_SCHEMA}.locations l
       LEFT JOIN ${DSLM_SCHEMA}.location_state ls ON ls.location_id = l.id
       WHERE l.shelf = $1 AND l.slot = $2 ${depth ? "AND l.depth = $3" : ""}
       ORDER BY l.depth ASC
       LIMIT 1;`,
      depth ? [shelf, slot, depth] : [shelf, slot]
    );
    if (!rows[0]) return rep.code(404).send({ error: "NOT_FOUND" });
    const row = rows[0];
    return {
      kind: "slot",
      title: `${row.shelf}-L${slotNumber(row.slot)}`,
      subtitle: "DSLM Stowage",
      pills: [{ label: row.state, tone: row.state === "occupied" ? "ok" : row.state === "reserved" ? "warn" : "neutral" }],
      details: { Shelf: row.shelf, Depth: `D${row.depth}`, Slot: row.slot, State: row.state, Label: row.label ?? "" },
      contents: row.occupied_unit_id ? [row.occupied_unit_id] : null,
      history: [],
    };
  }

  if (kind === "move") {
    const { rows } = await q(`SELECT unit_id, from_path, to_path, reason, executed_at FROM ${DSLM_SCHEMA}.moves WHERE id = $1;`, [req.params.id]);
    if (!rows[0]) return rep.code(404).send({ error: "NOT_FOUND" });
    const m = rows[0];
    return {
      kind: "move",
      title: m.unit_id ?? "Move",
      subtitle: `${m.from_path ?? ""} → ${m.to_path ?? ""}`,
      pills: [{ label: "Relocation", tone: "progress" }],
      details: { From: m.from_path ?? "", To: m.to_path ?? "", Reason: m.reason ?? "", When: m.executed_at?.toISOString?.() ?? String(m.executed_at) },
      contents: null,
      history: [],
    };
  }

  const unit = await getUnitById(pool, id);
  if (!unit) return rep.code(404).send({ error: "NOT_FOUND" });
  const nodesById = await buildNodesById();
  const parent = nodesById[id]?.parentId ?? null;
  const children = nodesById[id]?.childrenIds ?? [];
  const { rows: locRows } = await q(
    `SELECT l.shelf, l.depth, l.slot FROM ${DSLM_SCHEMA}.location_state ls JOIN ${DSLM_SCHEMA}.locations l ON l.id = ls.location_id WHERE ls.occupied_unit_id = $1 LIMIT 1;`,
    [id]
  );
  const location = locRows[0] ? `${locRows[0].shelf}-D${locRows[0].depth}-${locRows[0].slot}` : "—";
  return {
    kind: "unit",
    title: id,
    subtitle: unit.name ?? id,
    pills: [{ label: unit.kind, tone: "neutral" }],
    details: { Kind: unit.kind, Location: location, Parent: parent ?? "—" },
    contents: children.length ? children : null,
    history: [],
  };
});

app.get("/api/shipments", async () => {
  if (USE_MEMORY) {
    return memory ? memory.shipments : [];
  }
  return getShipmentSummary();
});

app.get("/api/containers", async () => {
  if (USE_MEMORY) {
    if (!memory) return [];
    return memory.containers.map((c) => ({
      id: c.id,
      code: c.code,
      capacity: c.capacity,
      used: c.items.length,
      items: c.items,
    }));
  }
  const nodesById = await buildNodesById();
  const { rows: unitRows } = await q(
    `SELECT id, kind, name FROM ${DSLM_SCHEMA}.units WHERE kind IN ('CTB','Bob','Package') ORDER BY id;`
  );

  return unitRows.map((u) => {
    const node = nodesById[u.id] ?? { childrenIds: [] };
    const capacity = CONTAINER_CAPACITY[u.kind] ?? 0;
    return {
      id: u.id,
      code: u.id,
      capacity,
      used: node.childrenIds.length,
      items: node.childrenIds,
    };
  });
});

app.post("/api/containers/pack", async (req, rep) => {
  const { outsideId, insideId } = req.body ?? {};
  if (USE_MEMORY) {
    if (!memory || !outsideId || !insideId) return rep.code(400).send({ error: "BAD_REQUEST" });
    const outsideKey = normalizeUnitId(outsideId);
    const insideKey = normalizeUnitId(insideId);
    let outside = memory.containers.find((c) => c.id === outsideKey);
    let inside = memory.containers.find((c) => c.id === insideKey);
    if (!outside) {
      outside = { id: outsideKey, code: outsideKey, capacity: 10, items: [] };
      memory.containers.push(outside);
    }
    if (!inside) {
      inside = { id: insideKey, code: insideKey, capacity: 10, items: [] };
      memory.containers.push(inside);
    }
    if (!outside.items.includes(inside.id)) outside.items.push(inside.id);
    return { ok: true };
  }
  return executePack(outsideId, insideId, rep);
});

app.get("/api/stow/locations", async () => {
  if (USE_MEMORY) {
    return memory ? memory.stowLocations : [];
  }
  const { rows } = await q(
    `SELECT l.id, l.shelf, l.depth, l.slot,
            COALESCE(ls.state, 'empty') AS status
     FROM ${DSLM_SCHEMA}.locations l
     LEFT JOIN ${DSLM_SCHEMA}.location_state ls ON ls.location_id = l.id
     ORDER BY l.shelf, l.depth, l.row, l.col;`
  );
  return rows.map((r) => ({ id: r.id, shelf: r.shelf, depth: `D${r.depth}`, level: r.slot, status: r.status }));
});

app.post("/api/stow/locations/:code/occupy", async (req, rep) => {
  const { code } = req.params;
  const { status = "occupied" } = req.body ?? {};
  const locId = String(code).trim().toUpperCase();
  if (USE_MEMORY) {
    if (!memory) return rep.code(404).send({ error: "NOT_FOUND" });
    const loc = memory.stowLocations.find((l) => l.id === locId);
    if (!loc) return rep.code(404).send({ error: "NOT_FOUND" });
    loc.status = status;
    return { ok: true };
  }
  const { rows } = await q(
    `UPDATE ${DSLM_SCHEMA}.location_state
     SET state = $1, updated_at = now()
     WHERE location_id = $2
     RETURNING location_id;`,
    [status, locId]
  );
  if (rows.length === 0) return rep.code(404).send({ error: "NOT_FOUND" });
  return { ok: true };
});

app.post("/api/moves", async (req, rep) => {
  const { fromContainer, toContainer, reason } = req.body ?? {};
  if (USE_MEMORY) {
    if (memory) memory.events.push({ type: "MOVE", payload: { fromContainer, toContainer, reason }, when: new Date().toISOString() });
    return { ok: true };
  }
  const payload = { from: fromContainer, to: toContainer, reason };
  return app.inject({ method: "POST", url: "/api/move", payload }).then((r) => r.json());
});

app.get("/api/tag/items", async () => {
  if (USE_MEMORY) {
    return memTagItems();
  }
  const { rows } = await q(`
    SELECT
      u.id,
      u.id AS code,
      COALESCE(u.name, u.id) AS name,
      CASE
        WHEN ui.status = 'NEEDS_VERIFY' THEN 'needs-verify'
        WHEN ui.status = 'TAGGED' THEN 'tagged'
        ELSE 'untagged'
      END AS status
    FROM ${DSLM_SCHEMA}.units u
    LEFT JOIN LATERAL (
      SELECT status
      FROM ${DSLM_SCHEMA}.unit_identifiers ui
      WHERE ui.unit_id = u.id
      ORDER BY ui.updated_at DESC
      LIMIT 1
    ) ui ON true
    ORDER BY u.id;
  `);
  return rows;
});

app.post("/api/tag/pair", async (req, rep) => {
  const { cardHex, itemId } = req.body ?? {};
  const card = normalizeHex(cardHex);
  const unitId = normalizeUnitId(itemId);
  if (!card || !unitId) return rep.code(400).send({ error: "BAD_REQUEST" });

  if (USE_MEMORY) {
    if (!memory.units.has(unitId)) {
      memory.units.set(unitId, {
        id: unitId,
        kind: "Item",
        name: unitId,
        category: "Unknown",
        status: "ACTIVE",
        metadata: {},
      });
    }
    memory.identifiers.set(card, { value: card, unitId, status: "NEEDS_VERIFY", type: "RFID", updated_at: new Date().toISOString() });
    return { ok: true, uid: card, itemId: unitId, when: new Date().toISOString() };
  }

  await q(
    `INSERT INTO ${DSLM_SCHEMA}.unit_identifiers (type, value, status, unit_id)
     VALUES ('RFID', $1, 'NEEDS_VERIFY', $2)
     ON CONFLICT (value)
     DO UPDATE SET unit_id = EXCLUDED.unit_id, status = 'NEEDS_VERIFY', updated_at = now();`,
    [card, unitId]
  );
  return { ok: true, uid: card, itemId: unitId, when: new Date().toISOString() };
});

app.post("/api/tag/verify", async (req, rep) => {
  const { cardHex } = req.body ?? {};
  const card = normalizeHex(cardHex);
  if (!card) return rep.code(400).send({ error: "BAD_REQUEST" });

  if (USE_MEMORY) {
    const entry = memory.identifiers.get(card);
    if (!entry) return rep.code(404).send({ error: "NOT_FOUND" });
    entry.status = "TAGGED";
    entry.updated_at = new Date().toISOString();
    return { ok: true, uid: card };
  }

  const { rows } = await q(
    `UPDATE ${DSLM_SCHEMA}.unit_identifiers SET status = 'TAGGED', updated_at = now() WHERE value = $1 RETURNING value;`,
    [card]
  );
  if (rows.length === 0) return rep.code(404).send({ error: "NOT_FOUND" });
  return { ok: true, uid: card };
});

// GET all meals in a blob by RFID (ordered by slot)
app.get("/api/blobs/:rfid/meals", async (req, rep) => {
  const { rfid } = req.params;
  const sql = `
    SELECT m.meal_id, b.blob_id, m.slot,
           m.meal_type_code, mt.kind AS meal_kind, mt.label AS meal_label,
           m.is_special, m.expiration_date, m.status,
           mt.energy_kcal, mt.vit_a_mcg_rae,
           mt.vit_b2_mg, mt.vit_b3_mg, mt.vit_b4_mg, mt.vit_b5_mg, mt.vit_b6_mg,
           mt.vit_b7_mg, mt.vit_b8_mg, mt.vit_b9_mg, mt.vit_b10_mg, mt.vit_b11_mg, mt.vit_b12_mg,
           m.created_at, m.updated_at
      FROM aether.blobs b
      JOIN aether.meals m       ON m.blob_id = b.blob_id
      JOIN aether.meal_types mt ON mt.code   = m.meal_type_code
     WHERE b.rfid = $1
     ORDER BY m.slot;
  `;
  const { rows } = await q(sql, [rfid]);
  if (rows.length === 0) return rep.code(404).send({ error: "NOT_FOUND" });
  return rows;
});

// PUT update a specific meal (by rfid + slot)
app.put("/api/blobs/:rfid/meals/:slot", async (req, rep) => {
  const { rfid, slot } = req.params;
  const body = req.body ?? {};

  // Accept a small set of fields
  const fields = {};
  if (body.meal_type_code !== undefined)
    fields.meal_type_code = Number(body.meal_type_code);
  if (body.is_special !== undefined)
    fields.is_special = Boolean(body.is_special);
  if (body.expiration_date !== undefined)
    fields.expiration_date = body.expiration_date; // 'YYYY-MM-DD'
  if (body.status !== undefined) fields.status = String(body.status); // e.g., 'FRESH'/'EXPIRED'/'USED'

  const keys = Object.keys(fields);
  if (keys.length === 0) return rep.code(400).send({ error: "NO_FIELDS" });

  // Build dynamic UPDATE
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const params = keys.map((k) => fields[k]);

  const sql = `
    WITH target AS (
      SELECT blob_id FROM aether.blobs WHERE rfid = $${params.length + 1}
    )
    UPDATE aether.meals m
       SET ${sets}, updated_at = now()
      FROM target t
     WHERE m.blob_id = t.blob_id AND m.slot = $${params.length + 2}
     RETURNING m.*;
  `;
  const { rows } = await q(sql, [...params, rfid, Number(slot)]);
  if (rows.length === 0) return rep.code(404).send({ error: "NOT_FOUND" });
  return rows[0];
});

// POST create/register a blob
app.post("/api/blobs", async (req, rep) => {
  const { rfid, slot_count = 4 } = req.body ?? {};
  if (!rfid || typeof rfid !== "string") {
    return rep.code(400).send({ error: "BAD_RFID" });
  }
  const { rows } = await q(
    `INSERT INTO aether.blobs (rfid, slot_count, status)
     VALUES ($1, $2, 'ACTIVE')
     ON CONFLICT (rfid) DO NOTHING
     RETURNING blob_id, rfid, slot_count, status, created_at, updated_at;`,
    [rfid, Number(slot_count)]
  );
  if (rows.length === 0) return rep.code(200).send({ info: "EXISTS" });
  return rows[0];
});

// bootstrap
const port = Number(process.env.PORT ?? 8080);
async function start() {
  if (!USE_MEMORY) {
    await ensureInventorySchema();
    await seedInventoryData();
    await ensureDlsmSchema();
    await seedDlsmData();
  } else {
    app.log.info("NO_DB=1 → running in memory mode (no persistence)");
  }

  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`API listening on http://localhost:${port}`);
}

export {
  app,
  ensureDlsmSchema,
  seedDlsmData,
  parseMovePath,
  buildLocationId,
  buildSlotKey,
  normalizeUnitId,
  normalizeShelf,
  normalizeSlot,
  normalizeDepth,
};

if (process.env.NODE_ENV !== "test") {
  start().catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
