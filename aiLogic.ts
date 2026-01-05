
import { Player, Action, AIArchetype, AIDifficulty, TurnData, ActionType } from './types';

const MISTAKE_RATES = {
  [AIDifficulty.EASY]: 0.20,
  [AIDifficulty.NORMAL]: 0.10,
  [AIDifficulty.HARD]: 0.05,
};

export function calculateAIMove(
  aiPlayer: Player, 
  allPlayers: Player[], 
  history: TurnData[][], 
  round: number
): Action {
  const config = aiPlayer.aiConfig!;
  const availableAp = aiPlayer.ap;
  const opponents = allPlayers.filter(p => p.id !== aiPlayer.id && !p.isEliminated);
  
  if (Math.random() < MISTAKE_RATES[config.difficulty]) {
    return generateRandomValidMove(availableAp, opponents);
  }

  switch (config.archetype) {
    case AIArchetype.TURTLE:
      return calculateTurtleMove(aiPlayer, opponents, availableAp);
    case AIArchetype.AGGRO:
      return calculateAggroMove(aiPlayer, opponents, availableAp);
    case AIArchetype.STRATEGIST:
      return calculateStrategistMove(aiPlayer, opponents, availableAp, history);
    default:
      // Fixed: Added abilityActive: false
      return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false };
  }
}

function generateRandomValidMove(ap: number, opponents: Player[]): Action {
  const block = Math.floor(Math.random() * (ap + 1));
  const remaining = ap - block;
  const attack = Math.floor(Math.random() * (remaining + 1));
  const target = opponents[Math.floor(Math.random() * opponents.length)]?.id;
  // Fixed: Added abilityActive: false
  return { blockAp: block, attackAp: attack, moveAp: 0, targetId: attack > 0 ? target : undefined, abilityActive: false };
}

function calculateTurtleMove(ai: Player, opponents: Player[], ap: number): Action {
  let blockAp = Math.min(ap, 2);
  if (ai.hp < 15) blockAp = Math.min(ap, 3);
  let attackAp = 0;
  let targetId: string | undefined = undefined;
  if (ai.hp > 25 && ap - blockAp >= 2) {
    attackAp = 1;
    targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  }
  // Fixed: Added abilityActive: false
  return { blockAp, attackAp, moveAp: 0, targetId, abilityActive: false };
}

function calculateAggroMove(ai: Player, opponents: Player[], ap: number): Action {
  const targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  // Fixed: Added abilityActive: false
  return { blockAp: 0, attackAp: ap, moveAp: 0, targetId, abilityActive: false };
}

function calculateStrategistMove(ai: Player, opponents: Player[], ap: number, history: TurnData[][]): Action {
  if (history.length < 2) return calculateTurtleMove(ai, opponents, ap);

  // Analyze patterns over last 3 rounds (Markov Chain simulation)
  const windowSize = Math.min(3, history.length);
  const relevantHistory = history.slice(-windowSize);
  
  let totalAttacksReceived = 0;
  let totalReservesFound = 0;
  let totalBlocksFound = 0;

  relevantHistory.forEach(round => {
    round.forEach(submission => {
      const p = opponents.find(o => o.id === submission.playerId);
      if (p && !p.isAI) {
        if (submission.action.attackAp > 1) totalAttacksReceived++;
        if (submission.action.attackAp === 0 && submission.action.blockAp === 0) totalReservesFound++;
        if (submission.action.blockAp > 1) totalBlocksFound++;
      }
    });
  });

  let blockAp = 0;
  let attackAp = 0;
  let targetId: string | undefined = undefined;

  // Counter pattern: Heavy Aggression -> Block
  if (totalAttacksReceived >= windowSize) {
    blockAp = Math.min(ap, 3);
    attackAp = Math.max(0, ap - blockAp);
  } 
  // Counter pattern: Heavy Greed (Reserving) -> Punish with Attack
  else if (totalReservesFound >= windowSize) {
    attackAp = Math.min(ap, ap > 5 ? 4 : 3);
    blockAp = Math.max(0, ap - attackAp);
  }
  // Counter pattern: Defensive -> Build AP for bigger hit later
  else if (totalBlocksFound >= windowSize) {
    blockAp = 1;
    attackAp = 0; // Conserve energy
  }
  // Default Balanced State
  else {
    blockAp = 1;
    attackAp = Math.min(ap - 1, 1);
  }

  if (attackAp > 0) {
    targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  }

  // Fixed: Added abilityActive: false
  return { blockAp, attackAp, moveAp: 0, targetId, abilityActive: false };
}
