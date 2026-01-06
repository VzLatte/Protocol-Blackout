
import { useState, useEffect, useRef } from 'react';
import { 
  GameMode, 
  Phase, 
  Tab,
  Player, 
  UnitType, 
  TurnData, 
  ResolutionLog,
  VisualLevel,
  AIArchetype,
  AIDifficulty,
  Action,
  RangeZone,
  HazardType,
  DifficultyLevel
} from '../types';
import { 
  INITIAL_HP, 
  CHAOS_DECK,
  ACTION_COSTS,
  RANGE_VALUES
} from '../constants';
import { CAMPAIGN_LEVELS } from '../campaignRegistry';
import { UNITS, UNIT_PRICES } from '../operativeRegistry';
import { getCurrentEscalation } from '../apManager';
import { resolveCombat } from '../combatEngine';
import { useTutorial } from './useTutorial';
import { AudioService } from '../services/audioService';
import { calculateAIMove } from '../aiLogic';

const PROMO_CODES: Record<string, number> = {
  'BLACKOUT': 1000,
  'PROTOCOL': 500,
  'NEURAL': 5000,
  'CYBER': 250,
  'OXYGEN': 2000
};

export function useGameState() {
  const [phase, setPhase] = useState<Phase>(Phase.SPLASH);
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.TERMINAL);
  const [mode, setMode] = useState<GameMode>(GameMode.TACTICAL);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(10);
  const [currentTurnSubmissions, setCurrentTurnSubmissions] = useState<TurnData[]>([]);
  const [fullHistory, setFullHistory] = useState<TurnData[][]>([]);
  const [resolutionLogs, setResolutionLogs] = useState<ResolutionLog[]>([]);
  const [activeChaosEvent, setActiveChaosEvent] = useState<{name: string, description: string} | null>(null);
  const [fogOfWarActive, setFogOfWarActive] = useState(0);
  const [phaseTransition, setPhaseTransition] = useState<string | null>(null);
  const [victoryReason, setVictoryReason] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [distanceMatrix, setDistanceMatrix] = useState<Map<string, number>>(new Map());

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('protocol_stats');
    return saved ? JSON.parse(saved) : { wins: 0, losses: 0, totalGames: 0 };
  });

  const [usedPromoCodes, setUsedPromoCodes] = useState<string[]>(() => {
    const saved = localStorage.getItem('protocol_used_promos');
    return saved ? JSON.parse(saved) : [];
  });

  const [cipheredUnits, setCipheredUnits] = useState<UnitType[]>(() => {
    const saved = localStorage.getItem('protocol_ciphers');
    return saved ? JSON.parse(saved) : [UnitType.GHOST, UnitType.AEGIS, UnitType.REAPER];
  });

  const [masteryLevels, setMasteryLevels] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('protocol_mastery');
    return saved ? JSON.parse(saved) : {};
  });

  const [campaignDifficulty, setCampaignDifficulty] = useState<DifficultyLevel>(DifficultyLevel.NORMAL);
  const [highestDifficultyReached, setHighestDifficultyReached] = useState<number>(() => {
    const saved = localStorage.getItem('protocol_difficulty_progression');
    return saved ? parseInt(saved) : 0;
  });

  const [hasSeenIntro, setHasSeenIntro] = useState(() => localStorage.getItem('protocol_has_seen_intro') === 'true');
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => localStorage.getItem('protocol_has_completed_tutorial') === 'true');
  
  const { tutorial, setTutorial, checkTutorialProgress, completeTutorial } = useTutorial(hasCompletedTutorial);

  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('protocol_credits');
    return saved ? parseInt(saved) : 0;
  });

  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('protocol_xp');
    return saved ? parseInt(saved) : 0;
  });

  const [unlockedUnits, setUnlockedUnits] = useState<UnitType[]>(() => {
    const saved = localStorage.getItem('protocol_unlocks');
    return saved ? JSON.parse(saved) : [UnitType.GHOST, UnitType.AEGIS, UnitType.REAPER];
  });
  const [highestLevelReached, setHighestLevelReached] = useState<number>(() => {
    const saved = localStorage.getItem('protocol_progression');
    return saved ? parseInt(saved) : 1;
  });
  const [currentCampaignLevelId, setCurrentCampaignLevelId] = useState<string | null>(null);
  const [lastEarnedCredits, setLastEarnedCredits] = useState(0);
  const [lastEarnedXp, setLastEarnedXp] = useState(0);

  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(() => localStorage.getItem('protocol_bgm_enabled') !== 'false');
  const [bgmVolume, setBgmVolume] = useState(() => parseFloat(localStorage.getItem('protocol_bgm_volume') || '0.5'));
  const [visualLevel, setVisualLevel] = useState<VisualLevel>(VisualLevel.MID);
  
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiThinkingRef = useRef(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioService = AudioService.getInstance();

  useEffect(() => {
    localStorage.setItem('protocol_credits', credits.toString());
    localStorage.setItem('protocol_xp', xp.toString());
    localStorage.setItem('protocol_unlocks', JSON.stringify(unlockedUnits));
    localStorage.setItem('protocol_ciphers', JSON.stringify(cipheredUnits));
    localStorage.setItem('protocol_mastery', JSON.stringify(masteryLevels));
    localStorage.setItem('protocol_progression', highestLevelReached.toString());
    localStorage.setItem('protocol_difficulty_progression', highestDifficultyReached.toString());
    localStorage.setItem('protocol_stats', JSON.stringify(stats));
    localStorage.setItem('protocol_used_promos', JSON.stringify(usedPromoCodes));
    localStorage.setItem('protocol_has_seen_intro', hasSeenIntro.toString());
    localStorage.setItem('protocol_has_completed_tutorial', hasCompletedTutorial.toString());
    localStorage.setItem('protocol_bgm_enabled', bgmEnabled.toString());
    localStorage.setItem('protocol_bgm_volume', bgmVolume.toString());
  }, [credits, xp, unlockedUnits, cipheredUnits, masteryLevels, highestLevelReached, highestDifficultyReached, stats, usedPromoCodes, hasSeenIntro, hasCompletedTutorial, bgmEnabled, bgmVolume]);

  const playSfx = (type: any) => audioService.playProceduralSfx(type, sfxEnabled);

  const getMastery = (type: UnitType) => masteryLevels[type] || 1;
  const incrementMastery = (type: UnitType) => {
    setMasteryLevels(prev => ({
      ...prev,
      [type]: (prev[type] || 1) + 1
    }));
  };

  const [setupCount, setSetupCount] = useState(2);
  const [playerConfigs, setPlayerConfigs] = useState(() => 
    Array(6).fill(null).map((_, i) => ({ 
      name: `AGENT_${i+1}`, isAI: false, archetype: AIArchetype.STRATEGIST, difficulty: AIDifficulty.NORMAL 
    }))
  );
  
  const [editingNameIdx, setEditingNameIdx] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [confirmingUnit, setConfirmingUnit] = useState<UnitType | null>(null);

  const [localBlockAp, setLocalBlockAp] = useState(0);
  const [localAttackAp, setLocalAttackAp] = useState(0);
  const [localMoveAp, setLocalMoveAp] = useState(0);
  const [localAbilityActive, setLocalAbilityActive] = useState(false);
  const [localMoveIntent, setLocalMoveIntent] = useState<any>(undefined);
  const [localTargetId, setLocalTargetId] = useState<string | undefined>(undefined);
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const purchaseUnit = (type: UnitType) => {
    const price = UNIT_PRICES[type].cost;
    const isCiphered = cipheredUnits.includes(type);
    if (credits >= price && !unlockedUnits.includes(type) && isCiphered) {
      setCredits(prev => prev - price);
      setUnlockedUnits(prev => [...prev, type]);
      playSfx('success');
    }
  };

  const usePromoCode = (code: string) => {
    const normalized = code.toUpperCase().trim();
    if (usedPromoCodes.includes(normalized)) return "CODE_ALREADY_REDEEMED";

    // Debug Promo Code for Testing
    if (normalized === 'TEST_UNLOCK') {
        const allUnits = Object.values(UnitType);
        setUnlockedUnits(allUnits);
        setCipheredUnits(allUnits);
        setHighestLevelReached(CAMPAIGN_LEVELS.length + 1);
        setHighestDifficultyReached(2);
        setCredits(prev => prev + 99999);
        setXp(prev => prev + 99999);
        playSfx('success');
        return "DEBUG_OVERRIDE: SYSTEM_UNLOCKED";
    }

    if (PROMO_CODES[normalized]) {
      const reward = PROMO_CODES[normalized];
      setCredits(prev => prev + reward);
      setUsedPromoCodes(prev => [...prev, normalized]);
      playSfx('success');
      return `ACCESS_GRANTED: +${reward} CR`;
    }
    playSfx('danger');
    return "INVALID_ACCESS_KEY";
  };

  const startCampaignLevel = (lvlId: string) => {
    const lvl = CAMPAIGN_LEVELS.find(l => l.id === lvlId);
    if (!lvl) return;

    setMode(GameMode.TACTICAL);
    setMaxRounds(15);
    setCurrentCampaignLevelId(lvlId);
    setCurrentChapter(lvl.chapter);
    
    let baseAp = 3;
    let diff = AIDifficulty.NORMAL;

    const configs = [{ name: 'OPERATIVE', isAI: false }];
    for(let i = 0; i < lvl.enemyCount; i++) {
       configs.push({ 
         name: lvl.enemyName || `CIPHER_${lvl.enemyUnit}_${i}`, 
         isAI: true, 
         archetype: lvl.enemyAi, 
         difficulty: diff, 
         unitType: lvl.enemyUnit, 
         ap: baseAp,
         hpMult: lvl.enemyHpMult
       } as any);
    }

    const newPlayers: Player[] = configs.map((cfg: any, idx) => ({
      id: `p${idx}`, 
      name: cfg.name, 
      unit: idx === 0 ? null : UNITS[cfg.unitType], 
      hp: idx === 0 ? 1000 : Math.floor(UNITS[cfg.unitType].hp * (cfg.hpMult || 1.0)),
      maxHp: idx === 0 ? 1000 : Math.floor(UNITS[cfg.unitType].hp * (cfg.hpMult || 1.0)), 
      ap: cfg.ap || 3, 
      fatigue: 0,
      isEliminated: false, 
      isAI: cfg.isAI || false,
      aiConfig: cfg.isAI ? { archetype: cfg.archetype, difficulty: cfg.difficulty } : undefined,
      totalReservedAp: 0, 
      cooldown: 0, 
      activeUsed: false, 
      statuses: [], 
      isAbilityActive: false,
    }));

    setPlayers(newPlayers);
    initDistances(newPlayers);
    setPhase(Phase.BLACKOUT_SELECTION);
    setCurrentPlayerIdx(0);
    setRound(1);
    setFogOfWarActive(lvl.hazard === HazardType.FOG_OF_WAR ? 99 : 0);
  };

  const resolveTurn = (submissions: TurnData[]) => {
    const lvl = CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevelId);
    const hazard = lvl?.hazard || HazardType.NONE;

    // Check for "Blackout AI Cheating"
    const nextSubmissions = [...submissions];
    nextSubmissions.forEach(sub => {
       const p = players.find(x => x.id === sub.playerId);
       if (p?.isAI && campaignDifficulty === DifficultyLevel.BLACKOUT) {
          const cheatMove = calculateAIMove(p, players, fullHistory, round, currentChapter, campaignDifficulty, submissions);
          sub.action = cheatMove;
       }
    });

    setFullHistory(prev => [...prev, nextSubmissions]);
    const result = resolveCombat(players, nextSubmissions, round, maxRounds, mode, activeChaosEvent, distanceMatrix, campaignDifficulty, hazard);
    setPlayers(result.nextPlayers);
    setResolutionLogs(result.logs);
    setDistanceMatrix(result.nextDistanceMatrix);
    setPhase(Phase.RESOLUTION);
    setRound(result.nextRound);
    
    if (currentCampaignLevelId && lvl) {
      const player = result.nextPlayers.find(p => !p.isAI);
      const aliveEnemies = result.nextPlayers.filter(p => p.isAI && !p.isEliminated);
      
      if (aliveEnemies.length === 0 && !player?.isEliminated) {
        setVictoryReason("OPERATIONAL_SUCCESS");
        
        // Award Mastery
        if (player.unit) {
          incrementMastery(player.unit.type);
        }

        // Rewards
        setCredits(prev => prev + lvl.creditReward);
        setXp(prev => prev + lvl.xpReward);
        
        setLastEarnedCredits(lvl.creditReward);
        setLastEarnedXp(lvl.xpReward);
        
        if (lvl.unlockUnit && !unlockedUnits.includes(lvl.unlockUnit)) setUnlockedUnits(prev => [...prev, lvl.unlockUnit!]);
        
        const lvlIdx = CAMPAIGN_LEVELS.findIndex(l => l.id === currentCampaignLevelId);
        if (lvlIdx + 1 >= highestLevelReached) setHighestLevelReached(lvlIdx + 2);

        if (lvl.chapter === 1 && lvl.sequence === 12 && highestDifficultyReached < 1) setHighestDifficultyReached(1);
        if (lvl.chapter === 3 && lvl.sequence === 12 && highestDifficultyReached < 2) setHighestDifficultyReached(2);

      } else if (player?.isEliminated) {
        setVictoryReason("DATA_CORRUPTION_DETECTED");
      }
    }
  };

  const initDistances = (pList: Player[]) => {
    const newMatrix = new Map<string, number>();
    for (let i = 0; i < pList.length; i++) {
      for (let j = i + 1; j < pList.length; j++) {
         const key = [pList[i].id, pList[j].id].sort().join('-');
         newMatrix.set(key, 1);
      }
    }
    setDistanceMatrix(newMatrix);
  };

  const finalizePlayers = () => {
    const newPlayers: Player[] = playerConfigs.slice(0, setupCount).map((cfg: any, idx) => ({
      id: `p${idx}`, 
      name: cfg.name, 
      unit: null, 
      hp: INITIAL_HP,
      maxHp: INITIAL_HP, 
      ap: 3, 
      fatigue: 0,
      isEliminated: false, 
      isAI: cfg.isAI || false,
      aiConfig: cfg.isAI ? { archetype: cfg.archetype, difficulty: cfg.difficulty } : undefined,
      totalReservedAp: 0, 
      cooldown: 0, 
      activeUsed: false, 
      statuses: [], 
      isAbilityActive: false,
    }));

    setPlayers(newPlayers);
    initDistances(newPlayers);
    setPhase(Phase.BLACKOUT_SELECTION);
    setCurrentPlayerIdx(0);
    setRound(1);
    playSfx('confirm');
  };

  const selectUnit = (type: UnitType) => {
    const nextPlayers = [...players];
    const u = UNITS[type];
    nextPlayers[currentPlayerIdx].unit = u;
    nextPlayers[currentPlayerIdx].hp = u.hp;
    nextPlayers[currentPlayerIdx].maxHp = u.maxHp;
    setPlayers(nextPlayers);
    setConfirmingUnit(null);
    let nextIdx = currentPlayerIdx + 1;
    while (nextIdx < players.length && players[nextIdx].isEliminated) nextIdx++;
    if (nextIdx < players.length) {
      setCurrentPlayerIdx(nextIdx);
    } else { 
      setCurrentPlayerIdx(0); 
      setPhase(Phase.PASS_PHONE); 
    }
  };

  useEffect(() => {
    if (phase === Phase.PASS_PHONE && players[currentPlayerIdx]?.isAI) {
      const timer = setTimeout(() => {
        setPhase(Phase.TURN_ENTRY);
      }, 600); 
      return () => clearTimeout(timer);
    }
  }, [phase, currentPlayerIdx, players]);

  useEffect(() => {
    if (phase === Phase.BLACKOUT_SELECTION && players[currentPlayerIdx]?.isAI) {
      const timer = setTimeout(() => {
        if (players[currentPlayerIdx].unit) {
           let nextIdx = currentPlayerIdx + 1;
           while (nextIdx < players.length && players[nextIdx].isEliminated) nextIdx++;
           if (nextIdx < players.length) setCurrentPlayerIdx(nextIdx);
           else { setCurrentPlayerIdx(0); setPhase(Phase.PASS_PHONE); }
        } else {
           selectUnit(UnitType.GHOST); 
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, currentPlayerIdx, players]);

  // AI Thinking Lifecycle - Robust Fix
  useEffect(() => {
    const isAiTurn = phase === Phase.TURN_ENTRY && players[currentPlayerIdx]?.isAI;

    // Reset thinking state if phase changes or it's no longer AI turn
    if (!isAiTurn) {
      if (aiThinkingRef.current) {
        aiThinkingRef.current = false;
        setIsAIThinking(false);
      }
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
      return;
    }

    // Guard: Do not start if already in thinking state
    if (aiThinkingRef.current) return;

    aiThinkingRef.current = true;
    setIsAIThinking(true);

    const currentLevel = currentCampaignLevelId ? CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevelId) : null;
    const sequence = currentLevel?.sequence || 1;
    const baseDelay = (currentChapter * 500);
    const seqDelay = (sequence * 120);
    const thinkingTime = Math.max(800, baseDelay + seqDelay + Math.random() * 500);

    aiTimerRef.current = setTimeout(() => {
      // Final check: Still AI turn?
      if (phase === Phase.TURN_ENTRY && players[currentPlayerIdx]?.isAI) {
        let aiMove: Action = { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false };
        try {
          if (campaignDifficulty !== DifficultyLevel.BLACKOUT) {
            aiMove = calculateAIMove(players[currentPlayerIdx], players, fullHistory, round, currentChapter, campaignDifficulty);
          }
        } catch (e) {
          console.error("AI Logic Error", e);
        }

        aiThinkingRef.current = false;
        setIsAIThinking(false);
        submitAction(aiMove);
      }
    }, thinkingTime);

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [phase, currentPlayerIdx, players, campaignDifficulty, currentChapter, currentCampaignLevelId, fullHistory, round]);

  const submitAction = (action: Action) => {
    // Force clear thinking state just in case
    aiThinkingRef.current = false;
    setIsAIThinking(false);
    
    const submission: TurnData = { playerId: players[currentPlayerIdx].id, action };
    const nextSubmissions = [...currentTurnSubmissions, submission];
    setCurrentTurnSubmissions(nextSubmissions);
    let nextIdx = currentPlayerIdx + 1;
    while (nextIdx < players.length && players[nextIdx].isEliminated) nextIdx++;
    if (nextIdx < players.length) {
      setCurrentPlayerIdx(nextIdx);
      setPhase(Phase.PASS_PHONE);
    } else resolveTurn(nextSubmissions);
  };

  const nextTurn = () => {
    setLocalBlockAp(0);
    setLocalAttackAp(0);
    setLocalMoveAp(0);
    setLocalAbilityActive(false);
    setLocalTargetId(undefined);
    setLocalMoveIntent(undefined);
    setCurrentTurnSubmissions([]);
    setResolutionLogs([]);
    setCurrentPlayerIdx(0);
    const alivePlayers = players.filter(p => !p.isEliminated);
    const isGameOver = alivePlayers.length <= 1 || round > maxRounds || victoryReason !== null;
    if (isGameOver) setPhase(Phase.GAME_OVER);
    else setPhase(Phase.PASS_PHONE);
    playSfx('confirm');
  };

  const resetToMain = () => {
    setPhase(Phase.GAME_TYPE_SELECTION);
    setPlayers([]);
    setRound(1);
    setCurrentTurnSubmissions([]);
    setResolutionLogs([]);
    setActiveChaosEvent(null);
    setFogOfWarActive(0);
    setDistanceMatrix(new Map());
    setCurrentCampaignLevelId(null);
    setVictoryReason(null);
    aiThinkingRef.current = false;
    setIsAIThinking(false);
    setIsExitConfirming(false);
  };

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExitConfirming, setIsExitConfirming] = useState(false);

  return {
    phase, setPhase, mode, setMode, players, setPlayers, currentPlayerIdx, setCurrentPlayerIdx,
    round, setRound, maxRounds, setMaxRounds, currentTurnSubmissions, resolutionLogs, credits, xp,
    unlockedUnits, cipheredUnits, masteryLevels, getMastery, incrementMastery, campaignDifficulty, setCampaignDifficulty, highestDifficultyReached, 
    highestLevelReached, currentChapter, setCurrentChapter, purchaseUnit, usePromoCode, stats, 
    lastEarnedCredits, lastEarnedXp, startCampaignLevel, finalizePlayers, selectUnit,
    submitAction, nextTurn, resetToMain, playSfx,
    localBlockAp, setLocalBlockAp, localAttackAp, setLocalAttackAp, localTargetId, setLocalTargetId,
    localMoveAp, setLocalMoveAp, localMoveIntent, setLocalMoveIntent, localAbilityActive, setLocalAbilityActive,
    timeLeft, timeLimit, scrollRef, isHelpOpen, setIsHelpOpen, isSettingsOpen, setIsSettingsOpen,
    isExitConfirming, setIsExitConfirming, visualLevel, setVisualLevel, bgmEnabled, setBgmEnabled, 
    bgmVolume, setBgmVolume, sfxEnabled, setSfxEnabled, currentTab, setCurrentTab,
    setupCount, setSetupCount, setTimeLimit, playerConfigs, updatePlayerConfig: (i:number, u:any) => {
        setPlayerConfigs(prev => { const n = [...prev]; n[i] = {...n[i], ...u}; return n; });
    },
    editingNameIdx, startEditName: (i:any)=> {setEditingNameIdx(i); setTempName(playerConfigs[i].name)}, 
    saveEditName: () => {
        setPlayerConfigs(prev => { const n = [...prev]; n[editingNameIdx!] = {...n[editingNameIdx!], name: tempName}; return n; });
        setEditingNameIdx(null);
    }, 
    cancelEditName: () => setEditingNameIdx(null), tempName, setTempName,
    confirmingUnit, setConfirmingUnit, hasSeenIntro, setHasSeenIntro, tutorial, setTutorial,
    activeChaosEvent, victoryReason, fogOfWarActive, distanceMatrix, currentCampaignLevelId, isAIThinking,
    startGame: (m:any) => { setMode(m); setPhase(Phase.SETUP_PLAYERS); playSfx('confirm'); }
  };
}
