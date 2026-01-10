
import { useState, useEffect, useRef, useMemo } from 'react';
import { Phase, Action, TurnData, DifficultyLevel, UnitType, TileType, WinCondition } from '../types';
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

  const levelData = currentCampaignLevelId ? CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevelId) : null;

  // Memoize Threshold Position scan based on Map ID (assumes map structure is constant per ID)
  const thresholdPos = useMemo(() => {
    let pos = undefined;
    if (battle.activeMap) {
        // Find a representative threshold tile (e.g., center of the zone)
        // Since aiLogic now checks all Threshold tiles, getting one is enough to guide distance heuristic
        battle.activeMap.tiles.forEach((row: any[], y: number) => {
            row.forEach((tile: TileType, x: number) => {
                if (tile === TileType.THRESHOLD && !pos) {
                    pos = { x, y };
                }
            });
        });
    }
    return pos;
  }, [battle.activeMap.id]);

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
        // PRIORITY 1: Campaign Defined Unit
        // Use the unit defined in the level registry to ensure narrative consistency
        if (levelData?.enemyUnit) {
           battle.selectUnit(levelData.enemyUnit);
           return;
        }

        // PRIORITY 2: Pre-assigned Unit (from setup)
        if (activePlayer?.unit) {
           battle.selectUnit(activePlayer.unit.type);
           return;
        }

        // FALLBACK: Random Selection (Custom Games)
        const units = [UnitType.PYRUS, UnitType.AEGIS, UnitType.GHOST, UnitType.REAPER, UnitType.HUNTER, UnitType.MEDIC];
        const randomUnit = units[Math.floor(Math.random() * units.length)];
        battle.selectUnit(randomUnit);
        
      }, 800);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [isAiSelection, activePlayer, battle.selectUnit, levelData]);

  // Effect: Handle Turn Action for AI
  useEffect(() => {
    if (!isAiTurn) {
      return;
    }

    setIsAIThinking(true);
    
    // Calculate thinking time
    const baseDelay = Math.min(1500, (currentChapter * 400));
    const thinkingTime = Math.max(800, baseDelay + Math.random() * 600);

    timerRef.current = setTimeout(() => {
      try {
        let aiMove: Action;
        
        // Prepare Context Object
        const aiContext = {
            difficulty: campaignDifficulty,
            winCondition: levelData?.winCondition || WinCondition.ELIMINATION,
            thresholdPos: thresholdPos
        };

        // Handle "Blackout" difficulty cheating or normal calc
        if (campaignDifficulty === DifficultyLevel.BLACKOUT) {
          aiMove = calculateAIMove(
            activePlayer, 
            battle.players, 
            battle.fullHistory, 
            battle.round, 
            aiContext,
            battle.activeMap,
            battle.currentTurnSubmissions
          );
        } else {
          aiMove = calculateAIMove(
            activePlayer, 
            battle.players, 
            battle.fullHistory, 
            battle.round, 
            aiContext,
            battle.activeMap
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
    battle.phase,
    thresholdPos // Added memoized dependency
  ]);

  return { isAIThinking };
}
