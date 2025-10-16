import React from 'react';
import { useSimStore } from '../store/simStore';
import { LEVEL_SEQUENCE } from '../simulation/levels';

export const LevelPanel: React.FC = () => {
  const currentLevel = useSimStore(s => s.currentLevel);
  const targetLevel = useSimStore(s => s.targetLevel);
  const setLevel = useSimStore(s => s.setLevel);

  return (
    <div className="panel">
      <h2>View Level</h2>
      <p>Target: {targetLevel}</p>
      <div className="levelButtons">
        {LEVEL_SEQUENCE.map(l => (
          <button key={l}
            style={l===targetLevel ? { background:'#335b7a'} : {}}
            onClick={() => setLevel(l)}>
            {l}
          </button>
        ))}
      </div>
      <p style={{ fontSize:11, opacity:.7 }}>Use number keys 1–6 or click.</p>
    </div>
  );
};
