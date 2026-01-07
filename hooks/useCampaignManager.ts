
import { useState } from 'react';
import { DifficultyLevel, HazardType, Phase, GameMode, Player, AIDifficulty, AIArchetype } from '../types';
import { CAMPAIGN_LEVELS } from '../campaignRegistry';
import { UNITS } from '../operativeRegistry';
import { INITIAL_HP } from '../constants';

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
    battle.setMaxRounds(15);
    setCurrentCampaignLevelId(lvlId);
    setCurrentChapter(lvl.chapter);
    
    let baseAp = 3;
    let diff = AIDifficulty.NORMAL;
    // Difficulty scaling
    if (campaignDifficulty === DifficultyLevel.OVERCLOCK) { diff = AIDifficulty.NORMAL; } 
    if (campaignDifficulty === DifficultyLevel.BLACKOUT) { diff = AIDifficulty.HARD; }

    const newPlayers: Player[] = [{ 
      name: 'OPERATIVE', id: 'p0', isAI: false, hp: INITIAL_HP, maxHp: INITIAL_HP, ap: 3, unit: null, isEliminated: false, moveFatigue: 0, blockFatigue: 0, statuses: [], cooldown: 0, activeUsed: false, totalReservedAp: 0, isAbilityActive: false 
    }];
    
    for (let i = 0; i < lvl.enemyCount; i++) {
      newPlayers.push({ 
        name: lvl.enemyName || 'CIPHER', 
        id: `p${i+1}`, 
        isAI: true, 
        hp: Math.floor(INITIAL_HP * lvl.enemyHpMult), 
        maxHp: Math.floor(INITIAL_HP * lvl.enemyHpMult), 
        ap: baseAp, 
        unit: UNITS[lvl.enemyUnit], 
        isEliminated: false, 
        moveFatigue: 0, 
        blockFatigue: 0, 
        statuses: [], 
        cooldown: 0, 
        activeUsed: false, 
        totalReservedAp: 0, 
        isAbilityActive: false, 
        aiConfig: { archetype: lvl.enemyAi, difficulty: diff } 
      });
    }

    battle.setPlayers(newPlayers);
    battle.initDistances(newPlayers);
    battle.setPhase(Phase.BLACKOUT_SELECTION);
    battle.setCurrentPlayerIdx(0);
    battle.setRound(1);
    battle.setFogOfWarActive(lvl.hazard === HazardType.FOG_OF_WAR ? 99 : 0);
  };

  const checkCampaignVictory = (players: Player[]) => {
    if (battle.victoryReason) return; // Prevent double triggering
    if (!currentCampaignLevelId) return;
    
    const lvl = CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevelId);
    if (!lvl) return;

    const player = players.find(p => !p.isAI);
    const aliveEnemies = players.filter(p => p.isAI && !p.isEliminated);
      
    if (aliveEnemies.length === 0 && !player?.isEliminated) {
      battle.setVictoryReason("OPERATIONAL_SUCCESS");
      progression.updateStats(true); // Record win
      
      // Rewards
      progression.setCredits((prev: number) => prev + lvl.creditReward);
      progression.setXp((prev: number) => prev + lvl.xpReward);
      
      setLastEarnedCredits(lvl.creditReward);
      setLastEarnedXp(lvl.xpReward);
      
      if (lvl.unlockUnit && !progression.unlockedUnits.includes(lvl.unlockUnit)) {
        progression.setUnlockedUnits((prev: any[]) => [...prev, lvl.unlockUnit!]);
      }
      
      const lvlIdx = CAMPAIGN_LEVELS.findIndex(l => l.id === currentCampaignLevelId);
      if (lvlIdx + 1 >= progression.highestLevelReached) {
        progression.setHighestLevelReached(lvlIdx + 2);
      }
    } else if (player?.isEliminated) {
      battle.setVictoryReason("DATA_CORRUPTION_DETECTED");
      progression.updateStats(false); // Record loss
    }
  };

  return {
    currentChapter, setCurrentChapter,
    currentCampaignLevelId, setCurrentCampaignLevelId,
    campaignDifficulty, setCampaignDifficulty,
    lastEarnedCredits, lastEarnedXp,
    startCampaignLevel,
    checkCampaignVictory
  };
}
