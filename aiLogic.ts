
import { Player, Action, AIArchetype, AIDifficulty, TurnData, DifficultyLevel } from './types';

const MISTAKE_RATES = {
  [AIDifficulty.EASY]: 0.20,
  [AIDifficulty.NORMAL]: 0.10,
  [AIDifficulty.HARD]: 0.05,
};

// Helper: Determine max Tier affordable with given budget
// Cost: L1=1, L2=3, L3=6
const getMaxTier = (budget: number) => {
  if (budget >= 6) return 3;
  if (budget >= 3) return 2;
  if (budget >= 1) return 1;
  return 0;
};

const getCost = (tier: number) => {
  if (tier === 3) return 6;
  if (tier === 2) return 3;
  if (tier === 1) return 1;
  return 0;
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
  // Safety check: Ensure AI Config exists
  if (!aiPlayer.aiConfig) {
    return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false };
  }

  const config = aiPlayer.aiConfig;
  const availableAp = aiPlayer.ap;
  const opponents = allPlayers.filter(p => p.id !== aiPlayer.id && !p.isEliminated);
  const player = opponents.find(p => !p.isAI);

  // Blackout Modifier: Cheating (Reads your inputs)
  if (difficulty === DifficultyLevel.BLACKOUT && playerIntents.length > 0 && player) {
    const playerAction = playerIntents.find(i => i.playerId === player.id)?.action;
    if (playerAction) {
      // If player is attacking heavily, prioritize heavy defense
      if (playerAction.attackAp >= 2) {
        // Try to match with max block
        const blockTier = getMaxTier(availableAp);
        return { blockAp: blockTier, attackAp: 0, moveAp: 0, abilityActive: false, targetId: player.id };
      }
      // If player is blocking, prioritize reservation or pure offense if possible
      if (playerAction.blockAp >= 2) {
        return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false }; // Reserve
      }
    }
  }

  // Mistake Logic (Only for Normal/Easy)
  if (difficulty === DifficultyLevel.NORMAL && Math.random() < MISTAKE_RATES[config.difficulty]) {
    return generateRandomValidMove(availableAp, opponents);
  }

  // Chapter Shifts
  // Early Chapter (Reactive)
  if (chapter === 1) {
    if (availableAp > 4) {
      return calculateAggroMove(aiPlayer, opponents, availableAp);
    } else {
      const blockTier = getMaxTier(Math.min(availableAp, 3)); // Spend up to 3 AP (Tier 2) on block
      return { blockAp: blockTier, attackAp: 0, moveAp: 0, abilityActive: false };
    }
  }

  // Mid Chapter (Proactive)
  if (chapter === 2) {
    const cycle = round % 3;
    if (cycle === 0) { // Turn 3: Burst
      return calculateAggroMove(aiPlayer, opponents, availableAp);
    } else { // Turn 1-2: Reserve
      // Spend 1 AP on Block if possible
      const blockTier = getMaxTier(1);
      return { blockAp: blockTier, attackAp: 0, moveAp: 0, abilityActive: false };
    }
  }

  // Late Chapter (Predictive)
  if (chapter === 3 && player) {
    if (player.hp < 200) {
      // Ignore defense, go all-in
      const attackTier = getMaxTier(availableAp);
      return { blockAp: 0, attackAp: attackTier, moveAp: 0, abilityActive: true, targetId: player.id };
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
  // Randomly allocate budget
  const budgetForBlock = Math.floor(Math.random() * (ap + 1));
  const blockTier = getMaxTier(budgetForBlock);
  const blockCost = getCost(blockTier);
  
  const remaining = ap - blockCost;
  const attackTier = getMaxTier(remaining);
  
  const target = opponents[Math.floor(Math.random() * opponents.length)]?.id;
  return { blockAp: blockTier, attackAp: attackTier, moveAp: 0, targetId: attackTier > 0 ? target : undefined, abilityActive: false };
}

function calculateTurtleMove(ai: Player, opponents: Player[], ap: number): Action {
  // Try to spend ~3-6 AP on block
  let blockBudget = 3;
  if (ai.hp < 300) blockBudget = 6;
  
  const blockTier = getMaxTier(Math.min(ap, blockBudget));
  const blockCost = getCost(blockTier);
  
  let attackTier = 0;
  let targetId: string | undefined = undefined;
  
  const remaining = ap - blockCost;
  // If we have enough for a Level 1 attack (1 AP) and health is decent
  if (ai.hp > 500 && remaining >= 1) {
    attackTier = 1;
    targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  }
  
  return { blockAp: blockTier, attackAp: attackTier, moveAp: 0, targetId, abilityActive: false };
}

function calculateAggroMove(ai: Player, opponents: Player[], ap: number): Action {
  const targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  // Spend max on attack
  const attackTier = getMaxTier(ap);
  return { blockAp: 0, attackAp: attackTier, moveAp: 0, targetId, abilityActive: false };
}

function calculateStrategistMove(ai: Player, opponents: Player[], ap: number, history: TurnData[][]): Action {
  if (history.length < 2) return calculateTurtleMove(ai, opponents, ap);
  
  const targetId = opponents.sort((a, b) => a.hp - b.hp)[0]?.id;
  
  // Try to maintain Tier 1 Block (1 AP) and spend rest on Attack
  const blockTier = getMaxTier(1);
  const blockCost = getCost(blockTier);
  
  const remaining = ap - blockCost;
  const attackTier = getMaxTier(remaining);
  
  return { blockAp: blockTier, attackAp: attackTier, moveAp: 0, targetId, abilityActive: false };
}
