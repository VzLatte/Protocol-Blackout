
import { Player, Action, AIArchetype, AIDifficulty, TurnData, DifficultyLevel } from './types';

const MISTAKE_RATES = {
  [AIDifficulty.EASY]: 0.20,
  [AIDifficulty.NORMAL]: 0.10,
  [AIDifficulty.HARD]: 0.05,
};

export function calculateAIMove(
  aiPlayer: Player, 
  allPlayers: Player[], 
  history: TurnData[][], 
  round: number,
  chapter: number = 1,
  difficulty: DifficultyLevel = DifficultyLevel.NORMAL,
  playerIntents: TurnData[] = []
): Action {
  const config = aiPlayer.aiConfig!;
  const availableAp = aiPlayer.ap;
  const opponents = allPlayers.filter(p => p.id !== aiPlayer.id && !p.isEliminated);
  const player = opponents.find(p => !p.isAI);

  // Blackout Modifier: Cheating (Reads your inputs)
  if (difficulty === DifficultyLevel.BLACKOUT && playerIntents.length > 0 && player) {
    const playerAction = playerIntents.find(i => i.playerId === player.id)?.action;
    if (playerAction) {
      // If player is attacking, prioritize defense
      if (playerAction.attackAp > 1) {
        return { blockAp: Math.min(availableAp, 3), attackAp: Math.max(0, availableAp - 3), moveAp: 0, abilityActive: false, targetId: player.id };
      }
      // If player is blocking, prioritize reservation or light attacks
      if (playerAction.blockAp > 1) {
        return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false };
      }
    }
  }

  // // Fix: Ensure mistake logic only triggers on NORMAL difficulty. 
  // // Higher difficulties (Overclock, Blackout) use perfect logic (0 mistakes).
  if (difficulty === DifficultyLevel.NORMAL && Math.random() < MISTAKE_RATES[config.difficulty]) {
    return generateRandomValidMove(availableAp, opponents);
  }

  // Chapter Shifts
  // Early Chapter (Reactive)
  if (chapter === 1) {
    if (availableAp > 4) {
      return calculateAggroMove(aiPlayer, opponents, availableAp);
    } else {
      return { blockAp: Math.min(availableAp, 2), attackAp: 0, moveAp: 0, abilityActive: false };
    }
  }

  // Mid Chapter (Proactive)
  if (chapter === 2) {
    const cycle = round % 3;
    if (cycle === 0) { // Turn 3: Burst
      return calculateAggroMove(aiPlayer, opponents, availableAp);
    } else { // Turn 1-2: Reserve
      return { blockAp: 1, attackAp: 0, moveAp: 0, abilityActive: false };
    }
  }

  // Late Chapter (Predictive)
  if (chapter === 3 && player) {
    if (player.hp < 200) {
      // Ignore defense, go all-in
      return { blockAp: 0, attackAp: availableAp, moveAp: 0, abilityActive: true, targetId: player.id };
    }
  }

  // Fallback to standard archetypes
  switch (config.archetype) {
    case AIArchetype.TURTLE:
      return calculateTurtleMove(aiPlayer, opponents, availableAp);
    case AIArchetype.AGGRO:
      return calculateAggroMove(aiPlayer, opponents, availableAp);
    case AIArchetype.STRATEGIST:
      return calculateStrategistMove(aiPlayer, opponents, availableAp, history);
    default:
      return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false };
  }
}

function generateRandomValidMove(ap: number, opponents: Player[]): Action {
  const block = Math.floor(Math.random() * (ap + 1));
  const remaining = ap - block;
  const attack = Math.floor(Math.random() * (remaining + 1));
  const target = opponents[Math.floor(Math.random() * opponents.length)]?.id;
  return { blockAp: block, attackAp: attack, moveAp: 0, targetId: attack > 0 ? target : undefined, abilityActive: false };
}

function calculateTurtleMove(ai: Player, opponents: Player[], ap: number): Action {
  let blockAp = Math.min(ap, 2);
  if (ai.hp < 300) blockAp = Math.min(ap, 3);
  let attackAp = 0;
  let targetId: string | undefined = undefined;
  if (ai.hp > 500 && ap - blockAp >= 2) {
    attackAp = 1;
    targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  }
  return { blockAp, attackAp, moveAp: 0, targetId, abilityActive: false };
}

function calculateAggroMove(ai: Player, opponents: Player[], ap: number): Action {
  const targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  return { blockAp: 0, attackAp: Math.floor(ap / 2), moveAp: 0, targetId, abilityActive: false };
}

function calculateStrategistMove(ai: Player, opponents: Player[], ap: number, history: TurnData[][]): Action {
  if (history.length < 2) return calculateTurtleMove(ai, opponents, ap);
  const targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  return { blockAp: 1, attackAp: Math.max(0, ap - 1), moveAp: 0, targetId, abilityActive: false };
}
