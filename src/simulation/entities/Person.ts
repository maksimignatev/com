let PERSON_SEQ = 1;
export class Person {
  id: string;
  name: string;
  age: number;
  laborSkill: number;
  health: number;
  morale: number;
  politicalDisposition: number;
  householdId?: string;
  farmId?: string;
  displaced: boolean;

  constructor(init: Partial<Person> = {}) {
    this.id = `P${PERSON_SEQ++}`;
    this.name = init.name ?? `Person ${this.id}`;
    this.age = init.age ?? (18 + Math.floor(Math.random() * 30));
    this.laborSkill = init.laborSkill ?? (0.4 + Math.random() * 0.6);
    this.health = init.health ?? 1;
    this.morale = init.morale ?? (0.6 + Math.random() * 0.3);
    this.politicalDisposition = init.politicalDisposition ?? (0.3 + Math.random() * 0.4);
    this.displaced = false;
  }

  dailyUpdate(riskFamineLocal: number) {
    // Age chance
    if (Math.random() < 0.0004) this.age++;
    // Health impact from morale
    this.health -= 0.002 * (0.5 - this.morale);
    this.health = Math.min(1, Math.max(0, this.health));
    // Displacement risk
    if (!this.displaced && riskFamineLocal > 0.4 && Math.random() < riskFamineLocal * 0.004) {
      this.displaced = true;
    }
    // Clamp morale
    this.morale = Math.max(0, Math.min(1, this.morale));
  }
}
