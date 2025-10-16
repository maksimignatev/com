let FARM_SEQ = 1;
export class Farm {
  id: string;
  name: string;
  x: number;
  y: number;
  landArea: number;
  ownershipMode: 'private' | 'collective';
  productivityBase: number;
  mechanizationLevel: number;
  riskFamine: number;
  dailyYieldModifier: number;
  yieldHistory: number[];
  storedGrain: number;

  constructor(init: Partial<Farm> = {}) {
    this.id = `F${FARM_SEQ++}`;
    this.name = init.name ?? `Farm ${this.id}`;
    this.x = init.x ?? (Math.random() * 1200 - 600);
    this.y = init.y ?? (Math.random() * 900 - 450);
    this.landArea = init.landArea ?? (80 + Math.random() * 120);
    this.ownershipMode = init.ownershipMode ?? 'private';
    this.productivityBase = init.productivityBase ?? (0.8 + Math.random() * 0.4);
    this.mechanizationLevel = init.mechanizationLevel ?? 0.05;
    this.riskFamine = init.riskFamine ?? 0.05;
    this.dailyYieldModifier = 1;
    this.yieldHistory = [];
    this.storedGrain = init.storedGrain ?? 20;
  }

  dailyReset() { this.dailyYieldModifier = 1; }

  convertToCollective(avgSkill: number) {
    this.ownershipMode = 'collective';
    this.productivityBase *= (1 + avgSkill * 0.05);
    this.mechanizationLevel = Math.max(this.mechanizationLevel, 0.08);
  }

  computeDailyYield(laborSum: number, moraleAvg: number) {
    let base = this.productivityBase * this.landArea;
    base *= (1 + this.mechanizationLevel * 0.5);
    base *= (0.7 + 0.3 * moraleAvg);
    base *= (0.5 + laborSum / (2 * Math.max(1, laborSum)));
    base *= this.dailyYieldModifier;
    const realized = base * (1 - this.riskFamine * 0.3);
    this.storedGrain += realized * 0.2;
    this.yieldHistory.push(realized);
    if (this.yieldHistory.length > 365) this.yieldHistory.shift();
    return realized;
  }

  avg30DayYield() {
    const slice = this.yieldHistory.slice(-30);
    return slice.reduce((a, v) => a + v, 0);
  }
}
