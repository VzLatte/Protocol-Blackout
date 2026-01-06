
import { useState, useCallback, useRef, useEffect } from 'react';
import { Player, TurnData, ResolutionLog, Phase, Action, DifficultyLevel } from '../types';
import { resolveCombat } from '../combatEngine';
import { calculateAIMove } from '../aiLogic';
import { CAMPAIGN_LEVELS } from '../campaignRegistry';

export function useBattleEngine(
  phase: Phase, 
  setPhase: (p: Phase) => void,
  campaignDifficulty: DifficultyLevel,
  currentChapter: number,
  currentCampaignLevelId: string | null
) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(10);
  const [currentTurnSubmissions, setCurrentTurnSubmissions] = useState<TurnData[]>([]);
  const [fullHistory, setFullHistory] = useState<TurnData[][]>([]);
  const [resolutionLogs, setResolutionLogs] = useState<ResolutionLog[]>([]);
  const [distanceMatrix, setDistanceMatrix] = useState<Map<string, number>>(new Map());
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [victoryReason, setVictoryReason] = useState<string | null>(null);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBattleState = useCallback(() => {
    setPlayers([]);
    setCurrentPlayerIdx(0);
    setRound(1);
    setCurrentTurnSubmissions([]);
    setFullHistory([]);
    setResolutionLogs([]);
    setDistanceMatrix(new Map());
    setVictoryReason(null);
    setIsAIThinking(false);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }, []);

  const resolveTurn = useCallback((submissions: TurnData[]) => {
    const currentLvl = CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevelId);
    const hazard = currentLvl?.hazard || 'NONE' as any;

    const finalSubmissions = submissions.map(sub => {
      const p = players.find(x => x.id === sub.playerId);
      if (p?.isAI && campaignDifficulty === DifficultyLevel.BLACKOUT) {
        return { 
          ...sub, 
          action: calculateAIMove(p, players, fullHistory, round, currentChapter, campaignDifficulty, submissions) 
        };
      }
      return sub;
    });

    setFullHistory(prev => [...prev, finalSubmissions]);
    
    const result = resolveCombat(
      players, 
      finalSubmissions, 
      round, 
      maxRounds, 
      'TACTICAL' as any, 
      null, 
      distanceMatrix, 
      campaignDifficulty, 
      hazard
    );

    setPlayers(result.nextPlayers);
    setResolutionLogs(result.logs);
    setDistanceMatrix(result.nextDistanceMatrix);
    setRound(result.nextRound);
    setPhase(Phase.RESOLUTION);

    // End Game Detection
    const alivePlayers = result.nextPlayers.filter(p => !p.isEliminated);
    const humanAlive = result.nextPlayers.some(p => !p.isAI && !p.isEliminated);
    const aiAlive = result.nextPlayers.some(p => p.isAI && !p.isEliminated);

    if (currentCampaignLevelId) {
      if (!aiAlive && humanAlive) setVictoryReason("OPERATIONAL_SUCCESS");
      else if (!humanAlive) setVictoryReason("DATA_CORRUPTION_DETECTED");
    } else {
      if (alivePlayers.length <= 1 || result.nextRound > maxRounds) {
        setVictoryReason(alivePlayers.length === 1 ? "SECTOR_SECURED" : "DRAW");
      }
    }
  }, [players, round, maxRounds, distanceMatrix, campaignDifficulty, currentChapter, currentCampaignLevelId, fullHistory, setPhase]);

  const submitAction = useCallback((action: Action) => {
    const submission: TurnData = { playerId: players[currentPlayerIdx].id, action };
    const nextSubmissions = [...currentTurnSubmissions, submission];
    setCurrentTurnSubmissions(nextSubmissions);

    let nextIdx = currentPlayerIdx + 1;
    while (nextIdx < players.length && players[nextIdx].isEliminated) nextIdx++;

    if (nextIdx < players.length) {
      setCurrentPlayerIdx(nextIdx);
      setPhase(Phase.PASS_PHONE);
    } else {
      resolveTurn(nextSubmissions);
    }
  }, [players, currentPlayerIdx, currentTurnSubmissions, setPhase, resolveTurn]);

  // AI Thinking Lifecycle
  useEffect(() => {
    // Only proceed if it is AI turn in TURN_ENTRY phase
    if (phase !== Phase.TURN_ENTRY || !players[currentPlayerIdx]?.isAI) {
      if (isAIThinking) setIsAIThinking(false);
      return;
    }

    // If we are already thinking, do not restart the timer. 
    // This assumes that phase/playerIdx/players dependencies don't change while thinking.
    // If they do change (e.g. unexpected re-render), this guard prevents loop.
    if (isAIThinking) return;

    setIsAIThinking(true);
    
    const currentLevel = currentCampaignLevelId ? CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevelId) : null;
    const sequence = currentLevel?.sequence || 1;
    const baseDelay = (currentChapter * 400); // Reduced slightly for better UX
    const seqDelay = (sequence * 100);
    const thinkingTime = Math.max(800, baseDelay + seqDelay + Math.random() * 500);

    aiTimerRef.current = setTimeout(() => {
      // Capture latest state via closure is tricky if state updated, 
      // but for AI logic which relies on 'players' snapshot at start of turn, it's usually acceptable.
      // Ideally we would use a ref for players if we expected mid-turn updates.
      const move = calculateAIMove(players[currentPlayerIdx], players, fullHistory, round, currentChapter, campaignDifficulty);
      
      setIsAIThinking(false);
      submitAction(move);
    }, thinkingTime);

    return () => {
      // Cleanup on unmount or dependency change
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      // We do NOT set isAIThinking(false) here to avoid the infinite loop trap 
      // where cleanup triggers a re-render that restarts the effect.
    };
  }, [phase, currentPlayerIdx, players, campaignDifficulty, currentChapter, currentCampaignLevelId, round, fullHistory, submitAction]); 
  // removed isAIThinking from dependency array to break the loop

  return {
    players, setPlayers,
    currentPlayerIdx, setCurrentPlayerIdx,
    round, setRound,
    maxRounds, setMaxRounds,
    resolutionLogs,
    distanceMatrix, setDistanceMatrix,
    isAIThinking,
    victoryReason,
    submitAction,
    clearBattleState,
    setCurrentTurnSubmissions
  };
}
