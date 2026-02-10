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
    <div className="route-transition stagger-children" key={key}>
      <Routes location={location}>
        <Route path="/" element={<CrewView />} />
        <Route path="/crew" element={<CrewView />} />
        <Route path="/ground" element={<GroundView />} />
      </Routes>
    </div>
  );
}

export default function App() {
  // Fullscreen handler
  function goFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  }
  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#1a1a1a" }}>
        {/* Fullscreen button */}
        <button
          onClick={goFullscreen}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
            padding: "0.5em 1em",
            fontSize: "1.1em",
            borderRadius: "0.5em",
            border: "none",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
            opacity: 0.8,
          }}
        >
          ⛶ Fullscreen
        </button>
        {/* Main display area */}
        <main
          className="app-main animate-all"
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
