import React from 'react';
import { useSimStore } from '../store/simStore';

export const HUD: React.FC = () => {
  const sim = useSimStore(s => s.sim);
  const m = sim.metrics;
  return (
    <div className="panel">
      <h2>Metrics (Daily)</h2>
      <div className="metricsRow">
        <span className="badge">Grain: {m.totalGrainToday.toFixed(1)}</span>
        <span className="badge">Livestock: {m.totalLivestockEst.toFixed(0)}</span>
        <span className="badge">Avg Morale: {m.avgMorale.toFixed(2)}</span>
        <span className="badge">Displaced: {m.displacedCount}</span>
        <span className="badge">Collectivized: {m.farmsCollectivized}</span>
        <span className="badge">Req Grain: {m.grainRequisitioned.toFixed(1)}</span>
      </div>
      <p style={{ fontSize:11, opacity:.65 }}>
        Simplified yield model; integrate real data & weather variance later.
      </p>
    </div>
  );
};
