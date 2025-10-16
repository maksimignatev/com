import { Person } from './entities/Person';
import { Household } from './entities/Household';
import { Farm } from './entities/Farm';

export function createInitialEntities() {
  const farms: Farm[] = [];
  for (let i=0;i<24;i++) {
    farms.push(new Farm({
      ownershipMode: 'private',
      landArea: 60 + Math.random()*150,
      x: (Math.random()-0.5)*1400,
      y: (Math.random()-0.5)*1000
    }));
  }

  const persons: Person[] = [];
  const households: Household[] = [];
  for (let i=0;i<150;i++) {
    const p = new Person();
    const farm = farms[Math.floor(Math.random()*farms.length)];
    p.farmId = farm.id;
    let hh = households[households.length-1];
    if (!hh || hh.personIds.length>=5) {
      hh = new Household();
      households.push(hh);
    }
    hh.personIds.push(p.id);
    p.householdId = hh.id;
    persons.push(p);
  }

  return { persons, households, farms };
}
