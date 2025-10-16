import React from 'react';
import { useSimStore } from '../store/simStore';

export const OverlayPanel: React.FC = () => {
  const overlay = useSimStore(s => s.overlay);
  const setOverlay = useSimStore(s => s.setOverlay);
  return (
    <div className="panel">
      <h2>Overlay</h2>
      <select value={overlay} onChange={e => setOverlay(e.target.value as 'none' | 'grain' | 'morale' | 'famineRisk')}>
        <option value="none">None</option>
        <option value="grain">Grain Output</option>
        <option value="morale">Morale</option>
        <option value="famineRisk">Famine Risk</option>
      </select>
      <p style={{ fontSize:11, opacity:.7 }}>
        Heat radius scales with farm size; colors adapt to overlay metric.
      </p>
    </div>
  );
};
