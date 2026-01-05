
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
  RangeZone
} from './types';
import { 
  INITIAL_HP, 
  CHAOS_DECK,
  ACTION_COSTS,
  RANGE_VALUES
} from './constants';
import { UNITS, UNIT_PRICES } from './operativeRegistry';
import { getCurrentEscalation } from './apManager';
import { resolveCombat } from './combatEngine';
import { useTutorial } from './useTutorial';
import { AudioService } from './services/audioService';
import { calculateAIMove } from './aiLogic';

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
  
  const [distanceMatrix, setDistanceMatrix] = useState<Map<string, number>>(new Map());

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('protocol_stats');
    return saved ? JSON.parse(saved) : { wins: 0, losses: 0, totalGames: 0 };
  });

  const [usedPromoCodes, setUsedPromoCodes] = useState<string[]>(() => {
    const saved = localStorage.getItem('protocol_used_promos');
    return saved ? JSON.parse(saved) : [];
  });

  const [hasSeenIntro, setHasSeenIntro] = useState(() => localStorage.getItem('protocol_has_seen_intro') === 'true');
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => localStorage.getItem('protocol_has_completed_tutorial') === 'true');
  
  const { tutorial, setTutorial, checkTutorialProgress, completeTutorial } = useTutorial(hasCompletedTutorial);

  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('protocol_credits');
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
  const [currentCampaignLevel, setCurrentCampaignLevel] = useState<number | null>(null);
  const [lastEarnedCredits, setLastEarnedCredits] = useState(0);

  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(() => localStorage.getItem('protocol_bgm_enabled') !== 'false');
  const [bgmVolume, setBgmVolume] = useState(() => parseFloat(localStorage.getItem('protocol_bgm_volume') || '0.5'));
  const [visualLevel, setVisualLevel] = useState<VisualLevel>(VisualLevel.MID);

  const audioService = AudioService.getInstance();

  useEffect(() => {
    localStorage.setItem('protocol_credits', credits.toString());
    localStorage.setItem('protocol_unlocks', JSON.stringify(unlockedUnits));
    localStorage.setItem('protocol_progression', highestLevelReached.toString());
    localStorage.setItem('protocol_stats', JSON.stringify(stats));
    localStorage.setItem('protocol_used_promos', JSON.stringify(usedPromoCodes));
    localStorage.setItem('protocol_has_seen_intro', hasSeenIntro.toString());
    localStorage.setItem('protocol_has_completed_tutorial', hasCompletedTutorial.toString());
    localStorage.setItem('protocol_bgm_enabled', bgmEnabled.toString());
    localStorage.setItem('protocol_bgm_volume', bgmVolume.toString());
  }, [credits, unlockedUnits, highestLevelReached, stats, usedPromoCodes, hasSeenIntro, hasCompletedTutorial, bgmEnabled, bgmVolume]);

  const playSfx = (type: any) => audioService.playProceduralSfx(type, sfxEnabled);

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
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [isExitConfirming, setIsExitConfirming] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);

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
    if (credits >= price && !unlockedUnits.includes(type)) {
      setCredits(prev => prev - price);
      setUnlockedUnits(prev => [...prev, type]);
      playSfx('success');
    }
  };

  const usePromoCode = (code: string) => {
    const normalized = code.toUpperCase().trim();
    if (usedPromoCodes.includes(normalized)) return "CODE_ALREADY_REDEEMED";
    if (normalized === 'TEST_UNLOCK') {
      setUnlockedUnits(Object.values(UnitType));
      setUsedPromoCodes(prev => [...prev, normalized]);
      playSfx('success');
      return "SECURITY_BYPASS: ALL UNITS UNLOCKED";
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

  const updatePlayerConfig = (idx: number, updates: any) => {
    setPlayerConfigs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const resetToMain = () => {
    setPhase(Phase.GAME_TYPE_SELECTION);
    setPlayers([]);
    setRound(1);
    setCurrentTurnSubmissions([]);
    setResolutionLogs([]);
    setIsExitConfirming(false);
    setActiveChaosEvent(null);
    setFogOfWarActive(0);
    setDistanceMatrix(new Map());
    setCurrentCampaignLevel(null);
  };

  const initDistances = (pList: Player[]) => {
    const newMatrix = new Map<string, number>();
    for (let i = 0; i < pList.length; i++) {
      for (let j = i + 1; j < pList.length; j++) {
         const key = [pList[i].id, pList[j].id].sort().join('-');
         newMatrix.set(key, 1); // MID
      }
    }
    setDistanceMatrix(newMatrix);
  };

  const startCampaignLevel = (lvl: number) => {
    if (lvl > highestLevelReached) return;
    setMode(GameMode.TACTICAL);
    setMaxRounds(10);
    setCurrentCampaignLevel(lvl);
    let configs: any[] = [];
    if (lvl === 1) configs = [{ name: 'PLAYER', isAI: false }, { name: 'THE_TURTLE', isAI: true, archetype: AIArchetype.TURTLE, difficulty: AIDifficulty.EASY }];
    else if (lvl === 2) configs = [{ name: 'PLAYER', isAI: false }, { name: 'AGGRO_UNIT_X', isAI: true, archetype: AIArchetype.AGGRO, difficulty: AIDifficulty.EASY }];
    else if (lvl === 3) configs = [{ name: 'PLAYER', isAI: false }, { name: 'VULCAN', isAI: true, archetype: AIArchetype.TURTLE, difficulty: AIDifficulty.NORMAL }, { name: 'STRIKE', isAI: true, archetype: AIArchetype.AGGRO, difficulty: AIDifficulty.NORMAL }];
    else if (lvl === 4) configs = [{ name: 'PLAYER', isAI: false }, { name: 'OBSIDIAN', isAI: true, archetype: AIArchetype.STRATEGIST, difficulty: AIDifficulty.NORMAL }, { name: 'DAGGER', isAI: true, archetype: AIArchetype.AGGRO, difficulty: AIDifficulty.NORMAL }];
    else if (lvl === 5) configs = [{ name: 'PLAYER', isAI: false }, { name: 'THE_ARCHITECT', isAI: true, archetype: AIArchetype.STRATEGIST, difficulty: AIDifficulty.HARD }];

    const newPlayers: Player[] = configs.map((cfg, idx) => ({
      id: `p${idx}`, name: cfg.name, unit: null, hp: 1000, maxHp: 1000, ap: 3, isEliminated: false, isAI: cfg.isAI,
      aiConfig: cfg.isAI ? { archetype: cfg.archetype, difficulty: cfg.difficulty } : undefined,
      totalReservedAp: 0, fatigue: 0, cooldown: 0, activeUsed: false, statuses: [], isAbilityActive: false
    }));
    setPlayers(newPlayers);
    initDistances(newPlayers);
    setPhase(Phase.BLACKOUT_SELECTION);
    setCurrentPlayerIdx(0);
    setRound(1);
  };

  const startGame = (gameMode: GameMode) => {
    setMode(gameMode);
    setCurrentCampaignLevel(null);
    setPhase(Phase.SETUP_PLAYERS);
  };

  const finalizePlayers = () => {
    const newPlayers: Player[] = playerConfigs.slice(0, setupCount).map((cfg, idx) => ({
      id: `p${idx}`, name: cfg.name, unit: null, hp: 1000, maxHp: 1000, ap: 3, isEliminated: false, isAI: cfg.isAI,
      aiConfig: cfg.isAI ? { archetype: cfg.archetype, difficulty: cfg.difficulty } : undefined,
      totalReservedAp: 0, fatigue: 0, cooldown: 0, activeUsed: false, statuses: [], isAbilityActive: false
    }));
    setPlayers(newPlayers);
    initDistances(newPlayers);
    setPhase(Phase.BLACKOUT_SELECTION);
    setCurrentPlayerIdx(0);
    setActiveChaosEvent(null);
    setFogOfWarActive(0);
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

  // Fix AI Unit Selection Hang
  useEffect(() => {
    if (phase === Phase.BLACKOUT_SELECTION && players[currentPlayerIdx]?.isAI) {
      const timer = setTimeout(() => {
        const availableTypes = Object.values(UnitType);
        // AI selects from its unlocked or default set (assuming starters at minimum)
        const starters = [UnitType.GHOST, UnitType.AEGIS, UnitType.REAPER];
        const unlocked = availableTypes.filter(t => unlockedUnits.includes(t) || starters.includes(t));
        const randomUnit = unlocked[Math.floor(Math.random() * unlocked.length)];
        selectUnit(randomUnit);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentPlayerIdx, players, unlockedUnits]);

  // AUTO-TRANSITION PassPhone for AI
  useEffect(() => {
    if (phase === Phase.PASS_PHONE && players[currentPlayerIdx]?.isAI) {
      const timer = setTimeout(() => {
        setPhase(Phase.TURN_ENTRY);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentPlayerIdx, players]);

  // Fix AI Turn Entry Logic
  useEffect(() => {
    if (phase === Phase.TURN_ENTRY && players[currentPlayerIdx]?.isAI) {
      setIsAIThinking(true);
      const timer = setTimeout(() => {
        const aiMove = calculateAIMove(players[currentPlayerIdx], players, fullHistory, round);
        submitAction(aiMove);
        setIsAIThinking(false);
      }, 2500); // Slightly longer for "thinking" UX
      return () => clearTimeout(timer);
    }
  }, [phase, currentPlayerIdx, players]);

  const submitAction = (action: Action) => {
    const submission: TurnData = { playerId: players[currentPlayerIdx].id, action };
    if (tutorial.isActive && currentCampaignLevel !== null) completeTutorial();

    const nextSubmissions = [...currentTurnSubmissions, submission];
    setCurrentTurnSubmissions(nextSubmissions);
    let nextIdx = currentPlayerIdx + 1;
    while (nextIdx < players.length && players[nextIdx].isEliminated) nextIdx++;
    if (nextIdx < players.length) {
      setCurrentPlayerIdx(nextIdx);
      setPhase(Phase.PASS_PHONE); // Always show pass phone view
    } else resolveTurn(nextSubmissions);
  };

  const resolveTurn = (submissions: TurnData[]) => {
    setFullHistory(prev => [...prev, submissions]);
    const result = resolveCombat(players, submissions, round, maxRounds, mode, activeChaosEvent, distanceMatrix);
    setPlayers(result.nextPlayers);
    setResolutionLogs(result.logs);
    setDistanceMatrix(result.nextDistanceMatrix);
    setPhase(Phase.RESOLUTION);
    setRound(result.nextRound);
    let nextFog = fogOfWarActive > 0 ? fogOfWarActive - 1 : 0;
    if (mode === GameMode.CHAOS) {
      const nextEvent = CHAOS_DECK[Math.floor(Math.random() * CHAOS_DECK.length)];
      setActiveChaosEvent(nextEvent);
      if (nextEvent.name === 'FOG OF WAR') nextFog = 2;
    }
    setFogOfWarActive(nextFog);
    const alivePlayers = result.nextPlayers.filter(p => !p.isEliminated);
    if (round >= maxRounds && alivePlayers.length > 1) {
       const winner = alivePlayers.sort((a, b) => b.hp - a.hp)[0];
       result.nextPlayers.forEach(p => { if (p.id !== winner.id) p.isEliminated = true; });
       setVictoryReason("EXTRACTION_SUCCESS");
    }
  };

  const nextTurn = () => {
    const alivePlayers = players.filter(p => !p.isEliminated);
    if (alivePlayers.length <= 1) setPhase(Phase.GAME_OVER);
    else {
      setCurrentTurnSubmissions([]);
      const firstAliveIdx = players.findIndex(p => !p.isEliminated);
      setCurrentPlayerIdx(firstAliveIdx);
      setPhase(Phase.PASS_PHONE); // Always go to pass phone view
    }
  };

  useEffect(() => {
    if (phase === Phase.TURN_ENTRY) {
      setLocalBlockAp(0); setLocalAttackAp(0); setLocalMoveAp(0);
      setLocalAbilityActive(false); setLocalMoveIntent(undefined); setLocalTargetId(undefined);
    }
  }, [phase, currentPlayerIdx]);

  return {
    phase, setPhase, mode, setMode, players, setPlayers, currentPlayerIdx, setCurrentPlayerIdx,
    round, setRound, maxRounds, setMaxRounds, currentTurnSubmissions, resolutionLogs, credits,
    unlockedUnits, purchaseUnit, usePromoCode, stats, lastEarnedCredits, startCampaignLevel, startGame, finalizePlayers, selectUnit,
    submitAction, nextTurn, resetToMain, playSfx,
    localBlockAp, setLocalBlockAp, localAttackAp, setLocalAttackAp, localTargetId, setLocalTargetId,
    localMoveAp, setLocalMoveAp, localMoveIntent, setLocalMoveIntent, localAbilityActive, setLocalAbilityActive,
    timeLeft, timeLimit, scrollRef, isHelpOpen, setIsHelpOpen, isSettingsOpen, setIsSettingsOpen,
    isExitConfirming, setIsExitConfirming, visualLevel, setVisualLevel, bgmEnabled, setBgmEnabled, 
    bgmVolume, setBgmVolume, sfxEnabled, setSfxEnabled, currentTab, setCurrentTab,
    setupCount, setSetupCount, setTimeLimit, playerConfigs, updatePlayerConfig,
    editingNameIdx, startEditName: (i:any)=> {setEditingNameIdx(i); setTempName(playerConfigs[i].name)}, 
    saveEditName: () => {updatePlayerConfig(editingNameIdx!, {name: tempName}); setEditingNameIdx(null)}, 
    cancelEditName: () => setEditingNameIdx(null), tempName, setTempName,
    confirmingUnit, setConfirmingUnit, hasSeenIntro, setHasSeenIntro, tutorial, setTutorial,
    activeChaosEvent, victoryReason, fogOfWarActive, distanceMatrix, currentCampaignLevel, isAIThinking
  };
}
