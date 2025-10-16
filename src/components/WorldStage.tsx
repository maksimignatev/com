import React, { useCallback, useEffect, useRef, useState } from "react";
import { Application, extend } from "@pixi/react";
import * as PIXI from "pixi.js";
import { Container, Graphics, Text } from "pixi.js";
import { LevelManager } from "../LevelManager";
import { WorldData } from "../WorldData";
import { useCamera } from "../hooks/useCamera";
import { EntityDot } from "./EntityDot";

// Register Pixi display objects for React-Pixi v8
extend({ Container, Graphics, Text });

interface Props {
  levelManager: LevelManager;
  onSelectionChange: (sel: { id: string; name: string } | null) => void;
}

export const WorldStage: React.FC<Props> = ({ levelManager, onSelectionChange }) => {
  const { camera, step, pan, applyWheel, worldToScreen, screenToWorld } = useCamera();
  const [selection, setSelection] = useState<{ id: string; name: string } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  /** ---------- Resize ---------- */
  const onResize = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }, []);
  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [onResize]);

  /** ---------- Animation Loop ---------- */
  useEffect(() => {
    let last = performance.now();
    let raf: number;

    const loop = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      levelManager.step(delta);
      step(delta);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [levelManager, step]);

  /** ---------- Pointer Controls ---------- */
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = () => (dragging.current = false);
  const handlePointerMove = (e: PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    pan(-dx, -dy, levelManager.getInterpolatedScale(), viewport.w);
  };
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    applyWheel(e.deltaY);
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [applyWheel, pan, viewport.w, levelManager]);

  /** ---------- Keyboard ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "6") {
        levelManager.requestLevel(parseInt(e.key) - 1);
      } else if (e.key === "z" || e.key === "Z") {
        levelManager.requestLevel(Math.max(0, levelManager.targetIndex - 1));
      } else if (e.key === "x" || e.key === "X") {
        levelManager.requestLevel(
          Math.min(levelManager.levels.length - 1, levelManager.targetIndex + 1)
        );
      } else if (e.key === "Escape") {
        setSelection(null);
        onSelectionChange(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [levelManager, onSelectionChange]);

  /** ---------- Click Picking ---------- */
  const handleStageClick = (e: React.MouseEvent) => {
    const scale = levelManager.getInterpolatedScale();
    const [wx, wy] = screenToWorld(e.clientX, e.clientY, scale, viewport.w, viewport.h);
    const picked = pickEntity(levelManager.targetLevel.id, wx, wy);
    setSelection(picked);
    onSelectionChange(picked);
  };

  const scale = levelManager.getInterpolatedScale();

  /** ---------- Render ---------- */
  return (
    <div ref={stageRef} style={{ width: "100vw", height: "100vh" }}>
      <Application
        width={viewport.w}
        height={viewport.h}
        options={{
          background: 0x111111,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
        }}
        onpointerdown={handleStageClick}
      >
        <pixiContainer>
          {/* Bounds Layers */}
          <BoundsGraphics
            bounds={WorldData.world.bounds}
            label="World"
            alpha={0.08}
            color={0x224466}
            scale={scale}
            worldToScreen={worldToScreen}
            viewport={viewport}
          />
          <BoundsGraphics
            bounds={WorldData.country.bounds}
            label="Country"
            alpha={0.12}
            color={0x334466}
            scale={scale}
            worldToScreen={worldToScreen}
            viewport={viewport}
          />
          <BoundsGraphics
            bounds={WorldData.state.bounds}
            label="State"
            alpha={0.16}
            color={0x444466}
            scale={scale}
            worldToScreen={worldToScreen}
            viewport={viewport}
          />
          <BoundsGraphics
            bounds={WorldData.village.bounds}
            label="Village"
            alpha={0.2}
            color={0x444476}
            scale={scale}
            worldToScreen={worldToScreen}
            viewport={viewport}
          />
          <BoundsGraphics
            bounds={WorldData.district.bounds}
            label="District"
            alpha={0.24}
            color={0x446644}
            scale={scale}
            worldToScreen={worldToScreen}
            viewport={viewport}
          />
          <BoundsGraphics
            bounds={WorldData.house.bounds}
            label="House"
            alpha={0.35}
            color={0x559955}
            scale={scale}
            worldToScreen={worldToScreen}
            viewport={viewport}
          />

          {/* Entities */}
          <EntityLayer
            levelId={levelManager.targetLevel.id}
            selection={selection}
            scale={scale}
            worldToScreen={worldToScreen}
            viewport={viewport}
            onSelect={(sel) => {
              setSelection(sel);
              onSelectionChange(sel);
            }}
          />

          <HUDText
            text={`Scale: ${scale.toFixed(3)} | Zoom: ${camera.userZoomFactor.toFixed(2)}`}
            x={viewport.w - 16}
            y={24}
            anchor={1}
          />
        </pixiContainer>
      </Application>
    </div>
  );
};

/* ---------- Helper Components ---------- */
interface BoundsGraphicsProps {
  bounds: { x: number; y: number; w: number; h: number };
  label: string;
  alpha: number;
  color: number;
  scale: number;
  worldToScreen: (
    wx: number,
    wy: number,
    levelScale: number,
    viewportWidth: number,
    viewportHeight: number
  ) => readonly [number, number];
  viewport: { w: number; h: number };
}

const BoundsGraphics: React.FC<BoundsGraphicsProps> = ({
  bounds,
  label,
  alpha,
  color,
  scale,
  worldToScreen,
  viewport,
}) => {
  const [x1, y1] = worldToScreen(bounds.x, bounds.y, scale, viewport.w, viewport.h);
  const [x2, y2] = worldToScreen(bounds.x + bounds.w, bounds.y + bounds.h, scale, viewport.w, viewport.h);

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();
      g.beginFill(color, alpha);
      g.lineStyle(1, 0xffffff, 1);
      g.drawRect(x1, y1, x2 - x1, y2 - y1);
      g.endFill();
    },
    [x1, y1, x2, y2, color, alpha]
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={draw} />
      <pixiText text={label} x={x1 + 6} y={y1 + 6} style={{ fontSize: 12, fill: 0xffffff }} />
    </pixiContainer>
  );
};

interface EntityLayerProps {
  levelId: string;
  selection: { id: string; name: string } | null;
  scale: number;
  worldToScreen: (
    wx: number,
    wy: number,
    levelScale: number,
    viewportWidth: number,
    viewportHeight: number
  ) => readonly [number, number];
  viewport: { w: number; h: number };
  onSelect: (entity: { id: string; name: string } | null) => void;
}

const EntityLayer: React.FC<EntityLayerProps> = ({
  levelId,
  selection,
  scale,
  worldToScreen,
  viewport,
  onSelect,
}) => {
  let list: { id: string; name: string; x: number; y: number }[] = [];
  let color = 0xffcc55;

  switch (levelId) {
    case "house":
      list = WorldData.house.persons;
      color = 0xffcc55;
      break;
    case "district":
      list = WorldData.district.houses;
      color = 0x55ddaa;
      break;
    case "village":
      list = WorldData.village.districts;
      color = 0x88ffaa;
      break;
    case "state":
      list = WorldData.state.villages;
      color = 0x66aaff;
      break;
    case "country":
      list = WorldData.country.states;
      color = 0xaa66ff;
      break;
    case "world":
      list = WorldData.world.countries;
      color = 0xff6699;
      break;
  }

  return (
    <>
      {list.map((ent) => {
        const [sx, sy] = worldToScreen(ent.x, ent.y, scale, viewport.w, viewport.h);
        return (
          <pixiContainer key={ent.id}>
            <EntityDot
              x={sx}
              y={sy}
              name={ent.name}
              selected={selection?.id === ent.id}
              color={color}
              onClick={() => onSelect(ent)}
            />
            <pixiText text={ent.name} x={sx + 14} y={sy - 4} style={{ fontSize: 12, fill: 0xffffff }} />
          </pixiContainer>
        );
      })}
    </>
  );
};

const HUDText: React.FC<{ text: string; x: number; y: number; anchor?: number }> = ({
  text,
  x,
  y,
  anchor = 0,
}) => <pixiText text={text} x={x} y={y} anchor={anchor} style={{ fontSize: 14, fill: 0xffffff }} />;

/* ---------- Picking ---------- */
function pickEntity(levelId: string, wx: number, wy: number) {
  let list: { id: string; name: string; x: number; y: number }[] = [];
  switch (levelId) {
    case "house":
      list = WorldData.house.persons;
      break;
    case "district":
      list = WorldData.district.houses;
      break;
    case "village":
      list = WorldData.village.districts;
      break;
    case "state":
      list = WorldData.state.villages;
      break;
    case "country":
      list = WorldData.country.states;
      break;
    case "world":
      list = WorldData.world.countries;
      break;
  }

  const radius = 25;
  let closest: { id: string; name: string; x: number; y: number } | null = null;
  let bestDist = Infinity;

  for (const e of list) {
    const dx = e.x - wx;
    const dy = e.y - wy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius && dist < bestDist) {
      bestDist = dist;
      closest = e;
    }
  }
  return closest;
}

export { pickEntity };
