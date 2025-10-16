import React from 'react';
import { useSimStore } from '../store/simStore';

export const SelectionPanel: React.FC = () => {
  const selection = useSimStore(s => s.selection);
  const sim = useSimStore(s => s.sim);

  let content: JSX.Element = <span>None</span>;
  if (selection) {
    if (selection.type === 'farm') {
      const farm = sim.farms.find(f => f.id === selection.id);
      if (farm) {
        content = (
          <div>
            <strong>Farm</strong><br/>
            ID: {farm.id}<br/>
            Mode: {farm.ownershipMode}<br/>
            Area: {farm.landArea.toFixed(0)} ha<br/>
            Mech: {farm.mechanizationLevel.toFixed(2)}<br/>
            FamineRisk: {farm.riskFamine.toFixed(2)}<br/>
            Avg30dYield: {farm.avg30DayYield().toFixed(1)}<br/>
            StoredGrain: {farm.storedGrain.toFixed(1)}
          </div>
        );
      }
    } else if (selection.type === 'person') {
      const person = sim.persons.find(p => p.id === selection.id);
      if (person) {
        content = (
          <div>
            <strong>Person</strong><br/>
            ID: {person.id}<br/>
            Age: {person.age}<br/>
            Morale: {person.morale.toFixed(2)}<br/>
            Health: {person.health.toFixed(2)}<br/>
            Skill: {person.laborSkill.toFixed(2)}<br/>
            Displaced: {person.displaced ? 'Yes' : 'No'}
          </div>
        );
      }
    }
  }

  return (
    <div className="panel">
      <h2>Selection</h2>
      <div className="selectionContent">
        {content}
      </div>
    </div>
  );
};
