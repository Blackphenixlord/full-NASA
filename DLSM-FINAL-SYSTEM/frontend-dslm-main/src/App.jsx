import React, { useState, useEffect } from "react";

// Data
import { createMockData } from "./data/mockData";
import { getMockData } from "./services/api";

// Shared layout/components
import TopBar from "./components/TopBar";
import SideNav from "./components/SideNav";
import Inspector from "./components/Inspector";

// Screens
import ReceiveScreen from "./screens/ReceiveScreen";
import TagScreen from "./screens/TagScreen";
import PackScreen from "./screens/PackScreen";
import StowScreen from "./screens/LoadScreen";
import MoveScreen from "./screens/MoveScreen";

const SCREENS = [
  { key: "receive", label: "Receive" },
  { key: "tag", label: "Tag" },
  { key: "pack", label: "Pack" },
  { key: "stow", label: "Stow" },
  { key: "move", label: "Move" },
];

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getMockData()
      .then((d) => {
        if (!mounted) return;
        if (d) setData(d);
        else setData(createMockData());
      })
      .catch(() => {
        if (!mounted) return;
        setData(createMockData());
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => (mounted = false);
  }, []);

  const [screen, setScreen] = useState("receive");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorEntity, setInspectorEntity] = useState(null);

  function openInspector(entity) {
    setInspectorEntity(entity ?? null);
    setInspectorOpen(true);
  }

  function closeInspector() {
    setInspectorOpen(false);
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden"
      style={{ background: "#2e3440" }}
    >
      <div className="h-full flex flex-col">
        <TopBar />

        <div className="flex-1 min-h-0 flex">
          <SideNav screens={SCREENS} activeKey={screen} onPick={setScreen} />

          <main className="flex-1 min-w-0 min-h-0 p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-white">Loading data…</div>
              </div>
            ) : (
              <>
                {screen === "receive" ? (
                  <ReceiveScreen data={data} onInspect={openInspector} />
                ) : null}
                {screen === "tag" ? (
                  <TagScreen data={data} onInspect={openInspector} />
                ) : null}
                {screen === "pack" ? (
                  <PackScreen data={data} onInspect={openInspector} />
                ) : null}
                {screen === "stow" ? (
                  <StowScreen data={data} onInspect={openInspector} />
                ) : null}
                {screen === "move" ? (
                  <MoveScreen data={data} onInspect={openInspector} />
                ) : null}
              </>
            )}
          </main>

          <Inspector
            open={inspectorOpen}
            entity={inspectorEntity}
            onClose={closeInspector}
          />
        </div>
      </div>
    </div>
  );
}
