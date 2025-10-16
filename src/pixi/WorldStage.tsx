import React, { useEffect, useRef, useCallback } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useSimStore } from '../store/simStore';
import { LEVELS, type LevelId } from '../simulation/levels';

// Register Pixi display objects for React-Pixi v8
extend({ Container, Graphics });

// More realistic terrain colors
const BG_COLOR = 0x8B9A6D; // Grassy terrain color
const FIELD_COLOR = 0xC4B876; // Wheat field color
const DIRT_ROAD_COLOR = 0x8B7355; // Dirt road/path color

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
  const rafRef = useRef<number | undefined>(undefined);
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
      const level = map[e.key];
      if (level) setLevel(level as LevelId);
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
  const handleStageClick = (ev: { data: { global: { x: number; y: number } } }) => {
    const sx = ev.data.global.x;
    const sy = ev.data.global.y;
    // Convert to world
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wx = (sx - width / 2) / scale + camera.x;
    const wy = (sy - height / 2) / scale + camera.y;

    // Farms first
    const pickedFarm = sim.farms.find(f => {
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
      const pickedPerson = sim.persons.find(p => {
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

  // Terrain background grid
  const terrainGraphics = (() => {
    const { x: cx, y: cy } = worldToScreen(0, 0);
    const gridSize = 120;
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;
    
    return (
      <pixiGraphics
        key="terrain"
        draw={g => {
          g.clear();
          // Draw field patches as background terrain
          for (let tx = -3000; tx < 3000; tx += gridSize) {
            for (let ty = -3000; ty < 3000; ty += gridSize) {
              const { x: sx, y: sy } = worldToScreen(tx, ty);
              if (sx < -200 || sx > viewWidth + 200 || sy < -200 || sy > viewHeight + 200) continue;
              
              const fieldType = (Math.abs(tx + ty * 7) % 3);
              let color = FIELD_COLOR;
              if (fieldType === 0) color = 0xA3B876; // Darker field
              if (fieldType === 1) color = 0xD4C896; // Lighter field
              
              g.rect(sx - gridSize * scale * 0.45 / 2, sy - gridSize * scale * 0.45 / 2, gridSize * scale * 0.45, gridSize * scale * 0.45);
              g.fill({ color, alpha: 0.4 });
            }
          }
          
          // Draw roads/paths connecting areas
          const roadWidth = Math.max(1, 3 * scale);
          g.moveTo(cx - 2000 * scale, cy);
          g.lineTo(cx + 2000 * scale, cy);
          g.stroke({ width: roadWidth, color: DIRT_ROAD_COLOR, alpha: 0.3 });
          
          g.moveTo(cx, cy - 2000 * scale);
          g.lineTo(cx, cy + 2000 * scale);
          g.stroke({ width: roadWidth, color: DIRT_ROAD_COLOR, alpha: 0.3 });
        }}
      />
    );
  })();

  // Farm graphics with realistic buildings
  const farmGraphics = sim.farms.map(farm => {
    const { x, y } = worldToScreen(farm.x, farm.y);
    const baseSize = 10 + Math.min(25, farm.landArea / 30);
    const buildingWidth = baseSize * 1.8;
    const buildingHeight = baseSize * 1.3;
    
    return (
      <pixiGraphics
        key={farm.id}
        x={x} y={y}
        interactive
        onPointerTap={() => {
          setSelection({ type: 'farm', id: farm.id });
          useSimStore.setState({
            camera: { ...camera, targetX: farm.x, targetY: farm.y }
          });
        }}
        draw={g => {
          g.clear();
          
          // Draw farmland area (fields around building)
          const fieldRadius = baseSize * 2.5;
          const fieldColor = farm.ownershipMode === 'private' ? 0xC4B876 : 0xB8A876;
          g.circle(0, 0, fieldRadius);
          g.fill({ color: fieldColor, alpha: 0.35 });
          
          // Draw small fence posts around farm
          const fencePosts = 8;
          const fenceWidth = Math.max(0.5, scale * 0.8);
          for (let i = 0; i < fencePosts; i++) {
            const angle = (i / fencePosts) * Math.PI * 2;
            const fx = Math.cos(angle) * fieldRadius * 0.85;
            const fy = Math.sin(angle) * fieldRadius * 0.85;
            g.moveTo(fx, fy - 3);
            g.lineTo(fx, fy + 3);
            g.stroke({ width: fenceWidth, color: 0x654321, alpha: 0.4 });
          }
          
          // Draw building shadow (for depth)
          g.rect(-buildingWidth/2 + 2, -buildingHeight/2 + 2, buildingWidth, buildingHeight);
          g.fill({ color: 0x000000, alpha: 0.15 });
          
          // Draw main building structure
          const buildingColor = farm.ownershipMode === 'private' ? 0x8B6F47 : 0x7A5F47;
          g.rect(-buildingWidth/2, -buildingHeight/2, buildingWidth, buildingHeight);
          g.fill({ color: buildingColor, alpha: 0.9 });
          
          // Draw building outline
          g.rect(-buildingWidth/2, -buildingHeight/2, buildingWidth, buildingHeight);
          g.stroke({ width: Math.max(0.5, scale * 0.5), color: 0x5A4A37, alpha: 0.8 });
          
          // Draw roof (transparent at house level to see inside)
          const roofAlpha = currentLevel === 'house' ? 0.25 : 0.85;
          const roofColor = farm.ownershipMode === 'private' ? 0xA52A2A : 0x8B0000;
          // Triangular roof
          g.moveTo(-buildingWidth/2 - 3, -buildingHeight/2);
          g.lineTo(buildingWidth/2 + 3, -buildingHeight/2);
          g.lineTo(0, -buildingHeight/2 - buildingHeight * 0.4);
          g.lineTo(-buildingWidth/2 - 3, -buildingHeight/2);
          g.fill({ color: roofColor, alpha: roofAlpha });
          
          // Draw windows (only visible at house level)
          if (currentLevel === 'house') {
            g.rect(-buildingWidth/4, -buildingHeight/4, 4, 4);
            g.rect(buildingWidth/4 - 4, -buildingHeight/4, 4, 4);
            g.fill({ color: 0xFFE4B5, alpha: 0.7 });
          }
          
          // Famine warning indicator
          if (farm.riskFamine > 0.3) {
            g.rect(-buildingWidth/2 - 4, -buildingHeight/2 - 4, buildingWidth + 8, buildingHeight + 8);
            g.stroke({ width: 2, color: 0xFFB400, alpha: farm.riskFamine });
          }
          
          // Selection highlight
          if (selection?.type === 'farm' && selection.id === farm.id) {
            g.rect(-buildingWidth/2 - 5, -buildingHeight/2 - 5, buildingWidth + 10, buildingHeight + 10);
            g.stroke({ width: 3, color: 0xFFFFFF, alpha: 1 });
          }
          
          // Overlay heat map
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
            
            const color = overlay === 'famineRisk'
              ? 0xFF3C00
              : overlay === 'grain'
              ? 0x78DCFF
              : 0x78FF78;
            g.circle(0, 0, baseSize * 3);
            g.fill({ color, alpha: 0.3 * val });
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
          interactive
          onPointerTap={() => {
            setSelection({ type: 'person', id: p.id });
          }}
          draw={g => {
            g.clear();
            
            // Draw person as a simple figure
            const personColor = p.displaced ? 0xFFA500 : 0x4A4A4A;
            
            // Shadow
            g.ellipse(0, 5, 2.5, 1);
            g.fill({ color: 0x000000, alpha: 0.2 });
            
            // Head
            g.circle(0, -1, 2.5);
            g.fill({ color: personColor, alpha: 1 });
            
            // Body
            g.rect(-1, 1, 2, 4);
            g.fill({ color: personColor, alpha: 1 });
            
            // Clothing detail (shirt)
            const clothColor = p.displaced ? 0xD2691E : 0x654321;
            g.rect(-1, 1, 2, 2);
            g.fill({ color: clothColor, alpha: 0.8 });
            
            // Selection highlight
            if (selection?.type === 'person' && selection.id === p.id) {
              g.circle(0, 1, 8);
              g.stroke({ width: 1.5, color: 0xFFFFFF, alpha: 1 });
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
      background={BG_COLOR}
      antialias={true}
      resolution={window.devicePixelRatio}
    >
      <pixiContainer onPointerDown={handleStageClick}>
        {terrainGraphics}
        {farmGraphics}
        {personGraphics}
      </pixiContainer>
    </Application>
  );
};
