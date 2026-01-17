
import { useState, useEffect } from 'react';
import { VisualLevel } from '../../src/shared/types';
import { PersistenceService } from '../services/persistenceService';

export function useSettings() {
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(() => 
    PersistenceService.load('protocol_bgm_enabled', true)
  );
  const [bgmVolume, setBgmVolume] = useState(() => 
    PersistenceService.load('protocol_bgm_volume', 0.5)
  );
  const [visualLevel, setVisualLevel] = useState<VisualLevel>(VisualLevel.MID);
  
  // New: Player Name Persistence
  const [playerName, setPlayerName] = useState(() => 
    PersistenceService.load('protocol_player_name', 'OPERATIVE')
  );

  useEffect(() => {
    PersistenceService.save('protocol_bgm_enabled', bgmEnabled);
    PersistenceService.save('protocol_bgm_volume', bgmVolume);
    PersistenceService.save('protocol_player_name', playerName);
  }, [bgmEnabled, bgmVolume, playerName]);

  return {
    sfxEnabled, setSfxEnabled,
    bgmEnabled, setBgmEnabled,
    bgmVolume, setBgmVolume,
    visualLevel, setVisualLevel,
    playerName, setPlayerName
  };
}
