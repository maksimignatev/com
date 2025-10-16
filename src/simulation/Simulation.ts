import { Person } from './entities/Person';
import { Household } from './entities/Household';
import { Farm } from './entities/Farm';
import { Policies } from './Policies';
import { type Era } from './eras';
import { TimeController } from './TimeController';

export interface SimulationMetrics {
  totalGrainToday: number;
  totalLivestockEst: number;
  avgMorale: number;
  displacedCount: number;
  grainRequisitioned: number;
  farmsCollectivized: number;
}

export class Simulation {
  persons: Person[] = [];
  households: Household[] = [];
  farms: Farm[] = [];
  metrics: SimulationMetrics = {
    totalGrainToday: 0,
    totalLivestockEst: 0,
    avgMorale: 0,
    displacedCount: 0,
    grainRequisitioned: 0,
    farmsCollectivized: 0
  };
  time!: TimeController;

  init(data: { persons: Person[]; households: Household[]; farms: Farm[]; time?: TimeController }) {
    this.persons = data.persons;
    this.households = data.households;
    this.farms = data.farms;
    if (data.time) this.time = data.time;
  }

  dailyTick(era: Era) {
    this.farms.forEach(f => f.dailyReset());
    era.policies.forEach(pid => {
      const policy = Policies[pid];
      if (policy) policy.applyDaily(this);
    });

    let totalYield = 0;
    for (const farm of this.farms) {
      const farmPersons = this.persons.filter(p => p.farmId === farm.id && !p.displaced);
      const laborSum = farmPersons.reduce((a,p) => a + p.laborSkill * p.health, 0);
      const moraleAvg = farmPersons.reduce((a,p) => a + p.morale, 0) / Math.max(1,farmPersons.length);
      const y = farm.computeDailyYield(laborSum, moraleAvg);
      totalYield += y;
    }

    this.households.forEach(h => h.dailyUpdate());
    this.persons.forEach(p => {
      const farm = this.farms.find(f => f.id === p.farmId);
      p.dailyUpdate(farm ? farm.riskFamine : 0);
      if (p.displaced) this.metrics.displacedCount = this.persons.filter(pp => pp.displaced).length;
    });

    this.metrics.totalGrainToday = totalYield;
    this.metrics.avgMorale = this.persons.reduce((a,p)=>a+p.morale,0)/Math.max(1,this.persons.length);
    this.metrics.totalLivestockEst = this.farms.reduce((a,f)=>a+f.landArea*0.05,0);
  }
}
