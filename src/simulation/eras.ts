export interface Era {
  id: string;
  name: string;
  start: Date;
  end: Date;
  description: string;
  policies: string[];
}

export const ERAS: Era[] = [
  {
    id: 'tsarist',
    name: 'Late Tsarist',
    start: new Date(1905,0,1),
    end: new Date(1916,11,31),
    description: 'Private landholding, unrest emerging.',
    policies: ['baselineAgrarian']
  },
  {
    id: 'revolution',
    name: 'Revolution & Turmoil',
    start: new Date(1917,0,1),
    end: new Date(1921,11,31),
    description: 'Disruption & requisitions.',
    policies: ['disruption','earlyRequisition']
  },
  {
    id: 'nep',
    name: 'NEP',
    start: new Date(1922,0,1),
    end: new Date(1927,11,31),
    description: 'Partial market incentives, recovery.',
    policies: ['nepIncentives']
  },
  {
    id: 'collectivization',
    name: 'Collectivization',
    start: new Date(1928,0,1),
    end: new Date(1933,11,31),
    description: 'Forced consolidation, quota pressure.',
    policies: ['collectivize','quotaPressure']
  },
  {
    id: 'postCollectivization',
    name: 'Post-Collectivization',
    start: new Date(1934,0,1),
    end: new Date(1940,11,31),
    description: 'Stabilization & mechanization push.',
    policies: ['mechanizationPush']
  }
];
