import React, { useState } from "react";
import { LevelManager } from "./LevelManager";
import { WorldStage } from "./components/WorldStage";
import { OverlayHUD } from "./components/OverlayHUD";

const levelManager = new LevelManager();

export const App: React.FC = () => {
  const [selection, setSelection] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <WorldStage
        levelManager={levelManager}
        onSelectionChange={setSelection}
      />
      <OverlayHUD
        levelManager={levelManager}
        selection={selection}
        scale={levelManager.getInterpolatedScale()}
        userZoomFactor={1} // We could expose from camera hook if needed in HUD
      />
    </>
  );
};
