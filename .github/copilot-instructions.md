# Copilot Instructions for NASA HUNCH + DLSM Workspace

## Overview
This workspace contains multiple inventory and logistics UIs and mock backend services for NASA HUNCH and DSLM. It is organized as a multi-folder monorepo with distinct frontend apps and backend mock servers. The main goal is to enable rapid prototyping and transition to production-ready systems.

## Architecture
- **nasa-hunch/**: Main React + TypeScript + Vite UI. Features Crew, Ground, and Warehouse views. Uses Nord color theme and badge-based login.
- **dlsm-temp/**: Contains DLSM client, mock server, schemas, and edge-server services. Includes dev-server for API and tag seeding.
- **frontend-dslm/**: Secondary frontend for DSLM, with explicit backend requirements and domain logic for nested containers and stowage locations.

## Developer Workflows
- **Frontend Start**: Run `./start-frontend.ps1` from repo root (PowerShell, Windows recommended). Starts Vite dev server for `nasa-hunch`.
- **Backend Start**: Run `./start-server.ps1` from repo root. Starts edge-server API in memory mode.
- **Node.js Required**: Use Node 22.12+ (or 20.19+). Vite and backend scripts expect this version.

## Project-Specific Conventions
- **Mock-first, Production-shaped**: Backend APIs and data models are designed to support both mock and real inventory, with audit trails and deterministic behavior. Prefer synthetic fallback early, but keep constraints configurable.
- **Inventory Tree**: Items are tracked as nodes in a tree (container-in-container, slot, etc.). Moves are atomic and audited.
- **UI Routing**: Badge-based login determines Crew/Ground/Warehouse views.
- **Schema Governance**: All schemas are in `dlsm-temp/shared/schemas/`. Use `scripts/compile-schemas.mjs` for schema compilation.

## Integration Points
- **Frontend ↔ Backend**: Main UI (`nasa-hunch`) connects to mock backend in `dlsm-temp/dlsm-inv-sys-client-main/dev-server/server.mjs`.
- **Edge Server**: API server in `dlsm-temp/dlsm-inv-sys-client-main/services/edge-server`.
- **Shared Schemas**: Located in `dlsm-temp/shared/schemas/`.

## Patterns & Examples
- **Atomic Move Operations**: See backend README for move logic and audit requirements.
- **Consistent UI Layout**: All screens use Nord theme and responsive layouts.
- **Badge Login**: See `nasa-hunch/src/screens/Login.tsx` for routing logic.

## External Dependencies
- **Vite**: Used for all React frontends.
- **PowerShell Scripts**: Provided for Windows users; adapt for Linux/Mac as needed.

## Key Files & Directories
- `nasa-hunch/src/views/` and `nasa-hunch/src/screens/`: UI structure.
- `dlsm-temp/dlsm-inv-sys-client-main/dev-server/server.mjs`: Mock backend.
- `dlsm-temp/shared/schemas/`: Schema definitions.
- `frontend-dslm/src/screens/`: DSLM-specific screens.

---

> Update this file as architecture or workflows evolve. For unclear patterns, consult project READMEs or `PROJECT_OVERVIEW.md`.
