
import { Player, Action, AIArchetype, TurnData, DifficultyLevel, GridMap, TileType, Position, UnitType, AIDifficulty } from './types';
import { getReachableTiles, getManhattanDistance, getStride, getCoverStatus, getObstaclesInLine, findPath } from './utils/gridLogic';
import { ATTACK_CONFIG, BLOCK_CONFIG, BASE_ATTACK_DMG } from './constants';

const getCost = (tier: number) => tier === 1 ? 1 : tier === 2 ? 3 : 6;

const getMaxTier = (budget: number) => {
  if (budget >= 6) return 3;
  if (budget >= 3) return 2;
  if (budget >= 1) return 1;
  return 0;
};

export function calculateAIMove(
  aiPlayer: Player, 
  allPlayers: Player[], 
  history: TurnData[][], 
  round: number,
  currentChapter: number,
  difficulty: DifficultyLevel,
  activeMap: GridMap,
  playerIntents: TurnData[] = []
): Action {
  
  // --- 0. PRE-CALCULATION SETUP ---
  const config = aiPlayer.aiConfig || { archetype: AIArchetype.STRATEGIST, difficulty: AIDifficulty.NORMAL };
  
  // Faction Logic: Identify Friends vs Foes
  // In Campaign: AI vs Human. In PvP: depends, but usually we group by isAI.
  const teammates = allPlayers.filter(p => !p.isEliminated && p.id !== aiPlayer.id && p.isAI === aiPlayer.isAI);
  const enemies = allPlayers.filter(p => !p.isEliminated && p.id !== aiPlayer.id && p.isAI !== aiPlayer.isAI);
  
  // Fallback for FFA or Empty World
  const opponents = enemies.length > 0 ? enemies : allPlayers.filter(p => p.id !== aiPlayer.id && !p.isEliminated);
  
  // --- INFORMATION HORIZON (The "Fair Play" Fix) ---
  const observableIntents = difficulty === DifficultyLevel.BLACKOUT ? playerIntents : [];

  // --- TARGET STICKINESS (The "Finisher" Logic) ---
  // Check history to see who we attacked last turn.
  let lastTargetId: string | undefined;
  if (history.length > 0) {
      const lastRoundData = history[history.length - 1];
      const myLastTurn = lastRoundData.find(t => t.playerId === aiPlayer.id);
      if (myLastTurn?.action.targetId) {
          lastTargetId = myLastTurn.action.targetId;
      }
  }

  // Pre-calc movement for Targeting Logic
  const occupied = allPlayers.filter(p => !p.isEliminated && p.id !== aiPlayer.id).map(p => p.position);
  const stride = getStride(aiPlayer.unit?.speed || 1);
  const reachable = getReachableTiles(aiPlayer.position, stride, aiPlayer.ap, activeMap, occupied);
  const unitRange = aiPlayer.unit?.range || 2;
  const minPierce = aiPlayer.unit?.minTierToPierceWalls ?? 99;

  // TARGET SELECTION (Refined with Reachability Check)
  let bestTarget = opponents[0];
  let highestTargetScore = -Infinity;

  opponents.forEach(op => {
      const dist = getManhattanDistance(aiPlayer.position, op.position);
      const hpPercent = op.hp / op.maxHp;
      let score = 0;

      // Base: Distance
      score -= dist * 10;

      // Low HP Bonus
      if (hpPercent < 0.25) score += 50; 
      else score -= hpPercent * 20;

      // Archetype specific overrides
      if (config.archetype === AIArchetype.AGGRO || aiPlayer.unit?.type === UnitType.REAPER) {
          score += (1 - hpPercent) * 100; 
      } else if (config.archetype === AIArchetype.STRATEGIST) {
           if (hpPercent < 0.15) score += 200; 
      } else if (config.archetype === AIArchetype.TURTLE) {
          score -= dist * 20;
      }

      // STICKINESS BONUS: Focus on the same target to secure elimination
      if (lastTargetId && op.id === lastTargetId) {
          score += 50;
      }

      // --- THE "CLUTTER" CHECK ---
      let canAttack = false;
      const potentialPositions = [aiPlayer.position, ...reachable];
      
      for (const pos of potentialPositions) {
          const d = getManhattanDistance(pos, op.position);
          
          if (d <= unitRange) {
              const moveCost = (pos.x === aiPlayer.position.x && pos.y === aiPlayer.position.y) ? 0 : (pos as any).costInAp || 0;
              const remainingAp = aiPlayer.ap - moveCost;
              const maxPossibleTier = getMaxTier(remainingAp);
              
              if (maxPossibleTier < 1) continue;

              const canIgnoreWalls = maxPossibleTier >= minPierce;
              const obstacles = getObstaclesInLine(pos, op.position, activeMap);

              if (obstacles === 0 || canIgnoreWalls) {
                  canAttack = true;
                  break;
              }
          }
      }

      if (canAttack) {
          score += 300; 
      } else {
          score -= 1000; 
      }
      
      if (score > highestTargetScore) {
          highestTargetScore = score;
          bestTarget = op;
      }
  });

  const target = bestTarget;

  if (!target) return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false };

  // --- 1. PREDICTIVE DESPERATION ---
  let imminentDeath = false;

  if (observableIntents.length > 0) {
      const incomingAttack = observableIntents.find(i => i.playerId === target.id);
      if (incomingAttack && incomingAttack.action.attackAp > 0) {
          const tier = incomingAttack.action.attackAp;
          // @ts-ignore
          const mult = ATTACK_CONFIG[tier]?.mult || 1;
          const predictedDmg = BASE_ATTACK_DMG * mult * (target.unit?.atkStat || 1) * 1.5; 
          if (predictedDmg >= aiPlayer.hp) imminentDeath = true;
      }
  }

  const isLowHp = aiPlayer.hp < aiPlayer.maxHp * 0.15;
  
  if ((isLowHp || imminentDeath) && !aiPlayer.desperationUsed && aiPlayer.unit) {
      return { blockAp: 0, attackAp: 0, moveAp: 0, abilityActive: false, isDesperation: true };
  }


  // --- 2. TILE SCORING WITH BODY BLOCKING & HARD LOS ---
  // Important: Include current position in evaluation to properly weigh "Standing Still" vs Moving
  const tilesToEvaluate = [
      { ...aiPlayer.position, costInAp: 0 } as { x: number, y: number, costInAp: number }, 
      ...reachable
  ];

  let bestTile = tilesToEvaluate[0];
  let bestScore = -99999;

  // Strategy Flags
  const wantsHighGround = config.archetype === AIArchetype.STRATEGIST || config.archetype === AIArchetype.TURTLE;
  const wantsCover = config.archetype === AIArchetype.TURTLE || config.archetype === AIArchetype.STRATEGIST;

  // --- TACTICAL BODY BLOCKING ---
  const blockingPoints = new Set<string>();
  const isBlocker = config.archetype === AIArchetype.TURTLE || config.archetype === AIArchetype.STRATEGIST;
  
  if (isBlocker) {
      // Find all thresholds
      const thresholds: Position[] = [];
      activeMap.tiles.forEach((row, y) => row.forEach((t, x) => {
          if (t === TileType.THRESHOLD) thresholds.push({x, y});
      }));

      if (thresholds.length > 0) {
          let closestT = thresholds[0];
          let minD = 999;
          thresholds.forEach(t => {
             const d = getManhattanDistance(target.position, t);
             if(d < minD) { minD = d; closestT = t; }
          });
          
          // Pathing to Nowhere Protection:
          // If the enemy cannot reach the threshold (blocked by walls), findPath returns [].
          // We gracefully handle this by just having an empty set of blocking points.
          const enemyPath = findPath(target.position, closestT, activeMap, []); 
          enemyPath.forEach(p => blockingPoints.add(`${p.x},${p.y}`));
      }
  }
  
  tilesToEvaluate.forEach(tile => {
      let score = 0;
      const dToTarget = getManhattanDistance(tile, target.position);
      const tileType = activeMap.tiles[tile.y][tile.x];

      // A. Range Scoring
      if (config.archetype === AIArchetype.AGGRO) {
          if (dToTarget <= 1) score += 50;
          else score -= dToTarget * 10;
      } else if (config.archetype === AIArchetype.TURTLE) {
          if (dToTarget <= unitRange) score += 20;
          else score -= dToTarget * 5;
      } else {
          // Strategist: Kite
          if (dToTarget === unitRange) score += 60; 
          else if (dToTarget < unitRange && unitRange > 2) score -= (unitRange - dToTarget) * 10; 
          else if (dToTarget > unitRange) score -= dToTarget * 5; 
      }

      // B. Terrain
      if (tileType === TileType.THRESHOLD) score += 150; 
      if (tileType === TileType.HIGH_GROUND && wantsHighGround) score += 25;
      if (tileType === TileType.TOXIC) score -= 200; 

      // C. Cover
      if (wantsCover && getCoverStatus(target.position, tile, activeMap)) {
          score += 40;
      }

      // D. BODY BLOCKING (The "Advisor" Fix)
      const isBlocking = blockingPoints.has(`${tile.x},${tile.y}`);
      if (isBlocking) {
          if (config.archetype === AIArchetype.TURTLE) score += 100;
          if (config.archetype === AIArchetype.STRATEGIST) score += 50;
      }

      // E. HARD Line of Sight Check
      const moveCost = tile.costInAp;
      const remainingForAttack = aiPlayer.ap - moveCost;
      const potentialTier = getMaxTier(remainingForAttack);
      
      const canIgnoreWalls = potentialTier >= minPierce;

      if (dToTarget <= unitRange) {
          const obstacles = getObstaclesInLine(tile, target.position, activeMap);
          if (obstacles === 0 || canIgnoreWalls) {
              // Valid shot
          } else {
              // Wall blocked. Punish score.
              score -= 100;
          }
      }

      // F. Efficiency
      score -= tile.costInAp * 2;
      
      // G. STICKINESS (The "Advisor" Fix)
      if (tile.x === aiPlayer.position.x && tile.y === aiPlayer.position.y) {
          if (isBlocking) score += 50; 
          else score += 5; 
      }

      // H. FLANKING & SQUAD SPACING (The "Pro Move")
      if (teammates.length > 0) {
          let crowdingPenalty = 0;
          let flankingBonus = 0;

          // AI Difficulty Modifiers for Positioning
          const isHard = config.difficulty === AIDifficulty.HARD;
          const isEasy = config.difficulty === AIDifficulty.EASY;

          teammates.forEach(tm => {
              const dToTeammate = getManhattanDistance(tile, tm.position);
              
              // 1. Crowding Penalty: Prevents stacking in AOE/Blocking lines
              if (dToTeammate <= 1) crowdingPenalty += 40; // Don't stand adjacent if possible
              else if (dToTeammate <= 2) crowdingPenalty += 10; // Give breathing room

              // 2. Flanking: Try to attack from different angles
              // Vector Target->Teammate
              const vecTm = { x: tm.position.x - target.position.x, y: tm.position.y - target.position.y };
              // Vector Target->Me(Candidate)
              const vecMe = { x: tile.x - target.position.x, y: tile.y - target.position.y };
              
              // Simple Dot Product check for rough angle
              // Positive = Same Side, Negative = Opposite Side
              const dot = (vecTm.x * vecMe.x) + (vecTm.y * vecMe.y);
              
              // Scaling flanking logic based on AI difficulty
              if (dot < 0) flankingBonus += isHard ? 35 : isEasy ? 10 : 25; 
              else if (dot > 0) flankingBonus -= 10; 
          });

          // CAPPED PENALTY: Ensure crowding penalty never exceeds 150.
          // The "Can Attack" bonus is 300.
          // This ensures that if the ONLY way to attack is to stand in a crowd (hallway),
          // 300 - 150 = +150 score, which is still better than not attacking.
          score -= Math.min(crowdingPenalty, 150);
          score += flankingBonus;
      }

      // Save Best
      if (score > bestScore) {
          bestScore = score;
          bestTile = tile;
      }
  });


  // --- 3. AP ALLOCATION & OVERHEAT MANAGEMENT ---
  const moveAp = bestTile.costInAp;
  const remainingAp = aiPlayer.ap - moveAp;
  
  let attackAp = 0;
  let blockAp = 0;

  const overheat = aiPlayer.blockFatigue || 0;
  // VENT LOGIC: Only vent if we are not in immediate danger of death
  // If imminentDeath is true, we ignore overheat to try and block/survive.
  const needsToVent = overheat >= 3 && !imminentDeath; 

  const canAfford = (tier: number, budget: number) => getCost(tier) <= budget;

  if (config.archetype === AIArchetype.AGGRO) {
      if (canAfford(3, remainingAp)) attackAp = 3;
      else if (canAfford(2, remainingAp)) attackAp = 2;
      else if (canAfford(1, remainingAp)) attackAp = 1;
      
      const afterAtk = remainingAp - (attackAp > 0 ? getCost(attackAp) : 0);
      blockAp = needsToVent ? 0 : getMaxTier(afterAtk);

  } else if (config.archetype === AIArchetype.TURTLE) {
      const threatened = aiPlayer.hp < aiPlayer.maxHp * 0.5 || activeMap.tiles[bestTile.y][bestTile.x] === TileType.THRESHOLD;
      const blockTarget = threatened ? 3 : 2;

      const forceVent = needsToVent && aiPlayer.hp > 200; 

      if (!forceVent) {
          if (canAfford(blockTarget, remainingAp)) blockAp = blockTarget;
          else if (canAfford(blockTarget - 1, remainingAp)) blockAp = blockTarget - 1;
          else if (canAfford(1, remainingAp)) blockAp = 1;
      }

      const afterBlk = remainingAp - (blockAp > 0 ? getCost(blockAp) : 0);
      attackAp = getMaxTier(afterBlk);

  } else {
      // STRATEGIST
      if (needsToVent) {
          attackAp = getMaxTier(remainingAp);
          blockAp = 0;
      } else {
          if (remainingAp >= 6) { attackAp = 2; blockAp = 2; } 
          else if (remainingAp >= 4) { attackAp = 2; blockAp = 1; }
          else if (remainingAp >= 2) { attackAp = 1; blockAp = 1; } 
          else { attackAp = getMaxTier(remainingAp); }
          
          // BANKING LOGIC (The "Pro" Update)
          // If we are only putting up a weak shield (Tier 1) and we have Cover,
          // it's better to save that AP for a Tier 3 combo next turn.
          if (blockAp === 1 && !isLowHp) {
              const isInCover = getCoverStatus(target.position, bestTile, activeMap);
              if (isInCover) {
                  blockAp = 0;
              }
          }
      }
  }

  // --- 4. BLACKOUT COUNTER-BAIT ---
  if (observableIntents.length > 0) {
      const incoming = observableIntents.find(i => i.playerId === target.id);
      
      if (incoming) {
          if (incoming.action.blockAp >= 3) {
              attackAp = 0; 
              const currentSpend = moveAp;
              const bank = aiPlayer.ap - currentSpend;
              if (!needsToVent) {
                  blockAp = getMaxTier(bank);
              }
          }
          else if (incoming.action.attackAp >= 2) {
              if (!needsToVent) blockAp = Math.min(3, getMaxTier(remainingAp));
              const leftover = remainingAp - (blockAp > 0 ? getCost(blockAp) : 0);
              attackAp = getMaxTier(leftover);
          }
      }
  }

  // --- 5. ABILITY USAGE (Tuned by Difficulty) ---
  let abilityActive = false;
  if (!aiPlayer.activeUsed && aiPlayer.cooldown <= 0) {
      let abilityChance = 0.2; // Base Normal
      
      if (config.difficulty === AIDifficulty.EASY) abilityChance = 0.1;
      else if (config.difficulty === AIDifficulty.HARD) abilityChance = 0.4;

      if (difficulty === DifficultyLevel.BLACKOUT) abilityChance += 0.2;
      if (difficulty === DifficultyLevel.OVERCLOCK) abilityChance += 0.1;

      if (Math.random() < abilityChance) abilityActive = true;
  }

  // --- 6. PATH GENERATION ---
  const movePath = findPath(aiPlayer.position, bestTile, activeMap);

  return {
      moveAp,
      moveDest: bestTile,
      movePath: movePath.length > 0 ? movePath : [bestTile],
      blockAp,
      attackAp,
      abilityActive,
      targetId: target.id
  };
}
