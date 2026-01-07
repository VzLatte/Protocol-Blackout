
import { useState, useEffect, useRef } from 'react';
import { Phase, Action, TurnData, DifficultyLevel, UnitType } from '../types';
import { calculateAIMove } from '../aiLogic';
import { CAMPAIGN_LEVELS } from '../campaignRegistry';

export function useAIController(
  battle: any,
  campaignDifficulty: DifficultyLevel,
  currentChapter: number,
  currentCampaignLevelId: string | null,
  submitAction: (action: Action) => void
) {
  const [isAIThinking, setIsAIThinking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Use a ref for the submit callback to avoid resetting the effect when the parent component re-renders
  const submitActionRef = useRef(submitAction);
  useEffect(() => {
    submitActionRef.current = submitAction;
  });

  const activePlayer = battle.players[battle.currentPlayerIdx];
  const isAiTurn = battle.phase === Phase.TURN_ENTRY && activePlayer?.isAI;
  const isAiSelection = battle.phase === Phase.BLACKOUT_SELECTION && activePlayer?.isAI;

  // Safety: If phase changes away from AI turn, force thinking to false immediately
  useEffect(() => {
    if (!isAiTurn && isAIThinking) {
      setIsAIThinking(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isAiTurn, isAIThinking]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Effect: Handle Unit Selection for AI
  useEffect(() => {
    if (isAiSelection) {
      timerRef.current = setTimeout(() => {
        // Simple random selection if AI hasn't selected yet
        if (!activePlayer.unit) {
          const units = [UnitType.GHOST, UnitType.AEGIS, UnitType.REAPER, UnitType.PYRUS, UnitType.TROJAN, UnitType.KILLSHOT];
          const randomUnit = units[Math.floor(Math.random() * units.length)];
          battle.selectUnit(randomUnit);
        } else {
           // If already has unit (e.g. from campaign setup), just proceed
           battle.selectUnit(activePlayer.unit.type);
        }
      }, 800);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [isAiSelection, activePlayer, battle.selectUnit]);

  // Effect: Handle Turn Action for AI
  useEffect(() => {
    if (!isAiTurn) {
      return;
    }

    setIsAIThinking(true);
    
    // Calculate thinking time
    const currentLevel = currentCampaignLevelId ? CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevelId) : null;
    const baseDelay = Math.min(1500, (currentChapter * 400));
    const thinkingTime = Math.max(800, baseDelay + Math.random() * 600);

    timerRef.current = setTimeout(() => {
      try {
        let aiMove: Action;
        
        // Handle "Blackout" difficulty cheating or normal calc
        if (campaignDifficulty === DifficultyLevel.BLACKOUT) {
          aiMove = calculateAIMove(
            activePlayer, 
            battle.players, 
            battle.fullHistory, 
            battle.round, 
            currentChapter, 
            campaignDifficulty,
            battle.currentTurnSubmissions
          );
        } else {
          aiMove = calculateAIMove(
            activePlayer, 
            battle.players, 
            battle.fullHistory, 
            battle.round, 
            currentChapter, 
            campaignDifficulty
          );
        }

        // Execute via the ref to ensure we use the latest closure from useGameState
        setIsAIThinking(false);
        submitActionRef.current(aiMove);

      } catch (e) {
        console.error("AI Logic Error:", e);
        // Safety Fallback: Just reserve AP
        setIsAIThinking(false);
        submitActionRef.current({ blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false });
      }
    }, thinkingTime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    isAiTurn, 
    // Do NOT add activePlayer or battle.players here to prevent timer resets on minor state updates. 
    battle.currentPlayerIdx,
    battle.phase
  ]);

  return { isAIThinking };
}
