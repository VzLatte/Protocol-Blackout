
import { useState, useCallback, useEffect } from 'react';
import { Player, TurnData, ResolutionLog, Phase, GameMode, Action, DifficultyLevel, HazardType, Unit, UnitType, GridMap } from '../types';
import { INITIAL_HP, MAPS } from '../constants';
import { resolveCombat } from '../combatEngine';
import { UNITS } from '../operativeRegistry';

export function useBattleEngine() {
  const [phase, setPhase] = useState<Phase>(Phase.SPLASH);
  const [mode, setMode] = useState<GameMode>(GameMode.TACTICAL);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(10);
  const [currentTurnSubmissions, setCurrentTurnSubmissions] = useState<TurnData[]>([]);
  const [fullHistory, setFullHistory] = useState<TurnData[][]>([]);
  const [resolutionLogs, setResolutionLogs] = useState<ResolutionLog[]>([]);
  const [victoryReason, setVictoryReason] = useState<string | null>(null);
  const [activeChaosEvent, setActiveChaosEvent] = useState<{name: string, description: string} | null>(null);
  const [fogOfWarActive, setFogOfWarActive] = useState(0);
  const [phaseTransition, setPhaseTransition] = useState<string | null>(null);
  const [activeMap, setActiveMap] = useState<GridMap>(MAPS[1]);

  // Auto-advance AI during PASS_PHONE phase
  useEffect(() => {
    if (phase === Phase.PASS_PHONE) {
      const activePlayer = players[currentPlayerIdx];
      if (activePlayer?.isAI) {
        const timer = setTimeout(() => {
          setPhase(Phase.TURN_ENTRY);
        }, 800); 
        return () => clearTimeout(timer);
      }
    }
  }, [phase, players, currentPlayerIdx]);

  const initDistances = (pList: Player[]) => {
    // Legacy support: Initialize positions if missing
    pList.forEach((p, idx) => {
        if (!p.position) {
            p.position = idx === 0 ? { x: 0, y: 3 } : { x: 6, y: 3 };
        }
    });
  };

  const selectUnit = (type: UnitType) => {
    const nextPlayers = [...players];
    const u = UNITS[type];
    if (!nextPlayers[currentPlayerIdx]) return;
    
    nextPlayers[currentPlayerIdx] = {
      ...nextPlayers[currentPlayerIdx],
      unit: u,
      hp: u.hp,
      maxHp: u.maxHp
    };
    
    setPlayers(nextPlayers);
    
    let nextIdx = currentPlayerIdx + 1;
    while (nextIdx < nextPlayers.length && nextPlayers[nextIdx].isEliminated) nextIdx++;
    
    if (nextIdx < nextPlayers.length) {
      setCurrentPlayerIdx(nextIdx);
    } else { 
      setCurrentPlayerIdx(0); 
      setPhase(Phase.PASS_PHONE); 
    }
  };

  const submitTurnAction = (action: Action, onTurnComplete: (subs: TurnData[]) => void) => {
    const submission: TurnData = { playerId: players[currentPlayerIdx].id, action };
    const nextSubmissions = [...currentTurnSubmissions, submission];
    setCurrentTurnSubmissions(nextSubmissions);
    
    let nextIdx = currentPlayerIdx + 1;
    while (nextIdx < players.length && players[nextIdx].isEliminated) nextIdx++;
    
    if (nextIdx < players.length) {
      setCurrentPlayerIdx(nextIdx);
      setPhase(Phase.PASS_PHONE);
    } else {
      onTurnComplete(nextSubmissions);
    }
  };

  const executeResolution = (
    submissions: TurnData[], 
    difficulty: DifficultyLevel, 
    hazard: HazardType,
    levelId: string | null
  ) => {
    // Pass activeMap to resolution engine
    const result = resolveCombat(players, submissions, round, maxRounds, mode, activeChaosEvent, new Map(), difficulty, hazard, activeMap);
    
    setPlayers(result.nextPlayers);
    setResolutionLogs(result.logs);
    setFullHistory(prev => [...prev, submissions]);
    setPhase(Phase.RESOLUTION);
    setRound(result.nextRound);
    
    return result.nextPlayers;
  };

  const nextTurn = () => {
    setCurrentTurnSubmissions([]);
    setResolutionLogs([]);
    setCurrentPlayerIdx(0);
    
    const alivePlayers = players.filter(p => !p.isEliminated);
    const isGameOver = alivePlayers.length <= 1 || round > maxRounds || victoryReason !== null;
    
    if (isGameOver) setPhase(Phase.GAME_OVER);
    else setPhase(Phase.PASS_PHONE);
  };

  const resetBattle = () => {
    setPlayers([]);
    setRound(1);
    setCurrentTurnSubmissions([]);
    setResolutionLogs([]);
    setFullHistory([]);
    setActiveChaosEvent(null);
    setFogOfWarActive(0);
    setVictoryReason(null);
    setActiveMap(MAPS[1]); // Reset to default map
  };

  return {
    phase, setPhase,
    mode, setMode,
    players, setPlayers,
    currentPlayerIdx, setCurrentPlayerIdx,
    round, setRound,
    maxRounds, setMaxRounds,
    currentTurnSubmissions, setCurrentTurnSubmissions,
    fullHistory, setFullHistory,
    resolutionLogs, setResolutionLogs,
    victoryReason, setVictoryReason,
    activeChaosEvent, setActiveChaosEvent,
    fogOfWarActive, setFogOfWarActive,
    phaseTransition, setPhaseTransition,
    activeMap, setActiveMap, // Export map state
    initDistances,
    selectUnit,
    submitTurnAction,
    executeResolution,
    nextTurn,
    resetBattle
  };
}
