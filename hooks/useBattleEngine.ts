
import { useState, useCallback, useEffect } from 'react';
import { Player, TurnData, ResolutionLog, Phase, GameMode, Action, DifficultyLevel, HazardType, Unit, UnitType } from '../types';
import { INITIAL_HP } from '../constants';
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
  const [distanceMatrix, setDistanceMatrix] = useState<Map<string, number>>(new Map());
  const [victoryReason, setVictoryReason] = useState<string | null>(null);
  const [activeChaosEvent, setActiveChaosEvent] = useState<{name: string, description: string} | null>(null);
  const [fogOfWarActive, setFogOfWarActive] = useState(0);
  const [phaseTransition, setPhaseTransition] = useState<string | null>(null);

  // Auto-advance AI during PASS_PHONE phase
  useEffect(() => {
    if (phase === Phase.PASS_PHONE) {
      const activePlayer = players[currentPlayerIdx];
      if (activePlayer?.isAI) {
        const timer = setTimeout(() => {
          setPhase(Phase.TURN_ENTRY);
        }, 800); // Small delay to let the "Processing Logic" UI be seen briefly
        return () => clearTimeout(timer);
      }
    }
  }, [phase, players, currentPlayerIdx]);

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
    const result = resolveCombat(players, submissions, round, maxRounds, mode, activeChaosEvent, distanceMatrix, difficulty, hazard);
    
    setPlayers(result.nextPlayers);
    setResolutionLogs(result.logs);
    setDistanceMatrix(result.nextDistanceMatrix);
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
    setDistanceMatrix(new Map());
    setVictoryReason(null);
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
    distanceMatrix, setDistanceMatrix,
    victoryReason, setVictoryReason,
    activeChaosEvent, setActiveChaosEvent,
    fogOfWarActive, setFogOfWarActive,
    phaseTransition, setPhaseTransition,
    initDistances,
    selectUnit,
    submitTurnAction,
    executeResolution,
    nextTurn,
    resetBattle
  };
}
