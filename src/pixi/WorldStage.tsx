import React, { useEffect, useRef, useCallback } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useSimStore } from '../store/simStore';
import { LEVELS, LEVEL_SEQUENCE } from '../simulation/levels';

// Register Pixi display objects for React-Pixi v8
extend({ Container, Graphics });

const BG_COLOR = 0x0f1419;

export const WorldStage: React.FC = () => {
  // Select primitive values and functions separately to avoid selector instability
  const sim = useSimStore(s => s.sim);
  const time = useSimStore(s => s.time);
  const camera = useSimStore(s => s.camera);
  const targetLevel = useSimStore(s => s.targetLevel);
  const currentLevel = useSimStore(s => s.currentLevel);
  const selection = useSimStore(s => s.selection);
  const overlay = useSimStore(s => s.overlay);
  const setSelection = useSimStore(s => s.setSelection);
  const setLevel = useSimStore(s => s.setLevel);

  // Level interpolation (simple direct assignment after threshold)
  // You could animate transitions with local state (tween).
  useEffect(() => {
    // When target changes, we could animate; simplified by immediate commit:
    useSimStore.setState({ currentLevel: targetLevel });
  }, [targetLevel]);

  // Simulation time advancement loop
  const rafRef = useRef<number>();
  const lastRef = useRef<number>(performance.now());
  const dayAccumRef = useRef(0);
  const secondsPerDay = 0.6;

  const loop = useCallback((now: number) => {
    const delta = (now - lastRef.current) / 1000;
    lastRef.current = now;

    const playing = useSimStore.getState().playing;
    const fast = useSimStore.getState().fastForward;
    if (playing) {
      dayAccumRef.current += delta * (fast ? 10 : 1);
      if (dayAccumRef.current >= secondsPerDay) {
        dayAccumRef.current = 0;
        time.stepDay();
        sim.dailyTick(time.currentEra);
      }
    }

    // Smooth camera movement
    const st = useSimStore.getState();
    const cam = st.camera;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smooth = Math.min(1, delta * 4);
    const newCam = {
      ...cam,
      x: lerp(cam.x, cam.targetX, smooth),
      y: lerp(cam.y, cam.targetY, smooth)
    };
    useSimStore.setState({ camera: newCam });

    rafRef.current = requestAnimationFrame(loop);
  }, [sim, time]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  // Input handlers
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      useSimStore.getState().adjustZoom(e.deltaY > 0 ? 0.9 : 1.1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        useSimStore.getState().centerCamera();
      }
      const map: Record<string,string> = { '1':'house','2':'district','3':'village','4':'state','5':'country','6':'world' };
      if (map[e.key]) setLevel(map[e.key] as any);
    };
    let dragging = false;
    let lx = 0, ly = 0;
    const onDown = (e: MouseEvent) => {
      if (e.button === 0) { dragging = true; lx = e.clientX; ly = e.clientY; }
    };
    const onMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = e.clientX - lx;
        const dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY;
        useSimStore.getState().nudgeCamera(dx, dy);
      }
    };
    const onUp = () => dragging = false;

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setLevel]);

  // Coordinate transforms
  const scale = LEVELS[currentLevel].scale * camera.userZoom;

  const worldToScreen = (wx: number, wy: number) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      x: (wx - camera.x) * scale + width / 2,
      y: (wy - camera.y) * scale + height / 2
    };
  };

  // Picking (farms + persons)
  const handleStageClick = (ev: any) => {
    const sx = ev.data.global.x;
    const sy = ev.data.global.y;
    // Convert to world
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wx = (sx - width / 2) / scale + camera.x;
    const wy = (sy - height / 2) / scale + camera.y;

    // Farms first
    let pickedFarm = sim.farms.find(f => {
      const dx = f.x - wx;
      const dy = f.y - wy;
      return Math.sqrt(dx*dx + dy*dy) < 30;
    });
    if (pickedFarm) {
      setSelection({ type: 'farm', id: pickedFarm.id });
      useSimStore.setState({
        camera: { ...camera, targetX: pickedFarm.x, targetY: pickedFarm.y }
      });
      return;
    }

    if (currentLevel === 'house') {
      let pickedPerson = sim.persons.find(p => {
        const farm = sim.farms.find(f => f.id === p.farmId);
        if (!farm) return false;
        const dx = farm.x - wx;
        const dy = farm.y - wy;
        return Math.sqrt(dx*dx + dy*dy) < 18;
      });
      if (pickedPerson) {
        setSelection({ type: 'person', id: pickedPerson.id });
        return;
      }
    }
    setSelection(null);
  };

  // Farm graphics
  const farmGraphics = sim.farms.map(farm => {
    const { x, y } = worldToScreen(farm.x, farm.y);
    const r = 10 + Math.min(25, farm.landArea / 30);
    return (
      <pixiGraphics
        key={farm.id}
        x={x} y={y}
        interactive
        pointertap={() => {
          setSelection({ type: 'farm', id: farm.id });
          useSimStore.setState({
            camera: { ...camera, targetX: farm.x, targetY: farm.y }
          });
        }}
        draw={g => {
          g.clear();
          const baseColor = farm.ownershipMode === 'private' ? 0x52c28d : 0xc2527d;
          g.beginFill(baseColor, 0.85).drawCircle(0,0,r).endFill();
          // Famine ring
          const famineAlpha = farm.riskFamine;
            g.lineStyle(2, 0xFFB400, famineAlpha).drawCircle(0,0,r);
          // Selection ring
          if (selection?.type === 'farm' && selection.id === farm.id) {
            g.lineStyle(3, 0xffffff, 1).drawCircle(0,0,r+4);
          }
          // Overlay heat
          if (overlay !== 'none') {
            let val = 0;
            if (overlay === 'grain') {
              val = (farm.yieldHistory.at(-1) ?? 0) / 100;
            } else if (overlay === 'morale') {
              const persons = sim.persons.filter(p => p.farmId === farm.id && !p.displaced);
              const moraleAvg = persons.reduce((a,p)=>a+p.morale,0)/Math.max(1,persons.length);
              val = moraleAvg;
            } else if (overlay === 'famineRisk') {
              val = farm.riskFamine;
            }
            val = Math.min(1, Math.max(0, val));
            // radial approximate
            const color = overlay === 'famineRisk'
              ? 0xFF3C00
              : overlay === 'grain'
              ? 0x78DCFF
              : 0x78FF78;
            g.beginFill(color, 0.25 * val).drawCircle(0,0,r*2).endFill();
          }
        }}
      />
    );
  });

  // Person markers (only subset & only at house level)
  const personGraphics = currentLevel === 'house'
    ? sim.persons.slice(0, 120).map(p => {
      const farm = sim.farms.find(f => f.id === p.farmId);
      if (!farm) return null;
      const jitterX = (Math.random()-0.5)*14;
      const jitterY = (Math.random()-0.5)*14;
      const { x, y } = worldToScreen(farm.x + jitterX, farm.y + jitterY);
      return (
        <pixiGraphics
          key={p.id}
          x={x} y={y}
          draw={g => {
            g.clear();
            g.beginFill(p.displaced ? 0xffa500 : 0xdbe2e9, 1).drawCircle(0,0,3).endFill();
            if (selection?.type === 'person' && selection.id === p.id) {
              g.lineStyle(1.5, 0xffffff,1).drawCircle(0,0,6);
            }
          }}
        />
      );
    })
    : null;

  return (
    <Application
      width={window.innerWidth}
      height={window.innerHeight}
      options={{
        background: BG_COLOR,
        antialias: true,
        resolution: window.devicePixelRatio
      }}
      onpointerdown={handleStageClick}
    >
      <pixiContainer>
        {farmGraphics}
        {personGraphics}
      </pixiContainer>
    </Application>
  );
};
