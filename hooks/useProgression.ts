
import { useState, useEffect } from 'react';
import { UnitType } from '../types';
import { UNIT_PRICES } from '../operativeRegistry';

export function useProgression() {
  const [credits, setCredits] = useState<number>(() => 
    parseInt(localStorage.getItem('protocol_credits') || '0')
  );
  const [xp, setXp] = useState<number>(() => 
    parseInt(localStorage.getItem('protocol_xp') || '0')
  );
  const [unlockedUnits, setUnlockedUnits] = useState<UnitType[]>(() => {
    const saved = localStorage.getItem('protocol_unlocks');
    // Lock all besides GHOST initially
    return saved ? JSON.parse(saved) : [UnitType.GHOST];
  });
  const [cipheredUnits, setCipheredUnits] = useState<UnitType[]>(() => {
    const saved = localStorage.getItem('protocol_ciphers');
    // Default encounterable starting roster
    return saved ? JSON.parse(saved) : [UnitType.GHOST, UnitType.AEGIS, UnitType.REAPER];
  });
  const [masteryLevels, setMasteryLevels] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('protocol_mastery');
    return saved ? JSON.parse(saved) : {};
  });
  const [highestLevelReached, setHighestLevelReached] = useState<number>(() => 
    parseInt(localStorage.getItem('protocol_progression') || '1')
  );
  const [highestDifficultyReached, setHighestDifficultyReached] = useState<number>(() => 
    parseInt(localStorage.getItem('protocol_difficulty_progression') || '0')
  );
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('protocol_stats');
    return saved ? JSON.parse(saved) : { wins: 0, losses: 0, totalGames: 0 };
  });

  useEffect(() => {
    localStorage.setItem('protocol_credits', credits.toString());
    localStorage.setItem('protocol_xp', xp.toString());
    localStorage.setItem('protocol_unlocks', JSON.stringify(unlockedUnits));
    localStorage.setItem('protocol_ciphers', JSON.stringify(cipheredUnits));
    localStorage.setItem('protocol_mastery', JSON.stringify(masteryLevels));
    localStorage.setItem('protocol_progression', highestLevelReached.toString());
    localStorage.setItem('protocol_difficulty_progression', highestDifficultyReached.toString());
    localStorage.setItem('protocol_stats', JSON.stringify(stats));
  }, [credits, xp, unlockedUnits, cipheredUnits, masteryLevels, highestLevelReached, highestDifficultyReached, stats]);

  const addCredits = (amount: number) => setCredits(p => p + amount);
  const addXp = (amount: number) => setXp(p => p + amount);
  
  const purchaseUnit = (type: UnitType) => {
    const price = UNIT_PRICES[type].cost;
    const isCiphered = cipheredUnits.includes(type);
    if (credits >= price && !unlockedUnits.includes(type) && isCiphered) {
      setCredits(prev => prev - price);
      setUnlockedUnits(prev => [...prev, type]);
      return true;
    }
    return false;
  };

  const getMastery = (type: UnitType) => masteryLevels[type] || 1;
  const incrementMastery = (type: UnitType) => {
    setMasteryLevels(prev => ({
      ...prev,
      [type]: (prev[type] || 1) + 1
    }));
  };

  const level = Math.floor(xp / 1000) + 1;

  return {
    credits, addCredits, 
    xp, addXp, level,
    unlockedUnits, setUnlockedUnits, 
    cipheredUnits, setCipheredUnits,
    purchaseUnit,
    masteryLevels, getMastery, incrementMastery,
    highestLevelReached, setHighestLevelReached,
    highestDifficultyReached, setHighestDifficultyReached,
    stats, setStats
  };
}
