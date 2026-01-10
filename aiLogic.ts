
import { Player, Action, AIArchetype, TurnData, DifficultyLevel, GridMap, TileType, Position, UnitType, AIDifficulty, WinCondition } from './types';
import { getReachableTiles, getManhattanDistance, getStride, getCoverStatus, getObstaclesInLine, findPath, ReachableTile } from './utils/gridLogic';
import { ATTACK_CONFIG, BASE_ATTACK_DMG, BASE_MOVE_COST, BLOCK_CONFIG } from './constants';
import { calculateIncome, MAX_AP } from './apManager';

interface AIContext {
    difficulty: DifficultyLevel;
    winCondition?: WinCondition;
    thresholdPos?: Position; // Center or reference
}

const getCost = (tier: number, type: 'ATTACK' | 'BLOCK') => {
    // @ts-ignore
    const config = type === 'ATTACK' ? ATTACK_CONFIG : BLOCK_CONFIG;
    // @ts-ignore
    return config[tier]?.ap || 999;
};

const getMaxTier = (budget: number, type: 'ATTACK' | 'BLOCK') => {
  if (budget >= getCost(3, type)) return 3;
  if (budget >= getCost(2, type)) return 2;
  if (budget >= getCost(1, type)) return 1;
  return 0;
};

// --- MAIN AI FUNCTION ---

export function calculateAIMove(
  aiPlayer: Player, 
  allPlayers: Player[], 
  history: TurnData[][], 
  round: number,
  context: AIContext,
  activeMap: GridMap,
  playerIntents: TurnData[] = []
): Action {
  
  const config = aiPlayer.aiConfig || { archetype: AIArchetype.STRATEGIST, difficulty: AIDifficulty.NORMAL };

  // 1. Identify Context
  const teammates = allPlayers.filter(p => !p.isEliminated && p.id !== aiPlayer.id && p.isAI === aiPlayer.isAI);
  const enemies = allPlayers.filter(p => !p.isEliminated && p.id !== aiPlayer.id && p.isAI !== aiPlayer.isAI);
  const opponents = enemies.length > 0 ? enemies : allPlayers.filter(p => p.id !== aiPlayer.id && !p.isEliminated);
  
  // 2. Pre-calculation
  const occupied = allPlayers.filter(p => !p.isEliminated && p.id !== aiPlayer.id).map(p => p.position);
  const unitSpeed = (aiPlayer.unit?.speed || 1.0) + (aiPlayer.loadout?.primary?.weight || 0) * 0.1;
  
  // STRIDE REMOVED: Utilization of full AP budget via updated getReachableTiles
  const reachable = getReachableTiles(aiPlayer.position, aiPlayer.ap, activeMap, occupied, unitSpeed);
  
  // 3. Target Selection (Squad-Linked)
  const target = selectBestTarget(aiPlayer, opponents, reachable, activeMap, config, teammates, history);

  if (!target) return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false };

  // 4. Check Imminent Death
  const imminentDeath = checkImminentDeath(aiPlayer, target, playerIntents, context.difficulty);

  // 5. Position Selection (Now with Collision Awareness)
  const bestTile = selectBestPosition(aiPlayer, target, reachable, activeMap, config, teammates, unitSpeed, context, opponents, round);

  // 6. AP Allocation (Squad-Aware)
  const allocation = allocateActionPoints(
    aiPlayer, 
    target, 
    bestTile, 
    config, 
    activeMap, 
    playerIntents, 
    imminentDeath,
    unitSpeed,
    round,
    teammates,
    history
  );

  if (allocation.isDesperation) {
    return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false, isDesperation: true };
  }

  // DIJKSTRA UPDATE: Use the smart pathfinder
  const movePath = findPath(aiPlayer.position, bestTile, activeMap, [], unitSpeed);

  return {
    moveAp: bestTile.costInAp,
    moveDest: bestTile,
    movePath: movePath.length > 0 ? movePath : [bestTile],
    blockAp: allocation.blockAp,
    attackAp: allocation.attackAp,
    abilityActive: false, 
    targetId: target.id
  };
}

// ... (Helper functions)

function getLastTargetId(playerId: string, history: TurnData[][]): string | undefined {
  if (history.length > 0) {
      const lastRoundData = history[history.length - 1];
      const myLastTurn = lastRoundData.find(t => t.playerId === playerId);
      return myLastTurn?.action.targetId;
  }
  return undefined;
}

function checkImminentDeath(aiPlayer: Player, target: Player, intents: TurnData[], difficulty: DifficultyLevel): boolean {
  // 1. Omniscient Check (Blackout Difficulty or Visible Intent)
  if (intents.length > 0) {
      const incomingAttack = intents.find(i => i.playerId === target.id);
      if (incomingAttack && incomingAttack.action.attackAp > 0) {
          const tier = incomingAttack.action.attackAp;
          // @ts-ignore
          const mult = ATTACK_CONFIG[tier]?.mult || 1;
          const predictedDmg = BASE_ATTACK_DMG * mult * (target.unit?.atkStat || 1) * 1.5; 
          if (predictedDmg >= aiPlayer.hp) return true;
      }
      return false;
  }

  // 2. Paranoia Check (Normal/Overclock)
  if (difficulty === DifficultyLevel.OVERCLOCK) {
      const dist = getManhattanDistance(aiPlayer.position, target.position);
      const enemyRange = target.unit?.range || 2;
      // If we are safe by distance, we are not in imminent death
      if (dist > enemyRange) return false; 
  }

  // Assume target attacks with a standard Tier 2
  const estimatedDmg = BASE_ATTACK_DMG * 1.2 * (target.unit?.atkStat || 1); // Tier 2 estimates
  if (estimatedDmg >= aiPlayer.hp) return true;

  return false;
}

function selectBestTarget(
  aiPlayer: Player,
  opponents: Player[],
  reachable: ReachableTile[],
  activeMap: GridMap,
  config: any,
  teammates: Player[],
  history: TurnData[][]
): Player | null {
  if (opponents.length === 0) return null;

  let bestTarget: Player | null = null;
  let bestScore = -99999;

  opponents.forEach(opp => {
    let score = 0;

    // 1. Base HP Pressure (Lower is better)
    score += (opp.maxHp - opp.hp) * 0.1;

    // 2. Killability (Can we end them this turn?)
    if (opp.hp < 200) score += 50;

    // 3. SQUAD-LINK: Focus Fire
    // If a teammate already targeted this person in the last round, keep the pressure up
    const focusCount = teammates.filter(tm => {
        const lastTarget = getLastTargetId(tm.id, history);
        return lastTarget === opp.id;
    }).length;
    score += focusCount * 30;

    // 4. Proximity
    const dist = getManhattanDistance(aiPlayer.position, opp.position);
    score -= dist * 2;
    
    // 5. Stickiness (Keep targeting same person if efficient)
    const myLastTarget = getLastTargetId(aiPlayer.id, history);
    if (myLastTarget === opp.id) score += 15;

    if (score > bestScore) {
      bestScore = score;
      bestTarget = opp;
    }
  });

  return bestTarget;
}

function selectBestPosition(
  aiPlayer: Player,
  target: Player,
  reachable: ReachableTile[],
  activeMap: GridMap,
  config: any,
  teammates: Player[],
  unitSpeed: number,
  context: AIContext,
  opponents: Player[],
  round: number
): ReachableTile {
  const unitRange = aiPlayer.unit?.range || 2;
  const tilesToEvaluate = [{ ...aiPlayer.position, costInAp: 0 } as ReachableTile, ...reachable];
  let bestTile = tilesToEvaluate[0];
  let bestScore = -99999;

  // Aegis Passive: Inertia
  const hasInertia = aiPlayer.unit?.type === UnitType.AEGIS;
  
  const combatReserve = 10; // Minimum AP AI tries to keep for actions

  tilesToEvaluate.forEach(tile => {
      let score = 0;
      const dToTarget = getManhattanDistance(tile, target.position);
      const tileType = activeMap.tiles[tile.y][tile.x];
      
      // 1. Objective Scoring (The Hook)
      if (context.winCondition === WinCondition.CONTROL) {
          // ANY Threshold tile is good
          if (tileType === TileType.THRESHOLD) {
              score += 150; // MASSIVE bonus for holding the point
          } else if (context.thresholdPos) {
              // Gravitate towards center of zone
              const dToPoint = getManhattanDistance(tile, context.thresholdPos);
              score -= dToPoint * 8;
          }
      }

      // 2. Lethality Scoring
      if (dToTarget <= unitRange) score += 60;
      if (tileType === TileType.HIGH_GROUND) score += 25; // High ground advantage
      
      // 3. Survivability Scoring
      if (getCoverStatus(target.position, tile, activeMap)) score += 35;
      if (tileType === TileType.TOXIC) score -= 100;      // Don't stand in acid
      if (tileType === TileType.DEBRIS) score -= 15;      // Rubble is risky

      // 4. "The Snap" - Collision Awareness (Scaled)
      const estimatedAp = 15 + (round * 2); // Scale budget guess with game time

      opponents.forEach(opp => {
          const oppSpeed = (opp.unit?.speed || 1.0);
          const oppCost = Math.round(BASE_MOVE_COST / oppSpeed);
          const dToTile = getManhattanDistance(opp.position, tile);
          
          // Estimate if enemy can reach this tile
          const canReach = (dToTile * oppCost) <= estimatedAp; 
          
          if (canReach) {
              // Collision Risk Calculation
              if (hasInertia) {
                  // I am The Wall. I want to collide.
                  score += 40; 
              } else if (unitSpeed > oppSpeed) {
                  // I am faster. I take the tile and damage them.
                  score += 20;
              } else if (unitSpeed < oppSpeed) {
                  // I am slower. I will be displaced and take damage.
                  score -= 80; 
              } else {
                  // Tie. Crash.
                  score -= 40;
              }
          }
      });

      // 5. Distance Pressure
      if (config.archetype === AIArchetype.AGGRO) {
          score -= dToTarget * 5; 
      } else if (config.archetype === AIArchetype.TURTLE) {
          // Turtles prefer cover heavily
          if (getCoverStatus(target.position, tile, activeMap)) score += 20;
      }

      // 6. Efficiency & Budgeting
      score -= tile.costInAp * 2.0; // Increased penalty for moving far
      
      // Combat Reserve Check: Penalize moves that drain the ability to fight
      if (aiPlayer.ap - tile.costInAp < combatReserve) {
          score -= 40;
      }

      if (score > bestScore) {
          bestScore = score;
          bestTile = tile;
      }
  });

  return bestTile;
}

function allocateActionPoints(
  aiPlayer: Player,
  target: Player,
  bestTile: ReachableTile,
  config: any,
  activeMap: GridMap,
  observableIntents: TurnData[],
  imminentDeath: boolean,
  unitSpeed: number,
  round: number,
  teammates: Player[],
  history: TurnData[][]
): { attackAp: number, blockAp: number, isDesperation?: boolean } {

  const moveAp = bestTile.costInAp;
  const remainingAp = aiPlayer.ap - moveAp;
  
  // Desperation Check
  if (aiPlayer.hp < aiPlayer.maxHp * 0.15 && !aiPlayer.desperationUsed && aiPlayer.unit) {
      return { blockAp: 0, attackAp: 0, isDesperation: true };
  }

  let attackAp = 0;
  let blockAp = 0;

  // Initiative Check
  const targetSpeed = (target.unit?.speed || 1.0);
  const isFaster = unitSpeed > targetSpeed;

  // Decision Logic
  let desiredAttack = 0;
  let desiredBlock = 0;

  if (config.archetype === AIArchetype.AGGRO) {
      desiredAttack = getMaxTier(remainingAp, 'ATTACK');
      const leftover = remainingAp - getCost(desiredAttack, 'ATTACK');
      desiredBlock = getMaxTier(leftover, 'BLOCK');
  } else if (config.archetype === AIArchetype.TURTLE) {
      desiredBlock = getMaxTier(remainingAp, 'BLOCK');
      const leftover = remainingAp - getCost(desiredBlock, 'BLOCK');
      desiredAttack = getMaxTier(leftover, 'ATTACK');
  } else {
      // Balanced
      if (imminentDeath || !isFaster) {
          // If slow or dying, prioritize block
          desiredBlock = (remainingAp >= getCost(2, 'BLOCK')) ? 2 : getMaxTier(remainingAp, 'BLOCK');
          const leftover = remainingAp - getCost(desiredBlock, 'BLOCK');
          desiredAttack = getMaxTier(leftover, 'ATTACK');
      } else {
          // If faster and safe, punish
          desiredAttack = getMaxTier(remainingAp, 'ATTACK');
          const leftover = remainingAp - getCost(desiredAttack, 'ATTACK');
          desiredBlock = getMaxTier(leftover, 'BLOCK');
      }
  }

  // --- OVER-COMMIT PROTECTION ---
  const projectedTeammateDmg = teammates.reduce((acc, tm) => {
      const tmLastTarget = getLastTargetId(tm.id, history);
      if (tmLastTarget === target.id && (tm.unit?.speed || 1) > unitSpeed) {
          return acc + 150; // Average damage estimate
      }
      return acc;
  }, 0);

  if (target.hp - projectedTeammateDmg <= 0 && desiredAttack > 1) {
      // Target likely dead, save AP or just tap
      attackAp = 1;
      // Re-allocate to block with freed AP
      const apAfterWeakAttack = remainingAp - getCost(1, 'ATTACK');
      blockAp = getMaxTier(apAfterWeakAttack, 'BLOCK');
  } else {
      attackAp = desiredAttack;
      blockAp = desiredBlock;
  }

  // --- ANTI-VENTING LOGIC ---
  const incomeResult = calculateIncome(0, round + 1); 
  const currentTotalCost = getCost(attackAp, 'ATTACK') + getCost(blockAp, 'BLOCK');
  const estimatedNextTurnAp = (remainingAp - currentTotalCost) + incomeResult.total;
  
  if (estimatedNextTurnAp > MAX_AP) {
      // Try upgrade Block
      if (blockAp < 3) {
          const costDiff = getCost(blockAp + 1, 'BLOCK') - getCost(blockAp, 'BLOCK');
          if (remainingAp - currentTotalCost >= costDiff) {
              blockAp++;
          }
      }
      // Try upgrade Attack
      if (attackAp < 3) {
          const newBlockCost = getCost(blockAp, 'BLOCK'); // Updated block cost
          const costDiff = getCost(attackAp + 1, 'ATTACK') - getCost(attackAp, 'ATTACK');
          if (remainingAp - (newBlockCost + getCost(attackAp, 'ATTACK')) >= costDiff) {
              attackAp++;
          }
      }
  }

  return { attackAp, blockAp };
}
