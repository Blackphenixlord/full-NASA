import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

function deepFreeze(obj) {
  if (!obj || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const k of Object.keys(obj)) deepFreeze(obj[k]);
  return obj;
}

function createMockData() {
  const inbound = [
    { id: "SHIP-8841", supplier: "Meals Vendor" },
    { id: "SHIP-8910", supplier: "Med Supply" },
    { id: "SHIP-8932", supplier: "Lab Equipment" },
    { id: "SHIP-8999", supplier: "Hygiene + Water" },
    { id: "SHIP-9050", supplier: "Spare Parts (Paperwork only)" },
  ];

  const manifestsByShipmentId = {
    "SHIP-8841": {
      manifestId: "MFT-2026-01-8841",
      po: "PO-KSC-ML-8841",
      supplier: "Meals Vendor",
      carrier: "KSC Ground Freight",
      shipDate: "2026-01-27",
      dock: "Dock 2",
      containers: "2 pallets",
      handling: "Ambient",
      lines: [
        {
          sku: "MEAL-PASTA-PRIM",
          name: "Pasta Primavera",
          expected: 18,
          counted: 12,
          issue: false,
        },
        {
          sku: "MEAL-CURRY-VEG",
          name: "Veggie Curry",
          expected: 18,
          counted: 18,
          issue: false,
        },
        {
          sku: "MEAL-OAT-BFST",
          name: "Oatmeal Breakfast",
          expected: 12,
          counted: 6,
          issue: false,
        },
      ],
    },

    "SHIP-8910": {
      manifestId: "MFT-2026-01-8910",
      po: "PO-KSC-MED-8910",
      supplier: "Med Supply",
      carrier: "FedEx Freight",
      shipDate: "2026-01-27",
      dock: "Dock 2",
      containers: "1 pallet + 2 totes",
      handling: "Keep dry",
      lines: [
        {
          sku: "MED-TRAUMA-KIT",
          name: "Trauma Kit",
          expected: 4,
          counted: 4,
          issue: false,
        },
        {
          sku: "MED-GAUZE-PACK",
          name: "Gauze Pack (sterile)",
          expected: 10,
          counted: 8,
          issue: true,
        },
        {
          sku: "MED-NITRILE-M",
          name: "Nitrile Gloves (M)",
          expected: 6,
          counted: 6,
          issue: false,
        },
        {
          sku: "MED-ALC-WIPES",
          name: "Alcohol Wipes",
          expected: 20,
          counted: 20,
          issue: false,
        },
      ],
    },

    "SHIP-8932": {
      manifestId: "MFT-2026-01-8932",
      po: "PO-KSC-LAB-8932",
      supplier: "Lab Equipment",
      carrier: "UPS Freight",
      shipDate: "2026-01-27",
      dock: "Dock 1",
      containers: "1 crate",
      handling: "ESD sensitive",
      lines: [
        {
          sku: "LAB-SENSOR-MOD",
          name: "Sensor Module",
          expected: 4,
          counted: 4,
          issue: false,
        },
        {
          sku: "LAB-HARNESS-CBL",
          name: "Harness Cable",
          expected: 2,
          counted: 2,
          issue: false,
        },
        {
          sku: "LAB-ESD-BAGS",
          name: "ESD Bags",
          expected: 25,
          counted: 25,
          issue: false,
        },
      ],
    },

    "SHIP-8999": {
      manifestId: "MFT-2026-01-8999",
      po: "PO-KSC-HYG-8999",
      supplier: "Hygiene + Water",
      carrier: "KSC Ground Freight",
      shipDate: "2026-01-27",
      dock: "Dock 3",
      containers: "1 pallet",
      handling: "Standard",
      lines: [
        {
          sku: "HYG-WATER-1L",
          name: "Potable Water (1L)",
          expected: 24,
          counted: 0,
          issue: false,
        },
        {
          sku: "HYG-SANITIZER",
          name: "Hand Sanitizer",
          expected: 6,
          counted: 0,
          issue: false,
        },
        {
          sku: "HYG-WIPES",
          name: "Surface Wipes",
          expected: 10,
          counted: 0,
          issue: false,
        },
        {
          sku: "HYG-TPACK",
          name: "Toiletry Pack",
          expected: 8,
          counted: 0,
          issue: false,
        },
      ],
    },

    "SHIP-9050": {
      manifestId: "MFT-2026-01-9050",
      po: "PO-KSC-SPR-9050",
      supplier: "Spare Parts (Paperwork only)",
      carrier: "Will-call / internal transfer",
      shipDate: "2026-01-27",
      dock: "Dock 2",
      containers: "0 (paperwork only)",
      handling: "N/A",
      lines: [],
    },
  };

  const receiveSeedByShipmentId = {
    "SHIP-8841": {
      processed: false,
      activeSku: "MEAL-PASTA-PRIM",
    },
    "SHIP-8910": {
      processed: false,
      activeSku: "MED-GAUZE-PACK",
    },
    "SHIP-8932": {
      processed: false,
      activeSku: "LAB-SENSOR-MOD",
    },
    "SHIP-8999": {
      processed: false,
      activeSku: "HYG-WATER-1L",
    },
    "SHIP-9050": {
      processed: false,
      activeSku: null,
    },
  };

  const shipmentHistoryById = {
    "SHIP-8841": [
      { when: "08:58", what: "Shipment arrived" },
      { when: "09:04", what: "Receiving started" },
      { when: "09:21", what: "Pallet 1 opened" },
    ],
    "SHIP-8910": [
      { when: "08:41", what: "Shipment arrived" },
      { when: "08:55", what: "Receiving started" },
      { when: "09:17", what: "Discrepancy flagged: Gauze Pack" },
    ],
    "SHIP-8932": [
      { when: "08:12", what: "Shipment arrived" },
      { when: "08:20", what: "Receiving started" },
      { when: "08:44", what: "Counts matched manifest" },
    ],
    "SHIP-8999": [{ when: "10:06", what: "Shipment arrived (waiting)" }],
    "SHIP-9050": [{ when: "11:10", what: "Paperwork received" }],
  };

  const shipmentContentsById = {
    "SHIP-8841": ["Pallet-01", "Pallet-02"],
    "SHIP-8910": ["Pallet-01", "Tote-A", "Tote-B"],
    "SHIP-8932": ["Crate-01"],
    "SHIP-8999": ["Pallet-01"],
    "SHIP-9050": [],
  };

  const tagQueue = [
    {
      id: "MEAL-0001",
      kind: "Meal",
      label: "Pasta Primavera",
      status: "Untagged",
      tone: "waiting",
    },
    {
      id: "MEAL-0002",
      kind: "Meal",
      label: "Veggie Curry",
      status: "Untagged",
      tone: "waiting",
    },
    {
      id: "BLOB-0001",
      kind: "Blob",
      label: "Meals x4 (Day 1)",
      status: "Needs verify",
      tone: "progress",
    },
    {
      id: "CTB-001",
      kind: "CTB",
      label: "0.05 CTB — Day 1 Meals",
      status: "Untagged",
      tone: "waiting",
    },
  ];

  const tagItemsByShipmentId = {
    "SHIP-8841": tagQueue,

    "SHIP-8910": [
      {
        id: "MED-0001",
        kind: "Med",
        label: "Trauma Kit",
        status: "Untagged",
        tone: "waiting",
      },
      {
        id: "MED-0002",
        kind: "Med",
        label: "Gauze Pack (sterile)",
        status: "Needs verify",
        tone: "progress",
      },
      {
        id: "CTB-010",
        kind: "CTB",
        label: "0.03 CTB — Med tote A",
        status: "Untagged",
        tone: "waiting",
      },
    ],

    "SHIP-8932": [
      {
        id: "LAB-0001",
        kind: "Lab",
        label: "Sensor Module",
        status: "Untagged",
        tone: "waiting",
      },
      {
        id: "LAB-0002",
        kind: "Lab",
        label: "Harness Cable",
        status: "Untagged",
        tone: "waiting",
      },
      {
        id: "CTB-020",
        kind: "CTB",
        label: "0.02 CTB — Lab crate",
        status: "Untagged",
        tone: "waiting",
      },
    ],

    "SHIP-8999": [
      {
        id: "HYG-0001",
        kind: "Hygiene",
        label: "Potable Water (1L)",
        status: "Untagged",
        tone: "waiting",
      },
      {
        id: "HYG-0002",
        kind: "Hygiene",
        label: "Hand Sanitizer",
        status: "Untagged",
        tone: "waiting",
      },
    ],

    "SHIP-9050": [],
  };

  const shipments = inbound.map((s) => ({
    id: s.id,
    label: `${s.id} • ${s.supplier}`,
    items: tagItemsByShipmentId[s.id] ?? [],
  }));

  const sourceMeals = Array.from({ length: 16 }).map((_, i) => ({
    id: `MEAL-${String(i + 1).padStart(4, "0")}`,
    type: ["Breakfast", "Lunch", "Dinner", "Snack"][i % 4],
    name: [
      "Pasta Primavera",
      "Veggie Curry",
      "Teriyaki Bowl",
      "Breakfast Burrito",
    ][i % 4],
    calories: [580, 540, 610, 520][i % 4],
    expiry: "2030-06-01",
  }));

  const stacks = {
    S1: Array.from({ length: 16 }).map((_, i) => ({
      id: `L${i + 1}`,
      state: i < 2 ? "occupied" : i < 4 ? "reserved" : "empty",
      label:
        i === 0
          ? "CTB-001"
          : i === 1
            ? "CTB-002"
            : i === 2
              ? "Reserved: Day 28 equip"
              : i === 3
                ? "Reserved: med"
                : "",
    })),
    S2: Array.from({ length: 16 }).map((_, i) => ({
      id: `L${i + 1}`,
      state: i === 7 ? "occupied" : "empty",
      label: i === 7 ? "CTB-SUP-007" : "",
    })),
    S3: Array.from({ length: 16 }).map((_, i) => ({
      id: `L${i + 1}`,
      state: "empty",
      label: "",
    })),
    C1: Array.from({ length: 16 }).map((_, i) => ({
      id: `L${i + 1}`,
      state: i < 1 ? "reserved" : "empty",
      label: i === 0 ? "Reserved: irregular" : "",
    })),
    C2: Array.from({ length: 16 }).map((_, i) => ({
      id: `L${i + 1}`,
      state: "empty",
      label: "",
    })),
  };

  const moveLog = [
    {
      id: "MV-001",
      ctb: "CTB-Meal-015",
      from: "S1-L12",
      to: "S2-L02",
      who: "Riley",
      when: "10:14",
    },
    {
      id: "MV-002",
      ctb: "CTB-Lab-003",
      from: "S2-L08",
      to: "S1-L05",
      who: "Jamie",
      when: "10:19",
    },
    {
      id: "MV-003",
      ctb: "CTB-Supply-007",
      from: "S2-L08",
      to: "S3-L01",
      who: "Manager",
      when: "10:25",
    },
  ];

  const data = {
    inbound,
    shipments,
    manifestsByShipmentId,
    receiveSeedByShipmentId,
    shipmentHistoryById,
    shipmentContentsById,

    tagItemsByShipmentId,
    tagQueue,
    sourceMeals,
    stacks,
    moveLog,
  };

  return deepFreeze(data);
}

// Keep a single in-memory dataset and a UID->item mapping for simulated tags.
const GLOBAL_DATA = createMockData();

// Pre-assign a few realistic UIDs to items so scans can resolve to items.
const assignedTags = {
  // UID: itemId
  "RFID-AB12CD34": "MEAL-0001",
  "RFID-1A2B3C4D": "MED-0001",
  "RFID-DEADBEEF": "LAB-0001",
};

app.get("/api/mock-data", (req, res) => {
  res.json(GLOBAL_DATA);
});

app.get("/api/shipments", (req, res) => {
  const data = createMockData();
  res.json(data.shipments || []);
});

app.get("/api/rfid/scan", (req, res) => {
  const uid = `RFID-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
  const itemId = assignedTags[uid] ?? null;
  let item = null;
  if (itemId) {
    // find item in shipments or tagQueue
    for (const s of GLOBAL_DATA.shipments || []) {
      const found = (s.items || []).find((i) => i.id === itemId);
      if (found) {
        item = found;
        break;
      }
    }
    if (!item) item = (GLOBAL_DATA.tagQueue || []).find((i) => i.id === itemId) ?? null;
  }

  res.json({ uid, item });
});

// Pair a UID to an itemId (POST body: { uid, itemId })
app.post('/api/rfid/pair', (req, res) => {
  const { uid, itemId } = req.body || {};
  if (!uid || !itemId) return res.status(400).json({ error: 'uid and itemId required' });
  assignedTags[uid] = itemId;
  return res.json({ ok: true, uid, itemId });
});

// Return manifest for a given shipment id
app.get('/api/manifests/:shipmentId', (req, res) => {
  const shipmentId = req.params.shipmentId;
  const data = createMockData();
  const manifest = data.manifestsByShipmentId?.[shipmentId] ?? null;
  if (!manifest) return res.status(404).json({ error: 'Not found' });
  return res.json(manifest);
});

// Return an item by id (search across tag queues)
app.get('/api/items/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const data = createMockData();
  // Search shipments' items
  for (const s of data.shipments || []) {
    const found = (s.items || []).find(i => i.id === itemId);
    if (found) return res.json(found);
  }
  // Search tagQueue fallback
  const found = (data.tagQueue || []).find(i => i.id === itemId);
  if (found) return res.json(found);
  return res.status(404).json({ error: 'Not found' });
});

// Server-Sent Events endpoint to stream RFID scans to clients
app.get('/api/rfid/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const sendUid = () => {
    const uid = `RFID-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    res.write(`data: ${JSON.stringify({ uid })}\n\n`);
  };

  // send one immediately then every 6-12s (randomized) to simulate scans
  sendUid();
  const iv = setInterval(sendUid, 6000 + Math.floor(Math.random() * 6000));

  req.on('close', () => {
    clearInterval(iv);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
