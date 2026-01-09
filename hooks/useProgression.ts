
import { useState, useEffect } from 'react';
import { UnitType } from '../types';
import { UNIT_PRICES } from '../operativeRegistry';
import { PersistenceService } from '../services/persistenceService';

export interface GameStats {
  wins: number;
  losses: number;
  totalGames: number;
}

export function useProgression() {
  const [credits, setCredits] = useState<number>(() => 
    PersistenceService.load('protocol_credits', 0)
  );
  const [xp, setXp] = useState<number>(() => 
    PersistenceService.load('protocol_xp', 0)
  );
  const [unlockedUnits, setUnlockedUnits] = useState<UnitType[]>(() => 
    PersistenceService.load('protocol_unlocks', [UnitType.GHOST])
  );
  const [highestLevelReached, setHighestLevelReached] = useState<number>(() => 
    PersistenceService.load('protocol_progression', 1)
  );
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => 
    PersistenceService.load('protocol_has_completed_tutorial', false)
  );
  const [hasSeenIntro, setHasSeenIntro] = useState(() => 
    PersistenceService.load('protocol_has_seen_intro', false)
  );
  
  const [stats, setStats] = useState<GameStats>(() => 
    PersistenceService.load('protocol_stats', { wins: 0, losses: 0, totalGames: 0 })
  );

  useEffect(() => {
    PersistenceService.saveDebounced('protocol_credits', credits);
    PersistenceService.saveDebounced('protocol_xp', xp);
  }, [credits, xp]);

  useEffect(() => {
    PersistenceService.save('protocol_unlocks', unlockedUnits);
    PersistenceService.save('protocol_progression', highestLevelReached);
    PersistenceService.save('protocol_has_completed_tutorial', hasCompletedTutorial);
    PersistenceService.save('protocol_has_seen_intro', hasSeenIntro);
    PersistenceService.save('protocol_stats', stats);
  }, [unlockedUnits, highestLevelReached, hasCompletedTutorial, hasSeenIntro, stats]);

  const purchaseUnit = (type: UnitType) => {
    const price = UNIT_PRICES[type].cost;
    if (credits >= price && !unlockedUnits.includes(type)) {
      setCredits(prev => prev - price);
      setUnlockedUnits(prev => [...prev, type]);
      PersistenceService.save('protocol_credits', credits - price);
      return true;
    }
    return false;
  };

  const updateStats = (isWin: boolean) => {
    setStats(prev => ({
      wins: prev.wins + (isWin ? 1 : 0),
      losses: prev.losses + (isWin ? 0 : 1),
      totalGames: prev.totalGames + 1
    }));
  };

  const unlockAll = () => {
    setCredits(99999);
    setXp(99999);
    setUnlockedUnits(Object.values(UnitType));
    setHighestLevelReached(99);
    setHasCompletedTutorial(true);
    setHasSeenIntro(true);
  };

  const resetProgress = () => {
    setCredits(0);
    setXp(0);
    setUnlockedUnits([UnitType.GHOST]);
    setHighestLevelReached(1);
    setHasCompletedTutorial(false);
    setHasSeenIntro(false);
    setStats({ wins: 0, losses: 0, totalGames: 0 });
    localStorage.clear(); // Hard reset
  };

  return {
    credits, setCredits,
    xp, setXp,
    unlockedUnits, setUnlockedUnits,
    highestLevelReached, setHighestLevelReached,
    hasCompletedTutorial, setHasCompletedTutorial,
    hasSeenIntro, setHasSeenIntro,
    stats, setStats, updateStats,
    purchaseUnit,
    unlockAll,
    resetProgress,
    cipheredUnits: [UnitType.GHOST, UnitType.AEGIS, UnitType.REAPER], 
    getMastery: (t: UnitType) => 1,
  };
}
