import React from "react";
import { LevelManager } from "../LevelManager";

interface Props {
  levelManager: LevelManager;
  selection: { id: string; name: string } | null;
  scale: number;
  userZoomFactor: number;
}

export const OverlayHUD: React.FC<Props> = ({
  levelManager,
  selection,
  scale,
  userZoomFactor
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        padding: "10px 14px",
        background: "rgba(0,0,0,0.6)",
        color: "#eee",
        fontFamily: "system-ui",
        borderRadius: 8,
        fontSize: 12,
        maxWidth: 420
      }}
    >
      <h3 style={{ margin: "0 0 6px", fontSize: 14 }}>Hierarchical Zoom Demo</h3>
      <p style={{ margin: 0 }}>
        Wheel: Zoom | Drag: Pan | 1–6: Level | Z/X: Step | Space: Center | Esc: Clear
      </p>
      <p style={{ margin: "6px 0 0" }}>
        Level: {levelManager.getInterpolatedName()} (baseScale {scale.toFixed(3)})
      </p>
      <p style={{ margin: "4px 0 0" }}>UserZoom: {userZoomFactor.toFixed(2)}</p>
      <p style={{ margin: "4px 0 0" }}>
        Selection: {selection ? `${selection.name} (${selection.id})` : "None"}
      </p>
    </div>
  );
};
