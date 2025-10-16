export interface Level {
  id: string;
  name: string;
  scale: number; // base scale (more = closer)
}

export class LevelManager {
  levels: Level[];
  currentIndex: number;
  targetIndex: number;
  transitionProgress: number;
  easeSpeed: number;

  constructor() {
    this.levels = [
      { id: "house", name: "House", scale: 1.0 },
      { id: "district", name: "District", scale: 0.5 },
      { id: "village", name: "Village", scale: 0.25 },
      { id: "state", name: "State", scale: 0.10 },
      { id: "country", name: "Country", scale: 0.04 },
      { id: "world", name: "World", scale: 0.01 }
    ];
    this.currentIndex = 0;
    this.targetIndex = 0;
    this.transitionProgress = 1;
    this.easeSpeed = 4;
  }

  get currentLevel(): Level {
    return this.levels[this.currentIndex];
  }
  get targetLevel(): Level {
    return this.levels[this.targetIndex];
  }

  requestLevel(idOrIndex: string | number) {
    const idx =
      typeof idOrIndex === "number"
        ? idOrIndex
        : this.levels.findIndex(l => l.id === idOrIndex);
    if (idx >= 0 && idx < this.levels.length && idx !== this.targetIndex) {
      this.targetIndex = idx;
      this.transitionProgress = 0;
    }
  }

  step(delta: number) {
    if (this.transitionProgress < 1) {
      this.transitionProgress += delta * this.easeSpeed;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.currentIndex = this.targetIndex;
      }
    }
  }

  getInterpolatedScale(): number {
    if (this.transitionProgress >= 1) return this.targetLevel.scale;
    const a = this.levels[this.currentIndex].scale;
    const b = this.targetLevel.scale;
    const t = easeInOutCubic(this.transitionProgress);
    return lerp(a, b, t);
  }

  getInterpolatedName(): string {
    if (this.transitionProgress >= 1) return this.targetLevel.name;
    const t = easeInOutCubic(this.transitionProgress);
    return t < 0.5
      ? `${this.levels[this.currentIndex].name} → ${this.targetLevel.name}`
      : this.targetLevel.name;
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
