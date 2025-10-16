import React from 'react';
import { useSimStore } from '../store/simStore';

export const EraPanel: React.FC = () => {
  const time = useSimStore(s => s.time);
  const playing = useSimStore(s => s.playing);
  const fastForward = useSimStore(s => s.fastForward);
  const togglePlay = useSimStore(s => s.togglePlay);
  const toggleFast = useSimStore(s => s.toggleFast);
  const advanceDay = useSimStore(s => s.advanceDay);

  const era = time.currentEra;
  const progress = time.getEraProgress() * 100;

  return (
    <div className="panel">
      <h2>Era</h2>
      <p><strong>{era.name}</strong></p>
      <p>{time.currentDate.toDateString()}</p>
      <div className="progressWrap">
        <div className="progressBar" style={{ width: `${progress.toFixed(1)}%` }} />
      </div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        <button onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
        <button onClick={() => advanceDay()}>Step Day</button>
        <button onClick={toggleFast}>{fastForward ? 'Fast OFF' : 'Fast ×10'}</button>
      </div>
      <p style={{ fontSize:11, opacity:.7 }}>
        Fast-forward increases temporal rate (not rendering speed).
      </p>
      <p style={{ fontSize:11, opacity:.6 }}>
        Historical simplification; consider adding sources later.
      </p>
    </div>
  );
};
