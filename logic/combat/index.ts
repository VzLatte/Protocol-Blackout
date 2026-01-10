
import { Player, TurnData, ResolutionLog, GameMode, DifficultyLevel, HazardType, GridMap } from '../../types';
import { resolveDesperation } from './phases/desperationPhase';
import { resolvePreparation } from './phases/preparationPhase';
import { resolveMovement } from './phases/movementPhase';
import { resolveAttacks } from './phases/attackPhase';
import { resolveAftermath } from './phases/aftermathPhase';

interface CombatResult {
  nextPlayers: Player[];
  logs: ResolutionLog[];
  nextRound: number;
  nextMap: GridMap;
}

// Optimized cloning
function clonePlayer(p: Player): Player {
  return {
    ...p,
    position: { ...p.position },
    statuses: p.statuses.map(s => ({ ...s })),
    itemUses: { ...p.itemUses },
  };
}

export function resolveCombat(
  currentPlayers: Player[],
  submissions: TurnData[],
  currentRound: number,
  maxRounds: number,
  mode: GameMode,
  activeChaosEvent: any,
  distanceMatrix: Map<string, number>, 
  difficulty: DifficultyLevel = DifficultyLevel.NORMAL,
  hazard: HazardType = HazardType.NONE,
  gridMap: GridMap
): CombatResult {
  const nextPlayers = currentPlayers.map(clonePlayer);
  
  // DEEP CLONE MAP to prevent mutation of the React state before commit
  const nextMap: GridMap = JSON.parse(JSON.stringify(gridMap));
  
  const logs: ResolutionLog[] = [];

  // PHASE 0: Interrupts
  resolveDesperation(nextPlayers, submissions, logs);

  // PHASE 1: Prep & Status
  resolvePreparation(nextPlayers, submissions, logs, hazard);

  // PHASE 2: Movement
  resolveMovement(nextPlayers, submissions, logs);

  // PHASE 3: Combat
  resolveAttacks(nextPlayers, submissions, logs, nextMap, difficulty);

  // PHASE 4: Aftermath
  resolveAftermath(nextPlayers, submissions, logs, nextMap, currentRound, hazard, difficulty);

  return { nextPlayers, logs, nextRound: currentRound + 1, nextMap };
}
