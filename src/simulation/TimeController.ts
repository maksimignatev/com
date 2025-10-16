import { ERAS } from './eras';

export class TimeController {
  startDate = new Date(1905,0,1);
  currentDate = new Date(1905,0,1);
  eras = ERAS;
  currentEraIndex = 0;
  tickDays = 1;

  get currentEra() { return this.eras[this.currentEraIndex]; }

  stepDay() {
    this.currentDate.setDate(this.currentDate.getDate() + this.tickDays);
    this.updateEra();
  }

  updateEra() {
    const d = this.currentDate;
    const idx = this.eras.findIndex(e => d >= e.start && d <= e.end);
    if (idx >= 0 && idx !== this.currentEraIndex) {
      this.currentEraIndex = idx;
    }
  }

  getEraProgress() {
    const era = this.currentEra;
    const span = era.end.getTime() - era.start.getTime();
    const pos = this.currentDate.getTime() - era.start.getTime();
    return Math.min(1, Math.max(0, pos / span));
  }
}
