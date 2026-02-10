# Project Code Overview

## High-Level Architecture

This is a **NASA HUNCH** (High Schools United with NASA to Create Hardware) inventory management system designed for space missions. It consists of two main applications:

### 1. **NASA-HUNCH** (Primary Frontend)

A React + TypeScript + Vite single-page application with two distinct user roles:

- **Crew View**: Astronauts logging inventory usage in real-time
- **Ground View**: Mission control dashboard monitoring inventory status

### 2. **DLSM-INV-SYS-CLIENT-MAIN** (Backend System)

A Node.js backend with:

- Mock inventory data with RFID support
- Backend server (`dev-server/server.mjs`)
- OpenAPI schema definitions
- Database migrations and seeds
- Docker-based edge server

---

## Project Structure

```
test/
├── nasa-hunch/                    # Primary React app
│   ├── src/
│   │   ├── App.tsx                # Main router & layout
│   │   ├── main.tsx               # Entry point
│   │   ├── views/
│   │   │   ├── CrewView.tsx       # Astronaut terminal UI
│   │   │   └── GroundView.tsx     # Mission control dashboard
│   │   ├── screens/
│   │   │   ├── Dashboard.tsx      # KPI cards & metrics
│   │   │   ├── Inventory.tsx      # Item search & RFID scanning
│   │   │   └── Login.tsx          # Badge scanner authentication
│   │   └── lib/
│   │       ├── api.ts            # HTTP client & API calls
│   │       ├── types.ts          # TypeScript interfaces
│   │       ├── store.ts          # Mock inventory data
│   │       ├── ParamsContext.tsx # Mission config provider
│   │       └── useKeyboardWedgeScan.ts  # RFID scanner hook
│   ├── package.json               # React dependencies
│   └── vite.config.ts             # Vite bundler config
│
└── dlsm-temp/
    ├── dlsm-inv-sys-client-main/  # Backend system
    │   ├── dev-server/
    │   │   └── server.mjs         # Mock Node.js server
    │   ├── services/
    │   │   └── edge-server/       # Docker-based edge server
    │   ├── shared/
    │   │   ├── openapi/
    │   │   │   └── mission-inventory.yaml  # API schema
    │   │   └── schemas/           # JSON schema definitions
    │   ├── tests/
    │   │   └── fixtures/          # Test data
    │   └── package.json
    └── package.json               # Root workspace
```

---

## Core Components & Features

### **Frontend Architecture**

#### **App.tsx** - Main Shell

- Routes between `/` (default), `/crew`, `/ground`
- Dark theme styling (dark navy/black background)
- Uses React Router for navigation
- Wraps children in `ParamsProvider` for mission configuration

#### **Views**

##### **CrewView.tsx** - Astronaut Terminal

```
Purpose: Astronauts log inventory usage in real-time
Features:
  - Large RFID scan status indicator with color coding:
    - Green (ok) - item found & mapped
    - Amber (unknown) - tag not recognized
    - Red (error) - scan failed
  - Quick help section explaining workflow
  - RFID scan events listener (rfid:scan)
  - Displays item name, quantity, and last scanned tag
  - Embedded Inventory screen for detailed search & logging
```

Workflow:

1. Scan RFID tag (or search for item)
2. System automatically resolves item & location
3. User confirms IN/OUT action (logs automatically)
4. Visual feedback shows success/error

##### **GroundView.tsx** - Mission Control Dashboard

```
Purpose: Real-time inventory visibility for ground crew
Display Sections:
  1. Unknown RFID Scans
     - Shows unrecognized tags with timestamp, mode, qty, error msg
     - Helps identify mapping issues

  2. Recent Activity Log
     - All IN/OUT transactions with timestamps
     - Item SKU + name, location, quantity
     - Metadata: actor, work order, reason

  3. RFID Mappings
     - Tag → Item relationships
     - Last known location per tag
     - Editable mappings

  4. RFID Controller
     - Placeholder UI for future controller actions
     - Scan RFID Tag, Move Item, Map Tag operations
```

Auto-refresh every 2 seconds via `setInterval`
Listens for `inventory:updated` custom events

##### **Inventory.tsx** - Item Search & RFID Logging

```
Purpose: Detailed inventory management with RFID scanning
Features:
  - Search/filter items by name, SKU, description, ID
  - Two-panel layout:
    1. Item list (filterable)
    2. Item details (qty per location, actions)

  - RFID Scanning:
    - Global keyboard wedge scanner support
    - Auto-scan buffer (accumulates until pause)
    - Instant scan feedback

  - Manual Logging:
    - Modal dialogs for IN/OUT transactions
    - Fields: Item, Location, Qty, Work Order, Reason
    - Validates stock availability on OUT

  - RFID Tag Mapping:
    - Maps RFID cards to inventory items
    - Modal UI for tag → item assignment
```

Scan modes: OUT (checkout), IN (checkin/return)

##### **Dashboard.tsx** - KPI Cards

```
Purpose: High-level inventory health metrics
Metrics Displayed:
  1. Unique Items - total SKUs in system
  2. Stock Records - total qty batches
  3. Low / At Risk - items below safety stock
  4. Expiring ≤ 60 days - shelf-life warnings

Auto-refresh every 2 seconds
```

##### **Login.tsx** - Badge Scanner

```
Purpose: Authentication via RFID badge scanners
Features:
  - Badge database with actor IDs + UI modes
  - Auto-detect badge scan format
  - Keyboard wedge support (global keydown listener)
  - Debounced auto-submit (120ms pause threshold)
  - Visual feedback: error animation, success animation

Known Badges:
  - 0004726482 → max (crew)
  - 0004704735 → josh (crew)
  - 0004661610 → ben (crew)
  - 0004721084 → ground (ground)

Post-login: Sets localStorage, navigates to /crew or /ground
```

---

### **Library Files**

#### **api.ts** - HTTP Client

```typescript
// DTO Types (data transferred from backend)
export interface ItemDTO {
  id: string; sku: string; name: string;
  description?: string;
  safetyStock?: number; reorderPoint?: number;
  locQty?: number; total?: number; status?: string;
}

export interface LocationDTO {
  id: string; code: string; description?: string;
}

export interface StockDTO {
  itemId: string; locationId: string; qty: number;
  expiresAt?: string | null;
}

export interface LogDTO {
  id: string; timestamp: string; itemId: string; locationId: string;
  mode: "IN" | "OUT"; qty: number;
  actor?: string; reason?: string; workOrder?: string;
}

export interface RFIDScanResponse {
  ok: boolean; action?: "CHECKIN" | "CHECKOUT";
  itemId?: string; itemSku?: string; locationId?: string;
  cardHex?: string; qty?: number; newQty?: number;
  status?: string; log?: any; error?: string;
}

// API Surface
export const api = {
  items: () => getJSON<ItemDTO[]>("/items"),
  locations: () => getJSON<LocationDTO[]>("/locations"),
  stocks: () => getJSON<StockDTO[]>("/stocks"),
  logs: () => getJSON<LogDTO[]>("/logs"),
  config: () => getJSON<ConfigDTO>("/config"),
  checkout: (body) => postJSON("/checkout", body),
  checkin: (body) => postJSON("/checkin", body),
  // aliases for backward compatibility
  getItems, getLocations, getStocks, getLogs, getConfig
};

// RFID Operations
export async function rfidScan(body: {
  cardHex: string; mode: "IN" | "OUT";
  qty?: number; actor?: string; reason?: string;
  workOrder?: string; locationId?: string;
}): Promise<RFIDScanResponse> { ... }

export async function rfidMapTag(body: {
  cardHex: string; itemId: string; locationId: string;
}): Promise<{ ok: boolean; ... }> { ... }

export async function rfidUnknown(): Promise<RFIDUnknownRow[]> { ... }
export async function rfidMappings(): Promise<RFIDMappingRow[]> { ... }
export async function rfidMove(body: {
  cardHex: string; locationId: string;
}): Promise<{ ok: boolean; ... }> { ... }
```

#### **types.ts** - Domain Models

```typescript
// Inventory Item (SKU)
export interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string;
  safetyStock?: number; // qty <= this = AT RISK (red)
  reorderPoint?: number; // qty <= this = LOW (yellow)
}

// Storage Location
export interface Location {
  id: string;
  code: string;
  description?: string;
}

// Stock Record (qty of item at location)
export interface StockRecord {
  id: string;
  itemId: string;
  locationId: string;
  qty: number;
  expiresAt?: string; // ISO date for shelf-life
}

// Transaction Log (movement record)
export interface TransactionLog {
  id: string;
  timestamp: string;
  itemId: string;
  locationId: string;
  mode: "OUT" | "IN";
  qty: number;
  actor: string;
  reason?: string;
  workOrder?: string;
}
```

#### **ParamsContext.tsx** - Config Provider

```typescript
Purpose: Manage mission configuration at app level

Data Structure:
{
  role: string; // "astronaut", "ground_crew", etc.
  missionId: string; // mission identifier
  defaultLocationId: string; // fallback location for crew
  organization?: string;
  uiMode?: string; // "crew" or "ground"
}

Fetches from: /api/config (with optional ?mode= query param)
Fallback: Displays Login screen if no mode set
Loading: Shows "Booting..." message
Error: Displays failure message with details
```

#### **useKeyboardWedgeScan.ts** - Scanner Hook

```typescript
export function useKeyboardWedgeScan({
  enabled: boolean;
  onScan: (value: string) => void;
  minLength?: number; // default: 6
  maxDelayMs?: number; // default: 35ms
}): void

Purpose: Capture barcode/RFID scanner input via keyboard
Behavior:
  - Accumulates keystrokes into buffer
  - Resets buffer if gap > maxDelayMs (typical scanner = ~35ms per char)
  - Triggers onScan() when Enter pressed
  - Only accepts printable characters (e.key.length === 1)
```

#### **store.ts** - Mock Inventory Data

```typescript
// Mock Items
const ITEMS = [
  { id: "itm-001", sku: "CO2-FLTR-A", name: "CO₂ Scrubber Cartridge – Type A",
    safetyStock: 4, reorderPoint: 8 },
  { id: "itm-002", sku: "PWR-CKT-12V", name: "12 V Power Converter Board",
    safetyStock: 2, reorderPoint: 5 },
  { id: "itm-003", sku: "MED-SEALKIT", name: "Emergency Seal Kit",
    safetyStock: 1, reorderPoint: 3 },
];

// Mock Locations
const LOCATIONS = [
  { id: "loc-airlock", code: "AIRLOCK", description: "Airlock Locker A" },
  { id: "loc-bay-a", code: "BAY-A", description: "Equipment Bay A" },
  { id: "loc-med", code: "MED", description: "Medical / Trauma" },
];

// Mock Stock
const STOCKS = [
  { itemId: "itm-001", locationId: "loc-airlock", qty: 6, expiresAt: "2025-12-01" },
  { itemId: "itm-001", locationId: "loc-bay-a", qty: 4, expiresAt: "2025-12-01" },
  ...
];

// Transaction Log
let LOGS: TransactionLog[] = [];

// Helper Functions
export const store = {
  getItems: () => [...ITEMS],
  getLocations: () => [...LOCATIONS],
  getStocks: () => [...STOCKS],
  getLogs: () => [...LOGS],
  checkOut: (itemId, locationId, qty, actor, reason?, wo?) => { ... },
  checkIn: (itemId, locationId, qty, actor) => { ... },
};
```

---

### **Backend System (dev-server)**

#### **dev-server/server.mjs** - Mock HTTP Server

```javascript
Purpose: Development server with mock CRUD APIs

Key Features:
  - In-memory inventory database
  - 64 mock items (hardware parts, tools, consumables)
  - 12 mock storage locations
  - RFID tag mappings
  - Activity logging

Endpoints:
  GET /api/items         - List all items
  GET /api/locations     - List all locations
  GET /api/stocks        - List all stock records
  GET /api/logs          - List activity logs
  GET /api/config        - Mission configuration

  POST /api/checkout     - User checks out item
  POST /api/checkin      - User returns item

  POST /rfid/scan        - Process RFID card scan
  POST /rfid/map         - Map card → item
  POST /rfid/move        - Move item to new location
  GET  /rfid/unknown     - Unknown (unmapped) scans
  GET  /rfid/mappings    - Current RFID mappings

Auth: None (dev server, in-memory)
CORS: Enabled for localhost:5173 (Vite dev port)

Mock RFID Tags:
  - 3D00D51E2C → WRENCH-SET (LOC-A1)
  - 3D00D51E2D → BOLT-M6 (LOC-R1)
  - Generated tags for items 003-064
```

---

## UI Design & Styling

All components use **inline CSS with dark theme**:

- Primary background: `#0a0a0a` (almost black)
- Secondary: `#1a1a1a`, `#2a2a2a` (grays)
- Text: `#fff` (white), `#aaa` (reduced opacity)
- Borders: `#444`, `rgba(255,255,255,0.1)`

Status colors:

- ✅ Success/OK: `#22c55e` (green)
- ⚠️ Warning/Unknown: `#f59e0b` (amber)
- ❌ Error: `#ef4444` (red)

Grid layouts used throughout for responsive design.

---

## Data Flow & Communication

```
┌─────────────────────────────────────────────────────┐
│           CREW VIEW / ASTRONAUT TERMINAL             │
│                                                       │
│  1. RFID Scanner (keyboard wedge)                     │
│     → cardHex accumulated in buffer                   │
│     → On Enter: rfidScan(cardHex, mode, qty, actor) │
│     → Backend responds with item details             │
│     → Visual feedback (green/amber/red border)       │
│     → Emits custom event: rfid:scan                  │
│     → CrewView & GroundView listen & display result  │
│                                                       │
│  2. Manual Search & Logging                          │
│     → User searches by name/SKU                      │
│     → Selects item & location                        │
│     → Opens modal for IN/OUT action                  │
│     → Submits: api.checkout() or api.checkin()     │
│     → Backend logs transaction                       │
│     → UI updates after refresh                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│        GROUND VIEW / MISSION CONTROL DASHBOARD       │
│                                                       │
│  1. Auto-refresh every 2 seconds                     │
│     → GET /api/items, /api/logs, /api/rfid/*        │
│     → Update state with latest data                  │
│                                                       │
│  2. Listen for custom events                         │
│     → Window event: inventory:updated                │
│     → Trigger immediate refresh                      │
│                                                       │
│  3. Display:                                          │
│     - Unknown scans (troubleshooting)                │
│     - Activity log (recent transactions)             │
│     - RFID mappings (tag inventory)                  │
│     - RFID controller (future features)              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              LOGIN / AUTHENTICATION                  │
│                                                       │
│  1. Badge Scanner Input                              │
│     → Global keydown listener captures all keys      │
│     → Buffers characters until Enter or timeout      │
│                                                       │
│  2. Badge Lookup                                     │
│     → Normalize scanned string (strip special chars) │
│     → Match against BADGES database                  │
│                                                       │
│  3. Post-Login                                       │
│     → Set localStorage: actor, uiMode               │
│     → Navigate: /crew or /ground                     │
│     → ParamsProvider fetches /api/config             │
│     → Renders appropriate view                       │
└─────────────────────────────────────────────────────┘
```

---

## Key Technologies

### Frontend

- **React 19.1.1**: UI framework
- **TypeScript 5.9.3**: Type safety
- **Vite 7.1.7**: Lightning-fast bundler
- **React Router 7.9.4**: Client-side routing

### Backend

- **Node.js**: Runtime
- **Serialport 13.0.0**: RFID scanner hardware integration
- **PostgreSQL**: Optional database (for edge-server)
- **OpenAPI 3.0**: API schema definition

### Development

- **ESLint 9.38.0**: Code linting
- **Prettier 3.6.2**: Code formatting

---

## Screenshots Map (From Attachments)

1. **Receive Screen** - Shows inbound shipments (SHIP-8841, SHIP-8910, etc.)
   - Status indicators (In progress, Discrepancy, Waiting)
   - Expected vs Counted items
   - Manifest breakdown by meal type
   - Verify section with discrepancy flag

2. **Tag Screen** - RFID card scanning interface
   - UID input field with "Scan RFID or type UID" prompt
   - Selection pane showing items (MEAL-0001, MEAL-0002, BLOB-0001)
   - Pair + Verify section for pairing cards to items
   - Status: "Waiting" for scan input

3. **Pack Screen** - Container packing workflow
   - Outside/Inside scanning panes (Nothing selected)
   - Scan buttons for RFID/ID
   - Verify section with Outside/Inside contents counters
   - Room left / Inside size metrics
   - Pack & Clear all action buttons

4. **Stow Screen** - Storage location management
   - Stow tab selection (Top-level CTB / Irregular item)
   - Location grid (Shelf, Depth dimensions)
   - Warehouse layout visualization (L1-L16 slots)
   - Status: Standard CTB
   - Mark stowed action button

5. **Move Screen** - Item relocation
   - From/To location selection panels
   - Scan buttons for source & destination
   - Move reason dropdown (Space constraint)
   - Source & Destination container context
   - Execute move action button

---

## Current Status & Notes

### Implemented Features

✅ Two-role UI (Crew & Ground)
✅ RFID scanning support (keyboard wedge)
✅ Badge-based authentication
✅ Real-time inventory search
✅ IN/OUT transaction logging
✅ Item-to-location mapping
✅ Mock backend with REST API
✅ Dark theme UI

### Known Limitations

- Backend is in-memory (no persistence)
- RFID controller is placeholder UI
- No real database integration (yet)
- Limited error handling on some endpoints
- No user roles/permissions system (basic actor tracking only)

### Next Steps

- Integrate real database (PostgreSQL edge-server)
- Implement real RFID hardware drivers
- Add comprehensive error handling & validation
- Build admin dashboard for tag management
- Add mission-specific workflows (packing, stowing)
- Implement audit trail & compliance reporting

---

## How to Run

### Development

```bash
# Install dependencies
npm install
# or (in dlsm-temp root)
npm install

# Start dev server
npm run dev:server       # Backend (port 8080)
npm run dev              # Frontend (port 5173)

# Navigate
http://localhost:5173/   # Login page
http://localhost:5173/crew   # After crew badge scan
http://localhost:5173/ground # After ground badge scan
```

### Build

```bash
npm run build            # Frontend production bundle
npm run openapi:lint     # Validate OpenAPI schema
npm run fixtures:all     # Run test fixtures
```

---

## Code Quality & Patterns

### Component Patterns

- **Functional components** with hooks
- **useEffect** for side effects (API calls, event listeners)
- **useMemo** for expensive computations (lookups, filtering)
- **useState** for local UI state
- **Custom hooks** for reusable logic (useKeyboardWedgeScan, useParamsSafe)

### Error Handling

- Try-catch in async functions
- Error messages displayed in UI
- Console logging for debugging
- Graceful fallbacks for missing data

### Styling

- Inline CSS objects (no external CSS framework)
- Responsive grid layouts
- Dark theme throughout
- Consistent spacing & typography

### State Management

- Local component state for UI
- Context API for shared config
- Mock store for inventory data
- Backend as source of truth for persistence

---

This overview provides a complete picture of the codebase architecture, UI flows, and current implementation status.
