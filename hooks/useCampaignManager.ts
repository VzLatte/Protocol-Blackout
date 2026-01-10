
import { useState } from 'react';
import { DifficultyLevel, HazardType, Phase, GameMode, Player, AIDifficulty, AIArchetype, WinCondition, UnitType } from '../types';
import { CAMPAIGN_LEVELS } from '../campaignRegistry';
import { UNITS } from '../operativeRegistry';
import { INITIAL_HP } from '../constants';
import { generateMap } from '../utils/mapGenerator';

const getLevelSeed = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash);
};

export function useCampaignManager(
  battle: any,
  progression: any
) {
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentCampaignLevelId, setCurrentCampaignLevelId] = useState<string | null>(null);
  const [campaignDifficulty, setCampaignDifficulty] = useState<DifficultyLevel>(DifficultyLevel.NORMAL);
  const [lastEarnedCredits, setLastEarnedCredits] = useState(0);
  const [lastEarnedXp, setLastEarnedXp] = useState(0);

  const startCampaignLevel = (lvlId: string) => {
    const lvl = CAMPAIGN_LEVELS.find(l => l.id === lvlId);
    if (!lvl) return;

    battle.setMode(GameMode.TACTICAL);
    battle.setMaxRounds(15); // Standard Campaign limit
    setCurrentCampaignLevelId(lvlId);
    setCurrentChapter(lvl.chapter);
    
    const seed = getLevelSeed(lvl.id);
    const proceduralMap = generateMap(lvl.chapter, seed);
    battle.setActiveMap(proceduralMap);

    let baseAp = 25; 
    let diff = AIDifficulty.NORMAL;
    if (campaignDifficulty === DifficultyLevel.OVERCLOCK) { diff = AIDifficulty.NORMAL; } 
    if (campaignDifficulty === DifficultyLevel.BLACKOUT) { diff = AIDifficulty.HARD; }

    const newPlayers: Player[] = [{ 
      name: 'OPERATIVE', id: 'p0', isAI: false, hp: INITIAL_HP, maxHp: INITIAL_HP, ap: baseAp, unit: null, isEliminated: false, moveFatigue: 0, blockFatigue: 0, statuses: [], cooldown: 0, activeUsed: false, desperationUsed: false, totalReservedAp: 0, isAbilityActive: false,
      position: { x: 0, y: 5 }, 
      captureTurns: 0,
      loadout: progression.currentLoadout || { primary: null, secondary: null, shield: null },
      itemUses: { current: 0, max: progression.currentLoadout?.secondary?.maxUses || 0 }
    }];
    
    const spawnPositions = [
      { x: 10, y: 5 }, 
      { x: 10, y: 4 }, 
      { x: 10, y: 6 }, 
      { x: 9, y: 5 },  
      { x: 10, y: 2 },
      { x: 10, y: 8 },
    ];

    const enemyTypes = lvl.customSquad || Array(lvl.enemyCount).fill(lvl.enemyUnit);

    enemyTypes.forEach((uType: UnitType, i: number) => {
      const spawnPos = spawnPositions[i] || { x: 10, y: 5 };
      
      newPlayers.push({ 
        name: lvl.enemyName || (enemyTypes.length > 1 ? `CIPHER_${i+1}` : 'CIPHER'), 
        id: `p${i+1}`, 
        isAI: true, 
        hp: Math.floor(INITIAL_HP * lvl.enemyHpMult), 
        maxHp: Math.floor(INITIAL_HP * lvl.enemyHpMult), 
        ap: baseAp, 
        unit: UNITS[uType], 
        isEliminated: false, 
        moveFatigue: 0, 
        blockFatigue: 0, 
        statuses: [], 
        cooldown: 0, 
        activeUsed: false, 
        desperationUsed: false,
        totalReservedAp: 0, 
        isAbilityActive: false, 
        aiConfig: { archetype: lvl.enemyAi, difficulty: diff },
        position: spawnPos,
        captureTurns: 0,
        loadout: { primary: null, secondary: null, shield: null },
        itemUses: { current: 0, max: 0 }
      });
    });

    battle.setPlayers(newPlayers);
    battle.initDistances(newPlayers);
    battle.setPhase(Phase.BLACKOUT_SELECTION);
    battle.setCurrentPlayerIdx(0);
    battle.setRound(1);
    battle.setFogOfWarActive(lvl.hazard === HazardType.FOG_OF_WAR ? 99 : 0);
  };

  const advanceCampaign = () => {
    if (!currentCampaignLevelId) return;
    const currentIdx = CAMPAIGN_LEVELS.findIndex(l => l.id === currentCampaignLevelId);
    if (currentIdx !== -1 && currentIdx + 1 < CAMPAIGN_LEVELS.length) {
       const nextLvl = CAMPAIGN_LEVELS[currentIdx + 1];
       startCampaignLevel(nextLvl.id);
    }
  };

  const checkCampaignVictory = (players: Player[]) => {
    if (battle.victoryReason) return; 
    if (!currentCampaignLevelId) return;
    
    const lvl = CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevelId);
    if (!lvl) return;

    const player = players.find(p => !p.isAI);
    const aliveEnemies = players.filter(p => p.isAI && !p.isEliminated);
    
    let victory = false;

    // Victory Conditions
    if (lvl.winCondition === WinCondition.ELIMINATION) {
       if (aliveEnemies.length === 0 && !player?.isEliminated) victory = true;
    }
    else if (lvl.winCondition === WinCondition.SURVIVAL) {
       if (!player?.isEliminated && battle.round > lvl.winValue) victory = true;
    }
    else if (lvl.winCondition === WinCondition.CONTROL) {
       if (!player?.isEliminated && player?.captureTurns && player.captureTurns >= lvl.winValue) {
          victory = true;
       }
    }

    if (victory) {
      battle.setVictoryReason("OPERATIONAL_SUCCESS");
      
      // Calculate Multipliers
      let diffMult = 1.0;
      if (campaignDifficulty === DifficultyLevel.OVERCLOCK) diffMult = 1.2;
      if (campaignDifficulty === DifficultyLevel.BLACKOUT) diffMult = 1.5;

      const roundsTaken = battle.round;
      const maxRounds = battle.maxRounds;
      // Bonus for finishing early (Turn Efficiency)
      // Example: Max 15, took 5. (15 - 5) * 0.05 = +50% bonus. Min 1.0
      const efficiencyBonus = Math.max(1.0, 1.0 + (maxRounds - roundsTaken) * 0.05);

      progression.updateStats(true, diffMult, efficiencyBonus); 
      
      const xpReward = Math.floor(lvl.xpReward * efficiencyBonus);
      
      progression.setCredits((prev: number) => prev + lvl.creditReward);
      progression.setXp((prev: number) => prev + xpReward);
      
      setLastEarnedCredits(lvl.creditReward);
      setLastEarnedXp(xpReward);
      
      if (lvl.unlockUnit && !progression.unlockedUnits.includes(lvl.unlockUnit)) {
        progression.setUnlockedUnits((prev: any[]) => [...prev, lvl.unlockUnit!]);
      }
      
      const lvlIdx = CAMPAIGN_LEVELS.findIndex(l => l.id === currentCampaignLevelId);
      if (lvlIdx + 1 >= progression.highestLevelReached) {
        progression.setHighestLevelReached(lvlIdx + 2);
      }
    } else if (player?.isEliminated) {
      battle.setVictoryReason("DATA_CORRUPTION_DETECTED");
      progression.updateStats(false); 
    }
  };

  return {
    currentChapter, setCurrentChapter,
    currentCampaignLevelId, setCurrentCampaignLevelId,
    campaignDifficulty, setCampaignDifficulty,
    lastEarnedCredits, lastEarnedXp,
    startCampaignLevel,
    checkCampaignVictory,
    advanceCampaign
  };
}
