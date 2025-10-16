import { Simulation } from './Simulation';

export const Policies: Record<string, {
  applyDaily: (sim: Simulation) => void;
}> = {
  baselineAgrarian: {
    applyDaily(sim) {
      sim.farms.forEach(f => {
        if (f.ownershipMode === 'private') f.productivityBase *= 1 + 0.00005;
      });
    }
  },
  disruption: {
    applyDaily(sim) {
      sim.farms.forEach(f => {
        f.dailyYieldModifier *= 0.90;
        f.riskFamine = Math.min(1, f.riskFamine + 0.0002);
      });
      sim.persons.forEach(p => p.morale -= 0.001);
    }
  },
  earlyRequisition: {
    applyDaily(sim) {
      sim.farms.forEach(f => {
        if (f.storedGrain > 0) {
          const taken = f.storedGrain * 0.02;
          f.storedGrain -= taken;
          sim.metrics.grainRequisitioned += taken;
        }
      });
    }
  },
  nepIncentives: {
    applyDaily(sim) {
      sim.farms.forEach(f => {
        f.dailyYieldModifier *= 1.08;
        f.riskFamine *= 0.95;
      });
      sim.persons.forEach(p => p.morale += 0.002);
    }
  },
  collectivize: {
    applyDaily(sim) {
      const year = sim.time.currentDate.getFullYear();
      if (year >= 1929) {
        const remaining = sim.farms.filter(f => f.ownershipMode === 'private');
        const convertCount = Math.ceil(remaining.length * 0.01);
        for (let i = 0; i < convertCount; i++) {
          const f = remaining[i];
            if (!f) break;
          const persons = sim.persons.filter(p => p.farmId === f.id && !p.displaced);
          const avgSkill = persons.reduce((a, p) => a + p.laborSkill, 0) / Math.max(1, persons.length);
          f.convertToCollective(avgSkill);
          sim.metrics.farmsCollectivized++;
        }
      }
      sim.persons.forEach(p => p.morale -= 0.0015);
    }
  },
  quotaPressure: {
    applyDaily(sim) {
      sim.farms.forEach(f => {
        if (f.ownershipMode === 'collective') {
          f.dailyYieldModifier *= 1.05;
          f.riskFamine = Math.min(0.5, f.riskFamine + 0.0005);
        }
      });
    }
  },
  mechanizationPush: {
    applyDaily(sim) {
      sim.farms.forEach(f => {
        if (f.ownershipMode === 'collective') {
          f.mechanizationLevel += 0.0003;
          f.productivityBase *= 1 + 0.0001;
          f.riskFamine *= 0.995;
        }
      });
    }
  }
};
