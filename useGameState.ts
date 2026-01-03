
import { useState, useEffect, useRef } from 'react';
import { 
  GameMode, 
  Phase, 
  Tab,
  Player, 
  UnitType, 
  ActionType, 
  Action, 
  TurnData, 
  ResolutionLog,
  VisualLevel,
  AIArchetype,
  AIDifficulty
} from './types';
import { 
  UNITS, 
  INITIAL_HP, 
  BASE_ATTACK_DMG, 
  BASE_BLOCK_SHIELD, 
  CHAOS_DECK,
  UNIT_PRICES
} from './constants';
import { calculateAIMove } from './aiLogic';
import { AudioService } from './services/audioService';

const MENU_MUSIC_URL = "https://github.com/VzLatte/Protocol-Blackout/raw/refs/heads/main/Shadow%20in%20the%20Lobby.mp3";

export function useGameState() {
  const [phase, setPhase] = useState<Phase>(Phase.SPLASH);
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.TERMINAL);
  const [mode, setMode] = useState<GameMode>(GameMode.TACTICAL);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [currentTurnSubmissions, setCurrentTurnSubmissions] = useState<TurnData[]>([]);
  const [fullHistory, setFullHistory] = useState<TurnData[][]>([]);
  const [resolutionLogs, setResolutionLogs] = useState<ResolutionLog[]>([]);
  const [activeChaosEvent, setActiveChaosEvent] = useState<{name: string, description: string} | null>(null);
  const [fogOfWarActive, setFogOfWarActive] = useState(0);

  // Archive & Statistics
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('protocol_stats');
    return saved ? JSON.parse(saved) : { wins: 0, losses: 0, totalGames: 0 };
  });

  // Merit-Based Progression
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('protocol_credits');
    return saved ? parseInt(saved) : 0;
  });
  const [unlockedUnits, setUnlockedUnits] = useState<UnitType[]>(() => {
    const saved = localStorage.getItem('protocol_unlocks');
    return saved ? JSON.parse(saved) : [UnitType.GHOST, UnitType.TITAN, UnitType.REAPER];
  });
  const [highestLevelReached, setHighestLevelReached] = useState<number>(() => {
    const saved = localStorage.getItem('protocol_progression');
    return saved ? parseInt(saved) : 1;
  });
  const [currentCampaignLevel, setCurrentCampaignLevel] = useState<number | null>(null);
  const [lastEarnedCredits, setLastEarnedCredits] = useState(0);

  // Settings
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(() => {
    const saved = localStorage.getItem('protocol_bgm_enabled');
    return saved ? saved === 'true' : true;
  });
  const [bgmVolume, setBgmVolume] = useState(() => {
    const saved = localStorage.getItem('protocol_bgm_volume');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [visualLevel, setVisualLevel] = useState<VisualLevel>(VisualLevel.MID);

  const audioService = AudioService.getInstance();

  useEffect(() => {
    localStorage.setItem('protocol_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('protocol_unlocks', JSON.stringify(unlockedUnits));
  }, [unlockedUnits]);

  useEffect(() => {
    localStorage.setItem('protocol_progression', highestLevelReached.toString());
  }, [highestLevelReached]);

  useEffect(() => {
    localStorage.setItem('protocol_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('protocol_bgm_enabled', bgmEnabled.toString());
    if (!bgmEnabled) {
      audioService.stopBGM();
    } else if (phase !== Phase.SPLASH) {
      audioService.playBGM(MENU_MUSIC_URL, bgmVolume);
    }
  }, [bgmEnabled, phase]);

  useEffect(() => {
    localStorage.setItem('protocol_bgm_volume', bgmVolume.toString());
    audioService.setBGMVolume(bgmVolume);
  }, [bgmVolume]);

  const playSfx = (type: 'beep' | 'confirm' | 'cancel' | 'danger' | 'success' | 'startup' | 'buy') => {
    audioService.playProceduralSfx(type, sfxEnabled);
  };

  // Setup
  const [setupCount, setSetupCount] = useState(2);
  const [playerConfigs, setPlayerConfigs] = useState<{name: string, isAI: boolean, archetype: AIArchetype, difficulty: AIDifficulty}[]>(
    Array(6).fill(null).map((_, i) => ({ 
      name: `AGENT_${i+1}`, 
      isAI: false, 
      archetype: AIArchetype.STRATEGIST, 
      difficulty: AIDifficulty.NORMAL 
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

  // Turn Entry Allocation States
  const [localBlockAp, setLocalBlockAp] = useState(0);
  const [localAttackAp, setLocalAttackAp] = useState(0);
  const [localTargetId, setLocalTargetId] = useState<string | undefined>(undefined);
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const usePromoCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === "APPRELEASE") {
      setCredits(prev => prev + 100);
      playSfx('success');
      return "SUCCESS: 100 DATA_CREDITS ADDED.";
    }
    if (clean === "TESTUNLOCK") {
      setUnlockedUnits(Object.values(UnitType));
      setHighestLevelReached(5);
      playSfx('success');
      return "SUCCESS: ALL PROTOCOLS AND LEVELS DECRYPTED.";
    }
    playSfx('cancel');
    return "ERROR: INVALID SECURITY KEY.";
  };

  const resetToMain = () => {
    setPhase(Phase.GAME_TYPE_SELECTION);
    setCurrentTab(Tab.TERMINAL);
    setPlayers([]);
    setCurrentPlayerIdx(0);
    setRound(1);
    setCurrentTurnSubmissions([]);
    setFullHistory([]);
    setResolutionLogs([]);
    setActiveChaosEvent(null);
    setFogOfWarActive(0);
    setCurrentCampaignLevel(null);
    setIsExitConfirming(false); 
    setIsSettingsOpen(false);
    setIsHelpOpen(false);
    setIsLockedIn(false);
    setIsAIThinking(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const autoPass = () => {
    playSfx('danger');
    submitAction({ blockAp: 0, attackAp: 0, targetId: undefined });
  };

  const startCampaignLevel = (lvl: number) => {
    if (lvl > highestLevelReached) {
      playSfx('cancel');
      return;
    }
    playSfx('confirm');
    setMode(GameMode.TACTICAL);
    setCurrentCampaignLevel(lvl);
    let configs: any[] = [];
    if (lvl === 1) configs = [{ name: 'PLAYER', isAI: false }, { name: 'THE_TURTLE', isAI: true, archetype: AIArchetype.TURTLE, difficulty: AIDifficulty.EASY }];
    else if (lvl === 2) configs = [{ name: 'PLAYER', isAI: false }, { name: 'AGGRO_UNIT_X', isAI: true, archetype: AIArchetype.AGGRO, difficulty: AIDifficulty.EASY }];
    else if (lvl === 3) configs = [{ name: 'PLAYER', isAI: false }, { name: 'VULCAN', isAI: true, archetype: AIArchetype.TURTLE, difficulty: AIDifficulty.NORMAL }, { name: 'STRIKE', isAI: true, archetype: AIArchetype.AGGRO, difficulty: AIDifficulty.NORMAL }];
    else if (lvl === 4) configs = [{ name: 'PLAYER', isAI: false }, { name: 'OBSIDIAN', isAI: true, archetype: AIArchetype.STRATEGIST, difficulty: AIDifficulty.NORMAL }, { name: 'DAGGER', isAI: true, archetype: AIArchetype.AGGRO, difficulty: AIDifficulty.NORMAL }];
    else if (lvl === 5) configs = [{ name: 'PLAYER', isAI: false }, { name: 'THE_ARCHITECT', isAI: true, archetype: AIArchetype.STRATEGIST, difficulty: AIDifficulty.HARD }];

    const newPlayers: Player[] = configs.map((cfg, idx) => ({
      id: `p${idx}`,
      name: cfg.name,
      unit: null,
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      ap: 4, 
      isEliminated: false,
      isAI: cfg.isAI,
      aiConfig: cfg.isAI ? { archetype: cfg.archetype, difficulty: cfg.difficulty } : undefined,
      apRefundNext: 0
    }));

    setPlayers(newPlayers);
    setSetupCount(newPlayers.length);
    setPhase(Phase.BLACKOUT_SELECTION);
    setCurrentTab(Tab.TERMINAL);
    setCurrentPlayerIdx(0);
  };

  const purchaseUnit = (type: UnitType) => {
    const cost = UNIT_PRICES[type].cost;
    if (credits >= cost && !unlockedUnits.includes(type)) {
      setCredits(prev => prev - cost);
      setUnlockedUnits(prev => [...prev, type]);
      playSfx('buy');
      return true;
    }
    playSfx('cancel');
    return false;
  };

  const calculateEarnings = (winners: Player[]) => {
    let earned = 0;
    const humanWinner = winners.find(p => !p.isAI);
    
    setStats(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      wins: humanWinner ? prev.wins + 1 : prev.wins,
      losses: humanWinner ? prev.losses : prev.losses + 1
    }));

    if (humanWinner) {
      earned += 50; // Victory
      if (humanWinner.hp === humanWinner.maxHp) {
        earned += 50; // Clean Slate
      }
      
      // Unlock progression
      if (currentCampaignLevel !== null && currentCampaignLevel === highestLevelReached && highestLevelReached < 5) {
        setHighestLevelReached(prev => prev + 1);
      }
    } else if (winners.length === 0) {
      earned = 10; // Mutual Failure/Draw consolation
    }
    
    setLastEarnedCredits(earned);
    setCredits(prev => prev + earned);
  };

  useEffect(() => {
    if (phase === Phase.PASS_PHONE || (phase === Phase.TURN_ENTRY && players[currentPlayerIdx]?.isAI)) {
      const activePlayer = players[currentPlayerIdx];
      if (activePlayer?.isAI && !isAIThinking) {
        setIsAIThinking(true);
        setTimeout(() => {
          const move = calculateAIMove(activePlayer, players, fullHistory, round);
          if (phase === Phase.PASS_PHONE) {
            setPhase(Phase.TURN_ENTRY);
            setTimeout(() => {
              submitAction(move);
              setIsAIThinking(false);
            }, 1000);
          } else {
            submitAction(move);
            setIsAIThinking(false);
          }
        }, 1200);
      }
    }
  }, [phase, currentPlayerIdx, players]);

  useEffect(() => {
    if (phase === Phase.TURN_ENTRY && !players[currentPlayerIdx]?.isAI) {
      setLocalBlockAp(0);
      setLocalAttackAp(0);
      setLocalTargetId(undefined);

      // Disable timer in campaign mode
      const isCampaign = currentCampaignLevel !== null;
      if (timeLimit > 0 && !isCampaign) {
        setTimeLeft(timeLimit);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          setTimeLeft(prev => {
            if (prev !== null && prev <= 1) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              autoPass();
              return 0;
            }
            return prev !== null ? prev - 1 : null;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setTimeLeft(null);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentPlayerIdx, timeLimit, currentCampaignLevel]);

  useEffect(() => {
    if (phase === Phase.RESOLUTION && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [resolutionLogs, phase]);

  const startGame = (selectedMode: GameMode) => {
    playSfx('confirm');
    setMode(selectedMode);
    setPhase(Phase.SETUP_PLAYERS);
  };

  const updatePlayerConfig = (idx: number, updates: Partial<typeof playerConfigs[0]>) => {
    const next = [...playerConfigs];
    next[idx] = { ...next[idx], ...updates };
    setPlayerConfigs(next);
  };

  const finalizePlayers = () => {
    if (editingNameIdx !== null) return;
    playSfx('success');
    const newPlayers: Player[] = playerConfigs.slice(0, setupCount).map((cfg, idx) => ({
      id: `p${idx}`,
      name: cfg.name.trim() || (cfg.isAI ? `CPU_${idx + 1}` : `AGENT_${idx + 1}`),
      unit: null,
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      ap: 4, 
      isEliminated: false,
      isAI: cfg.isAI,
      aiConfig: cfg.isAI ? { archetype: cfg.archetype, difficulty: cfg.difficulty } : undefined,
      apRefundNext: 0
    }));
    setPlayers(newPlayers);
    setPhase(Phase.BLACKOUT_SELECTION);
    setCurrentPlayerIdx(0);
  };

  const startEditName = (idx: number) => {
    setEditingNameIdx(idx);
    setTempName(playerConfigs[idx].name);
    playSfx('beep');
  };

  const saveEditName = () => {
    if (editingNameIdx === null) return;
    updatePlayerConfig(editingNameIdx, { name: tempName.trim().toUpperCase() });
    setEditingNameIdx(null);
    playSfx('confirm');
  };

  const cancelEditName = () => {
    setEditingNameIdx(null);
    playSfx('cancel');
  };

  const selectUnit = (unitType: UnitType) => {
    playSfx('success');
    setIsLockedIn(true);
    const currentIdx = currentPlayerIdx;
    const isLast = currentIdx >= players.length - 1;

    setTimeout(() => {
      setPlayers(prevPlayers => {
        const updated = [...prevPlayers];
        updated[currentIdx] = {
          ...updated[currentIdx],
          unit: UNITS[unitType],
          originalType: unitType
        };
        return updated;
      });

      setConfirmingUnit(null);
      setIsLockedIn(false);
      
      if (!isLast) {
        setCurrentPlayerIdx(currentIdx + 1);
      } else {
        setPhase(Phase.PASS_PHONE);
        setCurrentPlayerIdx(0);
      }
    }, 1200);
  };

  useEffect(() => {
    if (phase === Phase.BLACKOUT_SELECTION) {
      const activePlayer = players[currentPlayerIdx];
      if (activePlayer?.isAI && !isLockedIn) {
        const archetypesToUnits = {
          [AIArchetype.TURTLE]: UnitType.TITAN,
          [AIArchetype.AGGRO]: UnitType.REAPER,
          [AIArchetype.STRATEGIST]: UnitType.OVERLOAD
        };
        const preferred = archetypesToUnits[activePlayer.aiConfig!.archetype];
        setTimeout(() => selectUnit(preferred), 1500);
      }
    }
  }, [phase, currentPlayerIdx]);

  const submitAction = (action: Action) => {
    playSfx('success');
    const submission: TurnData = {
      playerId: players[currentPlayerIdx].id,
      action
    };
    const nextSubmissions = [...currentTurnSubmissions, submission];
    setCurrentTurnSubmissions(nextSubmissions);

    let nextIdx = currentPlayerIdx + 1;
    while (nextIdx < players.length && players[nextIdx].isEliminated) {
      nextIdx++;
    }
    if (nextIdx < players.length) {
      setCurrentPlayerIdx(nextIdx);
      setPhase(players[nextIdx].isAI ? Phase.TURN_ENTRY : Phase.PASS_PHONE);
    } else {
      resolveTurn(nextSubmissions);
    }
  };

  const resolveTurn = (submissions: TurnData[]) => {
    setFullHistory(prev => [...prev, submissions]);
    const logs: ResolutionLog[] = [];
    const nextPlayers = JSON.parse(JSON.stringify(players)) as Player[];
    
    let attackDamageMultiplier = 1;
    let attackCostMultiplier = 1;
    let abilitiesLocked = activeChaosEvent?.name === 'MIRAGE';
    let blockValuesScale = 1;

    if (activeChaosEvent) {
      if (activeChaosEvent.name === 'SOLAR FLARE') blockValuesScale = 0;
      if (activeChaosEvent.name === 'OVERCLOCK') attackDamageMultiplier = 2;
      if (activeChaosEvent.name === 'SHIELD WALL') {
        blockValuesScale = 2;
        attackCostMultiplier = 2;
      }
    }

    if (round === 1) {
       nextPlayers.forEach(p => {
        if (p.originalType === UnitType.MASK) {
          const types = Object.keys(UNITS).filter(t => t !== UnitType.MASK) as UnitType[];
          const newType = types[Math.floor(Math.random() * types.length)];
          p.unit = UNITS[newType];
          logs.push({ attackerId: p.id, type: ActionType.RESERVE, resultMessage: `${p.name} identity confirmed: ${p.unit?.name}.` });
        }
      });
    }

    // Spend AP first
    submissions.forEach(sub => {
      const p = nextPlayers.find(x => x.id === sub.playerId);
      if (p) {
        let totalCost = sub.action.blockAp + (sub.action.attackAp * attackCostMultiplier);
        p.ap = Math.max(0, p.ap - totalCost);
      }
    });

    // Take HP Snapshots before calculating damage (Simultaneous Resolution)
    const hpSnapshots = new Map(nextPlayers.map(p => [p.id, p.hp]));
    const totalIncomingDamage = new Map(nextPlayers.map(p => [p.id, 0]));
    const leechHeals = new Map(nextPlayers.map(p => [p.id, 0]));
    const reflectedDmg = new Map(nextPlayers.map(p => [p.id, 0]));

    // Calculate Shields/Invincibility (Defense Phase)
    const shields: Record<string, number> = {};
    const invincible: Record<string, boolean> = {};

    submissions.forEach(sub => {
      const p = nextPlayers.find(x => x.id === sub.playerId);
      if (!p) return;
      if (!abilitiesLocked && p.unit?.type === UnitType.GHOST && sub.action.blockAp === 3) {
        invincible[p.id] = true;
      } else if (sub.action.blockAp > 0) {
        let val = (p.unit?.type === UnitType.TITAN && !abilitiesLocked ? 5 : BASE_BLOCK_SHIELD);
        shields[p.id] = (val * sub.action.blockAp) * blockValuesScale;
      }
    });

    // Resolution Phase: Calculate all strikes based on snapshots
    submissions.forEach(sub => {
      const attacker = nextPlayers.find(x => x.id === sub.playerId);
      if (!attacker || (sub.action.attackAp === 0)) return;

      const target = nextPlayers.find(x => x.id === sub.action.targetId);
      if (!target) return;

      const targetSub = submissions.find(s => s.playerId === target.id);
      
      let baseDmg = (BASE_ATTACK_DMG * sub.action.attackAp) * attackDamageMultiplier;
      const snapshotHp = hpSnapshots.get(target.id) || 0;
      
      if (!abilitiesLocked && attacker.unit?.type === UnitType.REAPER && snapshotHp < 15) baseDmg += 3;
      if (!abilitiesLocked && attacker.unit?.type === UnitType.GAMBLER) {
         const attackerSnapshotHp = hpSnapshots.get(attacker.id) || INITIAL_HP;
         baseDmg += Math.floor((INITIAL_HP - attackerSnapshotHp) / 5);
      }

      const targetShield = shields[target.id] || 0;
      let blocked = invincible[target.id] ? baseDmg : Math.min(baseDmg, targetShield);
      let finalDmg = Math.max(0, baseDmg - blocked);

      // Accumulate damage for simultaneous application
      totalIncomingDamage.set(target.id, (totalIncomingDamage.get(target.id) || 0) + finalDmg);

      // Leech Logic
      if (!abilitiesLocked && attacker.unit?.type === UnitType.LEECH && targetSub?.action.attackAp === 0 && targetSub?.action.blockAp === 0) {
        const heal = 3 * sub.action.attackAp; 
        leechHeals.set(attacker.id, (leechHeals.get(attacker.id) || 0) + heal);
      }

      // Reflect Logic
      if (!abilitiesLocked && target.unit?.type === UnitType.TITAN && (shields[target.id] > 0)) {
        const reflect = 2 * sub.action.attackAp;
        reflectedDmg.set(attacker.id, (reflectedDmg.get(attacker.id) || 0) + reflect);
      }

      logs.push({ 
        attackerId: attacker.id, targetId: target.id, type: ActionType.ATTACK, 
        damage: finalDmg, blocked: blocked,
        resultMessage: `${attacker.name} targeted ${target.name} for ${baseDmg} damage. ${blocked} mitigated by defense.` 
      });
    });

    // Apply all calculated HP changes at once
    nextPlayers.forEach(p => {
      const dmg = totalIncomingDamage.get(p.id) || 0;
      const reflect = reflectedDmg.get(p.id) || 0;
      const heal = leechHeals.get(p.id) || 0;
      
      const sub = submissions.find(s => s.playerId === p.id);
      
      if (sub) {
        if (invincible[p.id]) {
          logs.push({ attackerId: p.id, type: ActionType.PHASE, resultMessage: `${p.name} synchronized with Ghost Phase. Tactical immunity achieved.` });
        } else if (sub.action.blockAp > 0) {
          logs.push({ attackerId: p.id, type: ActionType.BLOCK, shield: shields[p.id], resultMessage: `${p.name} initialized ${sub.action.blockAp} AP Shield Protocol (+${shields[p.id]} HP Mitigation).` });
        } else if (sub.action.blockAp === 0 && sub.action.attackAp === 0) {
          logs.push({ attackerId: p.id, type: ActionType.RESERVE, resultMessage: `${p.name} bypassed aggressive protocols to reserve operational energy.` });
        }
      }

      if (reflect > 0) {
        logs.push({ attackerId: p.id, type: ActionType.BLOCK, reflected: reflect, resultMessage: `Backlash impact! ${p.name} hit by ${reflect} reflected damage.` });
      }
      if (heal > 0) {
        logs.push({ attackerId: p.id, type: ActionType.PHASE, resultMessage: `${p.name} established health drain (+${heal} HP).` });
      }

      p.hp = Math.max(0, Math.min(INITIAL_HP, p.hp - dmg - reflect + heal));
    });

    // Mutual Destruction Detection
    const aliveBefore = nextPlayers.filter(p => !p.isEliminated);
    const aliveAfter = nextPlayers.filter(p => p.hp > 0);

    if (aliveBefore.length >= 2 && aliveAfter.length === 0) {
      logs.push({ 
        attackerId: 'SYSTEM', type: ActionType.RESERVE, 
        resultMessage: "CRITICAL: MUTUAL DESTRUCTION DETECTED. REBOOTING SURVIVORS. INITIATING SUDDEN DEATH PROTOCOL." 
      });
      // Revive for Sudden Death
      aliveBefore.forEach(p => {
        const actualPlayer = nextPlayers.find(x => x.id === p.id);
        if (actualPlayer) {
          actualPlayer.hp = 10;
          actualPlayer.ap = 0; 
          actualPlayer.isEliminated = false;
        }
      });
    } else {
      // Finalize status
      nextPlayers.forEach(p => {
        if (p.hp <= 0 && !p.isEliminated) {
          p.isEliminated = true;
          p.hp = 0;
          // Mark the killing log as an elimination
          const killLog = logs.find(l => l.targetId === p.id && l.type === ActionType.ATTACK);
          if (killLog) killLog.isElimination = true;
        }
        if (!p.isEliminated) {
          const isOverload = p.unit?.type === UnitType.OVERLOAD && !abilitiesLocked;
          p.ap = Math.min(isOverload ? 12 : 10, p.ap + (isOverload ? 3 : 2) + (p.apRefundNext || 0));
          p.apRefundNext = 0;
        }
      });
    }

    setPlayers(nextPlayers);
    setResolutionLogs(logs);
    setPhase(Phase.RESOLUTION);
    setRound(round + 1);
    
    const finalAlive = nextPlayers.filter(p => !p.isEliminated);
    if (finalAlive.length <= 1) {
      calculateEarnings(finalAlive);
    }
  };

  const nextTurn = () => {
    if (players.filter(p => !p.isEliminated).length <= 1) setPhase(Phase.GAME_OVER);
    else {
      setCurrentTurnSubmissions([]);
      const firstAliveIdx = players.findIndex(p => !p.isEliminated);
      const targetIdx = firstAliveIdx !== -1 ? firstAliveIdx : 0;
      setCurrentPlayerIdx(targetIdx);
      setPhase(players[targetIdx].isAI ? Phase.TURN_ENTRY : Phase.PASS_PHONE);
    }
  };

  return {
    phase, setPhase, mode, setMode, players, setPlayers, currentPlayerIdx, setCurrentPlayerIdx,
    currentTab, setCurrentTab,
    round, setRound, currentTurnSubmissions, setCurrentTurnSubmissions,
    resolutionLogs, setResolutionLogs, activeChaosEvent, setActiveChaosEvent,
    fogOfWarActive, setFogOfWarActive, setupCount, setSetupCount, playerConfigs, setPlayerConfigs,
    updatePlayerConfig, timeLimit, setTimeLimit, confirmingUnit, setConfirmingUnit,
    isLockedIn, setIsLockedIn, isExitConfirming, setIsExitConfirming,
    isHelpOpen, setIsHelpOpen, isSettingsOpen, setIsSettingsOpen, isAIThinking,
    localBlockAp, setLocalBlockAp, localAttackAp, setLocalAttackAp, localTargetId, setLocalTargetId,
    timeLeft, setTimeLeft, sfxEnabled, setSfxEnabled, bgmEnabled, setBgmEnabled, bgmVolume, setBgmVolume, visualLevel, setVisualLevel,
    editingNameIdx, tempName, setTempName, startEditName, saveEditName, cancelEditName,
    credits, unlockedUnits, lastEarnedCredits, purchaseUnit, usePromoCode, highestLevelReached, currentCampaignLevel,
    stats,
    resetToMain, startGame, startCampaignLevel, finalizePlayers, selectUnit, submitAction,
    resolveTurn, nextTurn, autoPass, playSfx, scrollRef
  };
}
