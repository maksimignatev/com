import { create } from 'zustand';
import { TimeController } from '../simulation/TimeController';
import { createInitialEntities } from '../simulation/initialEntities';
import { Simulation } from '../simulation/Simulation';
import { type LevelId, LEVEL_SEQUENCE } from '../simulation/levels';

export interface SimStore {
  time: TimeController;
  sim: Simulation;
  initialized: boolean;
  targetLevel: LevelId;
  currentLevel: LevelId;
  overlay: 'none' | 'grain' | 'morale' | 'famineRisk';
  selection: { type: 'farm' | 'person'; id: string } | null;
  playing: boolean;
  fastForward: boolean;
  camera: {
    x: number; y: number;
    targetX: number; targetY: number;
    userZoom: number;
  };
  initialize: () => void;
  setOverlay: (o: SimStore['overlay']) => void;
  setLevel: (id: LevelId) => void;
  setSelection: (sel: SimStore['selection']) => void;
  centerCamera: () => void;
  nudgeCamera: (dx: number, dy: number) => void;
  adjustZoom: (factor: number) => void;
  togglePlay: () => void;
  toggleFast: () => void;
  advanceDay: () => void;
}

export const useSimStore = create<SimStore>((set, get) => ({
  time: new TimeController(),
  sim: new Simulation(),
  initialized: false,
  targetLevel: 'house',
  currentLevel: 'house',
  overlay: 'none',
  selection: null,
  playing: true,
  fastForward: false,
  camera: { x: 0, y: 0, targetX: 0, targetY: 0, userZoom: 1 },

  initialize: () => {
    if (get().initialized) return;
    const entities = createInitialEntities();
    const sim = get().sim;
    sim.init(entities);
    set({ initialized: true });
  },

  setOverlay: (o) => set({ overlay: o }),

  // Immediate level switch (if you later want smooth transitions,
  // add a transition progress field instead of writing currentLevel directly).
  setLevel: (id) => {
    if (!LEVEL_SEQUENCE.includes(id)) return;
    const st = get();
    if (st.targetLevel === id && st.currentLevel === id) return;
    set({ targetLevel: id, currentLevel: id });
  },

  setSelection: (sel) => set({ selection: sel }),

  centerCamera: () =>
    set(s => ({ camera: { ...s.camera, targetX: 0, targetY: 0 } })),

  nudgeCamera: (dx, dy) =>
    set(s => {
      const scale = 1; // using normalized; smoothing handled in component
      return {
        camera: {
          ...s.camera,
          targetX: s.camera.targetX - dx / (scale * s.camera.userZoom),
          targetY: s.camera.targetY - dy / (scale * s.camera.userZoom)
        }
      };
    }),

  adjustZoom: (factor) =>
    set(s => ({
      camera: {
        ...s.camera,
        userZoom: Math.min(4, Math.max(0.3, s.camera.userZoom * factor))
      }
    })),

  togglePlay: () => set(s => ({ playing: !s.playing })),

  toggleFast: () => set(s => ({ fastForward: !s.fastForward })),

  advanceDay: () => {
    const time = get().time;
    time.stepDay();
    get().sim.dailyTick(time.currentEra);
  }
}));
