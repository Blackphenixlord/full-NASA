// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import CrewView from "./views/CrewView";
import GroundView from "./views/GroundView";

/**
 * App — main shell with navigation and routing.
 * /crew  → astronaut terminal
 * /ground → logistics dashboard
 */
function AnimatedRoutes() {
  const location = useLocation();
  const key = `${location.pathname}${location.search}`;

  return (
    <div className="route-transition" key={key}>
      <Routes location={location}>
        <Route path="/" element={<CrewView />} />
        <Route path="/crew" element={<CrewView />} />
        <Route path="/ground" element={<GroundView />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#1a1a1a" }}>
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
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
