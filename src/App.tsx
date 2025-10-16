import React, { useEffect } from 'react';
import { WorldStage } from './pixi/WorldStage';
import { useSimStore } from './store/simStore';
import { HUD } from './components/HUD';
import { OverlayPanel } from './components/OverlayPanel';
import { EraPanel } from './components/EraPanel';
import { SelectionPanel } from './components/SelectionPanel';
import { LevelPanel } from './components/LevelPanel';

const App: React.FC = () => {
  const init = useSimStore(s => s.initialize);
  useEffect(() => { init(); }, [init]);

  return (
    <div className="appRoot">
      <WorldStage />
      <div className="hudStack">
        <EraPanel />
        <LevelPanel />
        <OverlayPanel />
        <SelectionPanel />
        <HUD />
      </div>
    </div>
  );
};

export default App;
