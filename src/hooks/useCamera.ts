import { useCallback, useRef, useState } from "react";

export interface CameraState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  userZoomFactor: number;
}

export function useCamera() {
  const [camera, setCamera] = useState<CameraState>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    userZoomFactor: 1
  });

  const smooth = 8;
  const baseWorldSize = 5000;
  const minUserZoom = 0.5;
  const maxUserZoom = 2.5;

  const pixelRatio = useCallback(
    (levelScale: number, viewportWidth: number) =>
      levelScale * camera.userZoomFactor * (viewportWidth / baseWorldSize),
    [camera.userZoomFactor]
  );

  const step = useCallback((dt: number) => {
    setCamera(c => {
      const nx = c.x + (c.targetX - c.x) * Math.min(1, dt * smooth);
      const ny = c.y + (c.targetY - c.y) * Math.min(1, dt * smooth);
      return { ...c, x: nx, y: ny };
    });
  }, []);

  const center = useCallback(() => {
    setCamera(c => ({ ...c, targetX: 0, targetY: 0 }));
  }, []);

  const pan = useCallback(
    (dx: number, dy: number, levelScale: number, viewportWidth: number) => {
      const ratio = pixelRatio(levelScale, viewportWidth);
      setCamera(c => ({
        ...c,
        targetX: c.targetX - dx / ratio,
        targetY: c.targetY - dy / ratio
      }));
    },
    [pixelRatio]
  );

  const applyWheel = useCallback((deltaY: number) => {
    setCamera(c => {
      const factor = deltaY > 0 ? 0.9 : 1.1;
      let uz = c.userZoomFactor * factor;
      if (uz < minUserZoom) uz = minUserZoom;
      if (uz > maxUserZoom) uz = maxUserZoom;
      return { ...c, userZoomFactor: uz };
    });
  }, []);

  const worldToScreen = useCallback(
    (wx: number, wy: number, levelScale: number, viewportWidth: number, viewportHeight: number) => {
      const ratio = pixelRatio(levelScale, viewportWidth);
      const sx = (wx - camera.x) * ratio + viewportWidth / 2;
      const sy = (wy - camera.y) * ratio + viewportHeight / 2;
      return [sx, sy] as const;
    },
    [camera.x, camera.y, pixelRatio]
  );

  const screenToWorld = useCallback(
    (sx: number, sy: number, levelScale: number, viewportWidth: number, viewportHeight: number) => {
      const ratio = pixelRatio(levelScale, viewportWidth);
      const wx = (sx - viewportWidth / 2) / ratio + camera.x;
      const wy = (sy - viewportHeight / 2) / ratio + camera.y;
      return [wx, wy] as const;
    },
    [camera.x, camera.y, pixelRatio]
  );

  return {
    camera,
    step,
    center,
    pan,
    applyWheel,
    worldToScreen,
    screenToWorld
  };
}
