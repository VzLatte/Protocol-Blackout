
import { useState, useEffect } from 'react';
import { UnitType, Mod, MaterialType, Contract, Item, Loadout } from '../types';
import { UNIT_PRICES } from '../operativeRegistry';
import { PersistenceService } from '../services/persistenceService';
import { MOD_TEMPLATES, CONTRACT_TEMPLATES, ARMORY_ITEMS } from '../constants';
import { MASTERY_TREES } from '../masteryRegistry';

export interface GameStats {
  wins: number;
  losses: number;
  totalGames: number;
}

export function useProgression() {
  const [credits, setCredits] = useState<number>(() => PersistenceService.load('protocol_credits', 0));
  const [xp, setXp] = useState<number>(() => PersistenceService.load('protocol_xp', 0));
  const [unlockedUnits, setUnlockedUnits] = useState<UnitType[]>(() => PersistenceService.load('protocol_unlocks', [UnitType.PYRUS])); 
  const [highestLevelReached, setHighestLevelReached] = useState<number>(() => PersistenceService.load('protocol_progression', 1));
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => PersistenceService.load('protocol_has_completed_tutorial', false));
  const [hasSeenIntro, setHasSeenIntro] = useState(() => PersistenceService.load('protocol_has_seen_intro', false));
  
  const [stats, setStats] = useState<GameStats>(() => PersistenceService.load('protocol_stats', { wins: 0, losses: 0, totalGames: 0 }));

  const [materials, setMaterials] = useState<Record<MaterialType, number>>(() => 
    PersistenceService.load('protocol_materials', { 
      [MaterialType.SCRAP]: 100, 
      [MaterialType.NEURAL_GLASS]: 0, 
      [MaterialType.ISOTOPE_7]: 0, 
      [MaterialType.CLASSIFIED_CORE]: 0,
      [MaterialType.CYBER_CORE]: 5 // Start with some for testing
    })
  );
  
  // New Loadout System
  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => PersistenceService.load('protocol_unlocked_items', ['W_VECTOR', 'S_AEGIS', 'U_STIM'])); 
  const [currentLoadout, setCurrentLoadout] = useState<Loadout>(() => PersistenceService.load('protocol_loadout_v2', { primary: null, secondary: null, shield: null }));
  
  // Mastery System
  const [unitMastery, setUnitMastery] = useState<Record<UnitType, string[]>>(() => 
    PersistenceService.load('protocol_mastery', { 
      [UnitType.PYRUS]: [], [UnitType.AEGIS]: [], [UnitType.GHOST]: [], [UnitType.REAPER]: [], [UnitType.HUNTER]: [], [UnitType.MEDIC]: [] 
    })
  );

  const [standing, setStanding] = useState<number>(() => PersistenceService.load('protocol_standing', 0));
  const [battlePassXp, setBattlePassXp] = useState<number>(() => PersistenceService.load('protocol_bp_xp', 0));
  const [claimedBpRewards, setClaimedBpRewards] = useState<number[]>(() => PersistenceService.load('protocol_bp_claimed', []));
  
  const [contracts, setContracts] = useState<Contract[]>(() => 
    PersistenceService.load('protocol_contracts', JSON.parse(JSON.stringify(CONTRACT_TEMPLATES)))
  );

  // CRITICAL PERSISTENCE
  useEffect(() => {
    PersistenceService.save('protocol_credits', credits);
    PersistenceService.save('protocol_xp', xp);
    PersistenceService.save('protocol_materials', materials);
    PersistenceService.save('protocol_standing', standing);
    PersistenceService.save('protocol_bp_xp', battlePassXp);
    PersistenceService.save('protocol_unlocks', unlockedUnits);
    PersistenceService.save('protocol_progression', highestLevelReached);
    PersistenceService.save('protocol_has_completed_tutorial', hasCompletedTutorial);
    PersistenceService.save('protocol_has_seen_intro', hasSeenIntro);
    PersistenceService.save('protocol_stats', stats);
    PersistenceService.save('protocol_unlocked_items', unlockedItems);
    PersistenceService.save('protocol_loadout_v2', currentLoadout);
    PersistenceService.save('protocol_contracts', contracts);
    PersistenceService.save('protocol_bp_claimed', claimedBpRewards);
    PersistenceService.save('protocol_mastery', unitMastery);
  }, [credits, xp, materials, standing, battlePassXp, unlockedUnits, highestLevelReached, hasCompletedTutorial, hasSeenIntro, stats, unlockedItems, currentLoadout, contracts, claimedBpRewards, unitMastery]);

  // --- ACTIONS ---

  const purchaseUnit = (type: UnitType) => {
    const price = UNIT_PRICES[type].cost;
    if (credits >= price && !unlockedUnits.includes(type)) {
      setCredits(prev => prev - price);
      setUnlockedUnits(prev => [...prev, type]);
      return true;
    }
    return false;
  };

  const updateStats = (isWin: boolean, difficultyMult: number = 1.0, performanceMult: number = 1.0) => {
    setStats(prev => ({
      wins: prev.wins + (isWin ? 1 : 0),
      losses: prev.losses + (isWin ? 0 : 1),
      totalGames: prev.totalGames + 1
    }));
    
    const baseStanding = isWin ? 100 : 25;
    const baseBp = isWin ? 200 : 50;

    const finalStanding = Math.floor(baseStanding * difficultyMult);
    const finalBp = Math.floor(baseBp * difficultyMult * performanceMult);
    
    setStanding(prev => prev + finalStanding);
    setBattlePassXp(prev => prev + finalBp);

    // Chance to drop Cyber Core on win
    if (isWin && Math.random() > 0.5) {
       setMaterials(prev => ({ ...prev, [MaterialType.CYBER_CORE]: (prev[MaterialType.CYBER_CORE] || 0) + 1 }));
    }
  };

  const unlockItem = (itemId: string) => {
    if (!unlockedItems.includes(itemId)) {
        setUnlockedItems(prev => [...prev, itemId]);
    }
  };

  const equipItem = (item: Item) => {
    if (!unlockedItems.includes(item.id)) return;
    
    setCurrentLoadout(prev => {
        if (item.slot === 'PRIMARY') return { ...prev, primary: item };
        if (item.slot === 'SECONDARY') return { ...prev, secondary: item };
        if (item.slot === 'SHIELD') return { ...prev, shield: item };
        return prev;
    });
  };

  const unequipItem = (slot: 'PRIMARY' | 'SECONDARY' | 'SHIELD') => {
      setCurrentLoadout(prev => {
          if (slot === 'PRIMARY') return { ...prev, primary: null };
          if (slot === 'SECONDARY') return { ...prev, secondary: null };
          if (slot === 'SHIELD') return { ...prev, shield: null };
          return prev;
      });
  };

  const addMod = (id: string) => unlockItem(id);

  // Mastery Logic
  const unlockMasteryNode = (unit: UnitType, nodeId: string) => {
     const tree = MASTERY_TREES[unit];
     const node = tree.find(n => n.id === nodeId);
     if (!node) return false;

     // Check Cost
     if (materials[MaterialType.CYBER_CORE] < node.cost) return false;

     // Check Parent
     if (node.parentId && !unitMastery[unit].includes(node.parentId)) return false;

     // Check Conflicts (Gates)
     if (node.conflictId && unitMastery[unit].includes(node.conflictId)) return false;

     // Unlock
     setMaterials(prev => ({ ...prev, [MaterialType.CYBER_CORE]: prev[MaterialType.CYBER_CORE] - node.cost }));
     setUnitMastery(prev => ({
        ...prev,
        [unit]: [...(prev[unit] || []), nodeId]
     }));
     return true;
  };

  const updateContracts = (events: { type: string, value: number }[]) => {
    setContracts(prev => prev.map(c => {
      if (c.completed) return c;
      
      let progress = c.currentValue;
      events.forEach(e => {
        if (e.type === c.conditionType) {
           progress += e.value;
        }
      });

      const completed = progress >= c.targetValue;
      return { ...c, currentValue: progress, completed };
    }));
  };

  const claimContract = (id: string) => {
    const c = contracts.find(x => x.id === id);
    if (c && c.completed && !c.claimed) {
       setContracts(prev => prev.map(x => x.id === id ? { ...x, claimed: true } : x));
       
       if (c.rewardStanding) setStanding(prev => prev + c.rewardStanding);
       if (c.rewardMaterial) {
          setMaterials(prev => ({ ...prev, [c.rewardMaterial!.type]: prev[c.rewardMaterial!.type] + c.rewardMaterial!.amount }));
       }
    }
  };

  const openChest = (tier: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY') => {
    const COSTS = { 'COMMON': 250, 'RARE': 500, 'EPIC': 1200, 'LEGENDARY': 3000 };
    const cost = COSTS[tier];
    if (credits < cost) return null;

    setCredits(prev => prev - cost);

    const materialsFound = { [MaterialType.SCRAP]: 0, [MaterialType.NEURAL_GLASS]: 0, [MaterialType.ISOTOPE_7]: 0, [MaterialType.CLASSIFIED_CORE]: 0, [MaterialType.CYBER_CORE]: 0 };
    let droppedItem: Item | null = null;
    let wasDuplicate = false;

    if (tier === 'COMMON') materialsFound[MaterialType.SCRAP] = Math.floor(Math.random() * 40) + 20;
    else if (tier === 'RARE') materialsFound[MaterialType.SCRAP] = Math.floor(Math.random() * 80) + 40;
    else if (tier === 'EPIC') materialsFound[MaterialType.NEURAL_GLASS] = Math.floor(Math.random() * 3) + 1;
    else if (tier === 'LEGENDARY') materialsFound[MaterialType.ISOTOPE_7] = 1;

    // Small chance for Cyber Core in chests
    if (Math.random() > 0.8) materialsFound[MaterialType.CYBER_CORE] = 1;

    const ITEM_CHANCE = { 'COMMON': 0.3, 'RARE': 0.5, 'EPIC': 0.7, 'LEGENDARY': 1.0 };
    if (Math.random() < ITEM_CHANCE[tier]) {
        let pool: Item[] = [];
        if (tier === 'COMMON') pool = ARMORY_ITEMS.filter(i => i.cost <= 100);
        else if (tier === 'RARE') pool = ARMORY_ITEMS.filter(i => i.cost > 50 && i.cost <= 250);
        else if (tier === 'EPIC') pool = ARMORY_ITEMS.filter(i => i.cost > 200);
        else pool = ARMORY_ITEMS; 

        if (pool.length > 0) {
            const selected = pool[Math.floor(Math.random() * pool.length)];
            if (unlockedItems.includes(selected.id)) {
                wasDuplicate = true;
                const scrapVal = Math.floor(selected.cost * 0.5);
                materialsFound[MaterialType.SCRAP] += scrapVal;
                droppedItem = selected; 
            } else {
                setUnlockedItems(prev => [...prev, selected.id]);
                droppedItem = selected;
            }
        }
    }

    setMaterials(prev => ({
        ...prev,
        [MaterialType.SCRAP]: prev[MaterialType.SCRAP] + materialsFound[MaterialType.SCRAP],
        [MaterialType.NEURAL_GLASS]: prev[MaterialType.NEURAL_GLASS] + materialsFound[MaterialType.NEURAL_GLASS],
        [MaterialType.ISOTOPE_7]: prev[MaterialType.ISOTOPE_7] + materialsFound[MaterialType.ISOTOPE_7],
        [MaterialType.CLASSIFIED_CORE]: prev[MaterialType.CLASSIFIED_CORE] + materialsFound[MaterialType.CLASSIFIED_CORE],
        [MaterialType.CYBER_CORE]: (prev[MaterialType.CYBER_CORE] || 0) + materialsFound[MaterialType.CYBER_CORE]
    }));

    return { mod: null, item: droppedItem, materials: materialsFound, wasDuplicate };
  };

  const unlockAll = () => {
    setCredits(99999);
    setXp(99999);
    setUnlockedUnits(Object.values(UnitType));
    setHighestLevelReached(99);
    setMaterials({ [MaterialType.SCRAP]: 999, [MaterialType.NEURAL_GLASS]: 999, [MaterialType.ISOTOPE_7]: 999, [MaterialType.CLASSIFIED_CORE]: 999, [MaterialType.CYBER_CORE]: 99 });
    ARMORY_ITEMS.forEach(i => unlockItem(i.id));
  };

  const resetProgress = () => {
    localStorage.clear();
    window.location.reload();
  };

  return {
    credits, setCredits,
    xp, setXp,
    materials, setMaterials,
    unlockedItems, unlockItem,
    currentLoadout, equipItem, unequipItem,
    standing, setStanding,
    battlePassXp, setBattlePassXp,
    claimedBpRewards, setClaimedBpRewards,
    contracts, setContracts,
    unlockedUnits, setUnlockedUnits,
    highestLevelReached, setHighestLevelReached,
    hasCompletedTutorial, setHasCompletedTutorial,
    hasSeenIntro, setHasSeenIntro,
    stats, setStats, updateStats,
    purchaseUnit,
    addMod, 
    updateContracts, claimContract,
    openChest,
    unlockAll,
    resetProgress,
    unitMastery, unlockMasteryNode,
    cipheredUnits: [UnitType.GHOST, UnitType.AEGIS, UnitType.REAPER, UnitType.MEDIC], 
    getMastery: (t: UnitType) => Math.floor(stats.totalGames / 5) + 1,
    inventory: [], equippedMods: [], dismantleMod: () => {}, equipMod: () => {}, unequipMod: () => {}
  };
}
