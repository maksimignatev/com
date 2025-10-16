let HOUSEHOLD_SEQ = 1;
export class Household {
  id: string;
  personIds: string[] = [];
  storedFood: number;

  constructor(init: Partial<Household> = {}) {
    this.id = `H${HOUSEHOLD_SEQ++}`;
    this.storedFood = init.storedFood ?? 40;
  }

  dailyUpdate() {
    const consumption = this.personIds.length * 0.5;
    this.storedFood -= consumption;
    if (this.storedFood < 0) this.storedFood = 0;
  }
}
