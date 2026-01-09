
import { Player, TurnData, ResolutionLog, ActionType, UnitType, GameMode, DifficultyLevel, HazardType, TileType, GridMap, Position } from './types';
import { BASE_ATTACK_DMG, ATTACK_CONFIG, BLOCK_CONFIG, TILE_BONUSES, DESPERATION_MOVES, COLLISION_DAMAGE, THRESHOLD_WIN_TURNS } from './constants';
import { calculateIncome } from './apManager';
import { getManhattanDistance, getObstaclesInLine, getCoverStatus } from './utils/gridLogic';

interface CombatResult {
  nextPlayers: Player[];
  logs: ResolutionLog[];
  nextRound: number;
}

const applyStatus = (target: Player, type: 'BURN' | 'POISON' | 'PARALYZE', duration: number) => {
  const existing = target.statuses.find(s => s.type === type);
  if (existing) existing.duration = Math.max(existing.duration, duration);
  else target.statuses.push({ type, duration });
};

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
  const nextPlayers = JSON.parse(JSON.stringify(currentPlayers)) as Player[];
  const logs: ResolutionLog[] = [];
  
  const enemyDmgMult = difficulty === DifficultyLevel.BLACKOUT ? 1.25 : difficulty === DifficultyLevel.OVERCLOCK ? 1.1 : 1.0;

  // --- Step 0: Pre-Combat Ability Triggers ---
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    if (hazard === HazardType.NULL_FIELD && sub.action.abilityActive) {
      logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "NULL_FIELD: Ability suppressed." });
      return;
    }
    if (sub.action.abilityActive && !p.activeUsed) {
       if (p.unit?.type === UnitType.BATTERY) {
        p.ap += 4; p.hp -= 100; p.activeUsed = true;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "OVERCHARGE: +4 AP // -100 HP" });
      } else if (p.unit?.type === UnitType.MEDIC) {
        const healAmt = hazard === HazardType.VIRAL_INVERSION ? -400 : 400;
        p.hp = Math.max(0, Math.min(p.maxHp, p.hp + healAmt));
        p.activeUsed = true;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: healAmt > 0 ? "PATCH: +400 HP" : "VIRAL_INVERSION: -400 HP" });
      } else if (p.unit?.type === UnitType.AEGIS) {
        p.activeUsed = true; p.isAbilityActive = true;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "TITAN_SHIELD: 80% DR active." });
      } else if (p.unit?.type === UnitType.GHOST) {
        p.activeUsed = true; p.isAbilityActive = true;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "PHASE_SHIFT: Untargetable this cycle." });
      }
    }
  });

  // --- Step 0.5: Desperation Move Resolution ---
  submissions.forEach(sub => {
    if (sub.action.isDesperation) {
        const p = nextPlayers.find(x => x.id === sub.playerId)!;
        if (!p.desperationUsed && p.unit) {
            p.desperationUsed = true;
            const move = DESPERATION_MOVES[p.unit.type];
            logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: `${move.flavor}` });
            
             const enemies = nextPlayers.filter(e => e.id !== p.id && !e.isEliminated);
             const target = enemies[0];

            switch (p.unit.type) {
                 case UnitType.PYRUS:
                    enemies.forEach(e => {
                        const dmg = Math.floor(BASE_ATTACK_DMG * 5.0);
                        e.hp -= dmg;
                        logs.push({ attackerId: p.id, targetId: e.id, type: ActionType.ATTACK, damage: dmg, resultMessage: `SOLAR FLARE: ${dmg} DMG` });
                    });
                    break;
                 case UnitType.TROJAN:
                    if (target) {
                        target.ap = 0;
                        target.hp -= 200;
                        logs.push({ attackerId: p.id, targetId: target.id, type: ActionType.ATTACK, resultMessage: "LOGIC BOMB: AP DRAINED + 200 DMG" });
                    }
                    break;
                 default: break;
            }
        }
    }
  });

  // --- Step 1: Energy Accounting ---
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    if (sub.action.isDesperation) return;

    const moveCost = sub.action.moveAp || 0;
    
    // @ts-ignore
    const blockCost = sub.action.blockAp > 0 ? BLOCK_CONFIG[sub.action.blockAp].ap : 0;
    // @ts-ignore
    const attackCost = sub.action.attackAp > 0 ? ATTACK_CONFIG[sub.action.attackAp].ap : 0;
    
    const totalCost = blockCost + attackCost + moveCost;
    const reserved = p.ap - totalCost;
    p.ap -= totalCost;
    
    if (reserved > 0) logs.push({ attackerId: p.id, type: ActionType.RESERVE, resultMessage: `RESERVED: ${reserved} AP` });

    if (sub.action.blockAp > 0) {
        logs.push({ 
            attackerId: p.id, 
            type: ActionType.BLOCK, 
            resultMessage: `SHIELD MATRIX: TIER ${sub.action.blockAp}`,
            defenseTier: sub.action.blockAp,
            shield: (BLOCK_CONFIG as any)[sub.action.blockAp].base,
            mathDetails: `[COST: ${blockCost} AP]`
        });
    }
  });

  // --- Step 2: Fatigue Logic ---
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    if (sub.action.isDesperation) return;

    // Block Fatigue (Overheat)
    if (sub.action.blockAp > 0) {
      p.blockFatigue += 1;
    } else {
      if (p.blockFatigue > 0) {
        logs.push({ attackerId: p.id, type: ActionType.BLOCK, resultMessage: "SYSTEM COOLED: Overheat Reset." });
      }
      p.blockFatigue = 0;
    }
    p.moveFatigue = 0;
  });

  // --- Step 3: Complex Movement Resolution (Collision & Speed) ---
  interface MoveRequest {
    player: Player;
    path: Position[];
    cost: number;
    dest: Position;
    speed: number;
    originalPos: Position;
  }

  const moves: MoveRequest[] = [];

  submissions.forEach(sub => {
    if (sub.action.moveAp > 0 && !sub.action.isDesperation) {
        const p = nextPlayers.find(x => x.id === sub.playerId)!;
        if (p.statuses.find(s => s.type === 'PARALYZE')) {
           logs.push({ attackerId: p.id, type: ActionType.MOVE, resultMessage: "PARALYZED: Movement Failed." });
           return;
        }

        const path = sub.action.movePath || (sub.action.moveDest ? [sub.action.moveDest] : []);
        if (path.length > 0) {
            moves.push({
                player: p,
                path,
                cost: sub.action.moveAp,
                dest: path[path.length - 1],
                speed: p.unit?.speed || 1.0,
                originalPos: { ...p.position }
            });
        }
    }
  });

  // Group by Destination to detect collisions
  const destMap = new Map<string, MoveRequest[]>();
  
  moves.forEach(m => {
    const key = `${m.dest.x},${m.dest.y}`;
    if (!destMap.has(key)) destMap.set(key, []);
    destMap.get(key)!.push(m);
  });

  // Resolve Moves
  destMap.forEach((requests, key) => {
      if (requests.length === 1) {
          // Success
          const req = requests[0];
          req.player.position = req.dest;
          logs.push({ 
            attackerId: req.player.id, 
            type: ActionType.MOVE, 
            resultMessage: `MANEUVERED TO (${req.dest.x}, ${req.dest.y})`,
            apSpent: req.cost
          });
      } else {
          // CONFLICT!
          requests.sort((a, b) => b.speed - a.speed);
          
          const winner = requests[0];
          const runnerUp = requests[1];

          // Check for Speed Tie
          if (winner.speed === runnerUp.speed) {
             // CRASH! Both bounce back.
             requests.forEach(r => {
                 // Bounce back to previous tile in path (or original pos if path len 1)
                 const bouncePos = r.path.length > 1 ? r.path[r.path.length - 2] : r.originalPos;
                 r.player.position = bouncePos;
                 r.player.hp -= COLLISION_DAMAGE; // Collision Damage
                 
                 logs.push({
                    attackerId: r.player.id,
                    type: ActionType.COLLISION,
                    resultMessage: `COLLISION! BOUNCED TO (${bouncePos.x}, ${bouncePos.y})`,
                    damage: COLLISION_DAMAGE
                 });
             });
          } else {
             // Winner takes tile
             winner.player.position = winner.dest;
             logs.push({ 
                attackerId: winner.player.id, 
                type: ActionType.MOVE, 
                resultMessage: `SECURED POSITION (${winner.dest.x}, ${winner.dest.y})`
             });

             // Losers get bumped
             for (let i = 1; i < requests.length; i++) {
                 const loser = requests[i];
                 const bouncePos = loser.path.length > 1 ? loser.path[loser.path.length - 2] : loser.originalPos;
                 loser.player.position = bouncePos;
                 
                 // Penalty: Lose the AP spent on move, get stuck in bad spot
                 logs.push({
                    attackerId: loser.player.id,
                    type: ActionType.COLLISION,
                    resultMessage: `OUTPACED! BUMPED TO (${bouncePos.x}, ${bouncePos.y})`
                 });
             }
          }
      }
  });

  // Apply Terrain Effects (Post-Movement)
  nextPlayers.forEach(p => {
      if (p.isEliminated) return;
      const tile = gridMap.tiles[p.position.y][p.position.x];
      
      if (tile === TileType.TOXIC) {
        p.hp -= 50;
        logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: "TOXIC TERRAIN: -50 HP" });
      }

      if (tile === TileType.THRESHOLD) {
         p.captureTurns = (p.captureTurns || 0) + 1;
         logs.push({ 
            attackerId: p.id, 
            type: ActionType.CAPTURE, 
            resultMessage: `THRESHOLD SECURED (${p.captureTurns}/${THRESHOLD_WIN_TURNS})` 
         });
      } else {
         p.captureTurns = 0;
      }
  });

  // --- Step 4: Combat Resolution (Range, LOS, Cover) ---
  interface Attack { attackerId: string; targetId: string; tier: number; speed: number; }
  const attacks: Attack[] = [];
  
  submissions.forEach(s => {
    if (s.action.attackAp > 0 && s.action.targetId && !s.action.isDesperation) {
      const p = nextPlayers.find(x => x.id === s.playerId)!;
      attacks.push({ 
        attackerId: p.id, 
        targetId: s.action.targetId, 
        tier: s.action.attackAp, 
        speed: p.unit?.speed || 1.0 
      });
    }
  });
  
  attacks.sort((a, b) => b.speed - a.speed);

  attacks.forEach(att => {
    const attacker = nextPlayers.find(p => p.id === att.attackerId)!;
    const target = nextPlayers.find(p => p.id === att.targetId)!;
    
    if (attacker.hp <= 0 && attacker.unit?.type !== UnitType.REAPER) return;
    
    const attackerSub = submissions.find(s => s.playerId === attacker.id);
    const movePath = attackerSub?.action.movePath || [];
    
    // HIT AND RUN: Check all points in the path
    const possibleFiringPoints = [...movePath, attacker.position];
    
    let bestMult = 0;
    let bestDist = 99;
    let validShotFound = false;
    let isCoveredShot = false;

    const unitRange = attacker.unit?.range || 2;
    const unitType = attacker.unit?.type;

    for (const firingPos of possibleFiringPoints) {
       const dist = getManhattanDistance(firingPos, target.position);
       
       // 1. RANGE CHECK
       if (dist > unitRange) continue;

       // 2. LINE OF SIGHT CHECK (Raycast)
       const obstacles = getObstaclesInLine(firingPos, target.position, gridMap);
       let allowedObstacles = 0;
       
       // Trojan Exception: Penetrates 1 wall
       if (unitType === UnitType.TROJAN) allowedObstacles = 1;
       // Ghost Level 3 Exception: Curves around 1 wall
       if (unitType === UnitType.GHOST && att.tier === 3) allowedObstacles = 1;

       if (obstacles > allowedObstacles) continue;

       // If we reached here, it's a valid shot
       validShotFound = true;
       
       // 3. COVER CHECK
       const hasCover = getCoverStatus(firingPos, target.position, gridMap);

       // Calculate Multiplier based on distance
       let rangeMult = 1.0;
       if (dist <= 1) rangeMult = 1.25; // Point blank bonus
       
       // Store best shot
       if (rangeMult > bestMult) {
          bestMult = rangeMult;
          bestDist = dist;
          isCoveredShot = hasCover; // We take the cover status of the best shot
       }
    }

    if (!validShotFound) {
      logs.push({ attackerId: attacker.id, targetId: target.id, type: ActionType.ATTACK, resultMessage: "TARGET OUT OF RANGE / LOS BLOCKED" });
      return;
    }

    const atkConfig = (ATTACK_CONFIG as any)[att.tier];
    const unitAtkStat = attacker.unit?.atkStat || 1.0;
    
    // Threshold Bonus: +10% Damage if attacker is on threshold
    const tile = gridMap.tiles[attacker.position.y][attacker.position.x];
    const thresholdBonus = (tile === TileType.THRESHOLD) ? 1.10 : 1.0;

    // Calculate Damage
    const rawDmg = BASE_ATTACK_DMG * atkConfig.mult * unitAtkStat * bestMult * thresholdBonus * (attacker.isAI ? enemyDmgMult : 1);
    const damage = Math.floor(rawDmg);

    // Defense Calculation
    const targetSub = submissions.find(s => s.playerId === target.id);
    const blockTier = targetSub?.action.blockAp || 0;
    
    let shield = 0;
    let overheatPenalty = 0;

    if (blockTier > 0) {
       const blockConfig = (BLOCK_CONFIG as any)[blockTier];
       const baseShield = blockConfig.base * (target.unit?.defStat || 1.0);
       const stacks = target.blockFatigue || 0; 
       overheatPenalty = Math.min(0.9, stacks * 0.15); 
       
       // Cover Bonus: +20% Shield Efficiency
       const coverBonus = isCoveredShot ? 0.2 : 0;
       
       // Close Range Penalty: -20% Shield (Offset by cover if applicable)
       const closePenalty = (bestDist <= 1) ? 0.2 : 0;

       // Threshold Malus: -15% Defense if target is on threshold (Higher risk)
       const targetTile = gridMap.tiles[target.position.y][target.position.x];
       const thresholdMalus = (targetTile === TileType.THRESHOLD) ? 0.15 : 0;
       
       shield = Math.floor(baseShield * (1 - overheatPenalty - closePenalty - thresholdMalus + coverBonus));
    }

    // Aegis Ability
    let abilityMitigation = 0;
    if (target.unit?.type === UnitType.AEGIS && target.isAbilityActive && !target.desperationUsed) {
        abilityMitigation = Math.floor(damage * 0.8);
    }

    let finalDmg = Math.max(0, damage - shield - abilityMitigation);
    target.hp -= finalDmg;

    // Log Construction
    let resultMsg = `HIT: ${finalDmg}`;
    if (shield > 0 && finalDmg === 0) resultMsg = `BLOCKED (${shield})`;
    else if (shield > 0) resultMsg = `BROKE SHIELD: ${finalDmg} DMG`;
    
    if (isCoveredShot) resultMsg += " [COVERED]";
    if (thresholdBonus > 1.0) resultMsg += " [POWER]";

    const mathStr = `[BASE:${BASE_ATTACK_DMG} × TIER:${atkConfig.mult} × ATK:${unitAtkStat.toFixed(1)}] = ${damage} - [SHIELD:${shield}] = ${finalDmg}`;

    logs.push({ 
       attackerId: attacker.id, 
       targetId: target.id, 
       type: ActionType.ATTACK, 
       damage: finalDmg, 
       resultMessage: resultMsg, 
       mathDetails: mathStr,
       defenseTier: blockTier,
       shield: shield
    });
  });

  // --- Step 5: Decay ---
  nextPlayers.forEach(p => {
    if (p.isEliminated) return;
    p.statuses.forEach(s => {
      if (s.type === 'BURN') { p.hp -= 50; logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: "BURN: -50 HP" }); }
      s.duration--;
    });
    p.statuses = p.statuses.filter(s => s.duration > 0);
    if (p.hp <= 0) p.isEliminated = true;
    else {
      p.ap = calculateIncome(p.ap, currentRound + 1, difficulty === DifficultyLevel.BLACKOUT ? 6 : difficulty === DifficultyLevel.OVERCLOCK ? 8 : 10);
      p.isAbilityActive = false; 
    }
  });

  return { nextPlayers, logs, nextRound: currentRound + 1 };
}
