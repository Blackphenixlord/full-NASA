// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CrewView from "./views/CrewView";
import GroundView from "./views/GroundView";
import WarehouseView from "./views/WarehouseView";

/**
 * App — main shell with navigation and routing.
 * /crew  → astronaut terminal
 * /ground → logistics dashboard
 * /warehouse → warehouse/logistics operations
 */
export default function App() {
  return (
    <BrowserRouter>
      <div
        className="app-layout"
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif",
        }}
      >
        {/* Main display area */}
        <main
          className="app-main"
          style={{
            flex: "1 1 auto",
            padding: "0",
            background: "#1a1a1a",
            width: "100%",
          }}
        >
          <Routes>
            <Route path="/" element={<CrewView />} />
            <Route path="/crew" element={<CrewView />} />
            <Route path="/ground" element={<GroundView />} />
            <Route path="/warehouse" element={<WarehouseView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
