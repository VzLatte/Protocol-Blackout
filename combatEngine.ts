
import { Player, TurnData, ResolutionLog, ActionType, UnitType, GameMode, DifficultyLevel, HazardType, TileType, GridMap, Position, DamageType, ItemSlot } from './types';
import { BASE_ATTACK_DMG, ATTACK_CONFIG, BLOCK_CONFIG, TILE_BONUSES, DESPERATION_MOVES, COLLISION_DAMAGE, THRESHOLD_WIN_TURNS, BASE_MOVE_COST } from './constants';
import { calculateIncome } from './apManager';
import { getManhattanDistance, getObstaclesInLine, getCoverStatus, getStride, isValidPos } from './utils/gridLogic';

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
  
  const enemyDmgMult = difficulty === DifficultyLevel.BLACKOUT ? 1.25 : difficulty === DifficultyLevel.OVERCLOCK ? 1.1 : 1.0;

  // =========================================================================================
  // PHASE 0: DESPERATION TRIGGER (Interrupt Phase)
  // =========================================================================================
  submissions.forEach(sub => {
      if (sub.action.isDesperation) {
          const p = nextPlayers.find(x => x.id === sub.playerId)!;
          if (!p.desperationUsed && p.unit) {
              p.desperationUsed = true;
              
              // Apply Specific Desperation Effects
              switch (p.unit.type) {
                  case UnitType.GHOST:
                      // Phantom Step: Heal + Untargetable
                      p.hp = Math.min(p.maxHp, p.hp + 300);
                      p.statuses.push({ type: 'PHASED', duration: 1 });
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "PHANTOM STEP: PHASED & HEALED" });
                      break;
                  case UnitType.AEGIS:
                      // Iron Dome: 90% DR + Immovable
                      p.statuses.push({ type: 'IRON_DOME', duration: 2 });
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "IRON DOME: DAMAGE REDUCTION ACTIVE" });
                      break;
                  case UnitType.PYRUS:
                      // Solar Flare: Global Damage
                      nextPlayers.forEach(target => {
                          if (target.id !== p.id && !target.isEliminated) {
                              target.hp -= 500;
                              logs.push({ attackerId: p.id, targetId: target.id, type: ActionType.ATTACK, resultMessage: "SOLAR FLARE", damage: 500 });
                          }
                      });
                      break;
                  case UnitType.REAPER:
                      // Logic handled in attack phase via check, but log here
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "FINAL HARVEST: EXECUTION PROTOCOL READY" });
                      break;
                  case UnitType.HUNTER:
                      p.statuses.push({ type: 'APEX_PREDATOR', duration: 1 });
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "APEX PREDATOR: MULTI-STRIKE READY" });
                      break;
                  case UnitType.MEDIC:
                      p.hp = Math.min(p.maxHp, p.hp + 300);
                      p.statuses = []; // Clear negative statuses
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "BIO-SURGE: SYSTEM RESTORED" });
                      break;
              }
          }
      }
  });

  // =========================================================================================
  // PHASE 1: PREPARATION (Shields, Stims, Costs, Abilities)
  // =========================================================================================
  
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    
    // 1.1 Energy Accounting
    if (!sub.action.isDesperation) {
        const moveCost = sub.action.moveAp || 0;
        // @ts-ignore
        const blockCost = sub.action.blockAp > 0 ? BLOCK_CONFIG[sub.action.blockAp].ap : 0;
        // @ts-ignore
        const attackCost = sub.action.attackAp > 0 ? ATTACK_CONFIG[sub.action.attackAp].ap : 0;
        
        const totalCost = blockCost + attackCost + moveCost;
        const reserved = p.ap - totalCost;
        p.ap -= totalCost;
        
        if (reserved > 0) logs.push({ attackerId: p.id, type: ActionType.RESERVE, resultMessage: `RESERVED: ${reserved} AP` });

        if (sub.action.blockAp > 0) p.blockFatigue += 1;
        else p.blockFatigue = 0;
        p.moveFatigue = 0;

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
    }

    // 1.2 Status Effects
    p.statuses.forEach(s => {
      // Purify Passive (Medic) check
      if (p.unit?.type === UnitType.MEDIC) return; 

      if (s.type === 'BURN') { 
          const burnDmg = 50;
          p.hp -= burnDmg; 
          p.maxHp = Math.max(100, Math.floor(p.maxHp - (burnDmg * 0.1)));
          logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: "BURN: -50 HP" }); 
      }
      if (s.type === 'AP_BURN' && s.value) {
          p.ap = Math.max(0, p.ap - s.value);
          logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: `SYSTEM HEAT: -${s.value} AP` });
      }
      s.duration--;
    });
    p.statuses = p.statuses.filter(s => s.duration > 0);
    p.tempSpeedMod = 0; // Reset temporal mods

    // 1.3 Active Abilities
    if (sub.action.abilityActive && !p.activeUsed) {
       // ... existing ability logic ...
       if (p.unit?.type === UnitType.MEDIC) {
          const healAmt = hazard === HazardType.VIRAL_INVERSION ? -400 : 400;
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          p.activeUsed = true;
       }
    }
  });

  // =========================================================================================
  // PHASE 2: THE CLASH (Movement & Combat Resolution)
  // =========================================================================================

  // 2.1 Calculate Movement
  interface MoveRequest {
    player: Player;
    path: Position[];
    cost: number;
    dest: Position;
    speed: number;
    originalPos: Position;
    isInertia: boolean;
  }

  const moveRequests: MoveRequest[] = [];

  submissions.forEach(sub => {
    if (sub.action.moveAp > 0 && !sub.action.isDesperation) {
        const p = nextPlayers.find(x => x.id === sub.playerId)!;
        
        // Iron Dome Immovable check
        const isIronDome = p.statuses.some(s => s.type === 'IRON_DOME');
        if (isIronDome) {
             logs.push({ attackerId: p.id, type: ActionType.MOVE, resultMessage: "IRON DOME: MOVEMENT LOCKED" });
             return;
        }

        if (p.statuses.find(s => s.type === 'PARALYZE')) {
           logs.push({ attackerId: p.id, type: ActionType.MOVE, resultMessage: "PARALYZED: Movement Failed." });
           return;
        }

        const path = sub.action.movePath || (sub.action.moveDest ? [sub.action.moveDest] : []);
        if (path.length > 0) {
            const baseSpeed = p.unit?.speed || 1.0;
            const weightMod = (p.loadout?.primary?.weight || 0) * 0.1; 
            const speed = baseSpeed + weightMod + (p.tempSpeedMod || 0);
            
            moveRequests.push({
                player: p,
                path,
                cost: sub.action.moveAp,
                dest: path[path.length - 1],
                speed,
                originalPos: { ...p.position },
                isInertia: p.unit?.type === UnitType.AEGIS // Inertia Passive
            });
        }
    }
  });

  const destMap = new Map<string, MoveRequest[]>();
  moveRequests.forEach(m => {
    const key = `${m.dest.x},${m.dest.y}`;
    if (!destMap.has(key)) destMap.set(key, []);
    destMap.get(key)!.push(m);
  });

  // Resolve Collisions
  destMap.forEach((requests, key) => {
      if (requests.length === 1) {
          const req = requests[0];
          req.player.position = req.dest;
          logs.push({ 
              attackerId: req.player.id, 
              type: ActionType.MOVE, 
              resultMessage: `MANEUVERED TO (${req.dest.x}, ${req.dest.y})`, 
              apSpent: req.cost,
              path: req.path
          });
      } else {
          // BUMP / COLLISION LOGIC
          requests.sort((a, b) => {
             if (a.isInertia && !b.isInertia) return -1; // A wins
             if (!a.isInertia && b.isInertia) return 1; // B wins
             return b.speed - a.speed; // Speed Tie-breaker
          });

          const winner = requests[0];
          const runnerUp = requests[1];
          
          let tie = false;
          if (!winner.isInertia && !runnerUp.isInertia && winner.speed === runnerUp.speed) {
             tie = true;
          }

          if (tie) {
             // BOTH CRASH
             requests.forEach(req => {
                const bouncePos = req.path.length > 1 ? req.path[req.path.length - 2] : req.originalPos;
                req.player.position = bouncePos;
                const dmg = COLLISION_DAMAGE; // Updated to use Constant
                req.player.hp -= dmg;
                logs.push({ attackerId: req.player.id, type: ActionType.COLLISION, resultMessage: `HEAD-ON COLLISION! BOUNCED TO (${bouncePos.x}, ${bouncePos.y}) -${dmg} HP` });
             });
          } else {
             // WINNER TAKES TILE
             winner.player.position = winner.dest;
             logs.push({ attackerId: winner.player.id, type: ActionType.MOVE, resultMessage: `SECURED POSITION (${winner.dest.x}, ${winner.dest.y})`, path: winner.path });
             
             // LOSERS DISPLACED & DAMAGED
             for (let i = 1; i < requests.length; i++) {
                 const loser = requests[i];
                 const bouncePos = loser.path.length > 1 ? loser.path[loser.path.length - 2] : loser.originalPos;
                 loser.player.position = bouncePos;
                 loser.player.hp -= COLLISION_DAMAGE; // Applied Damage
                 logs.push({ attackerId: loser.player.id, type: ActionType.COLLISION, resultMessage: `DISPLACED BY ${winner.player.name}! -${COLLISION_DAMAGE} HP` });
             }
          }
      }
  });

  // 2.3 Resolve Gunfire (INITIATIVE SNAP & TRIANGLE)
  interface Attack { attackerId: string; targetId: string; tier: number; initiative: number; isDesperation: boolean; }
  const attacks: Attack[] = [];
  
  submissions.forEach(s => {
    // Standard Attacks
    if (s.action.attackAp > 0 && s.action.targetId && !s.action.isDesperation) {
      const p = nextPlayers.find(x => x.id === s.playerId)!;
      // @ts-ignore
      const tierMod = ATTACK_CONFIG[s.action.attackAp].speedMod || 0;
      let initiative = (p.unit?.speed || 1) + tierMod;
      
      // STEADY AIM PASSIVE
      if (!s.action.moveAp || s.action.moveAp === 0) {
          initiative += 0.4;
      }
      
      attacks.push({ attackerId: p.id, targetId: s.action.targetId, tier: s.action.attackAp, initiative, isDesperation: false });
    }
    
    // Desperation Attacks (Reaper Execution)
    if (s.action.isDesperation) {
       const p = nextPlayers.find(x => x.id === s.playerId)!;
       if (p.unit?.type === UnitType.REAPER && s.action.targetId) {
           // Reaper Desperation is an Attack
           attacks.push({ attackerId: p.id, targetId: s.action.targetId, tier: 3, initiative: 999, isDesperation: true });
       }
    }
  });
  
  // Sort by Initiative High -> Low
  attacks.sort((a, b) => b.initiative - a.initiative);

  attacks.forEach(att => {
    const attacker = nextPlayers.find(p => p.id === att.attackerId)!;
    const target = nextPlayers.find(p => p.id === att.targetId)!;
    
    // INITIATIVE SNAP
    if (attacker.hp <= 0 && attacker.unit?.type !== UnitType.REAPER) {
        logs.push({ attackerId: attacker.id, type: ActionType.ATTACK, resultMessage: "NEUTRALIZED BEFORE FIRING" });
        return;
    }
    
    // GHOST VS REAPER (Phase Shift Check)
    const isPhased = target.statuses.some(s => s.type === 'PHASED');
    if (isPhased) {
        logs.push({ attackerId: attacker.id, targetId: target.id, type: ActionType.ATTACK, resultMessage: "TARGET PHASED // ATTACK PASSED THROUGH" });
        return;
    }
    
    const firingPos = attacker.position;
    const unitRange = attacker.loadout?.primary?.range ?? (attacker.unit?.range || 2);
    const damageType = attacker.loadout?.primary?.damageType ?? DamageType.KINETIC;

    // --- HIT & EXPOSURE ---
    let hitType: 'NONE' | 'CLEAN' | 'INTERCEPT' = 'NONE';
    let impactPos = target.position;
    let exposureRatio = 0;

    const distFinal = getManhattanDistance(firingPos, target.position);
    const obstaclesFinal = getObstaclesInLine(firingPos, target.position, nextMap);
    
    if (distFinal <= unitRange && obstaclesFinal === 0) {
        hitType = 'CLEAN';
    } else {
        const targetSub = submissions.find(s => s.playerId === target.id);
        const targetPath = targetSub?.action.movePath || [];
        // Fortress Shield ignores Interception
        // @ts-ignore
        const isFortress = targetSub?.action.blockAp === 3;

        if (targetPath.length > 0 && !isFortress) {
            let exposedTiles = 0;
            let firstExposedPos: Position | null = null;
            targetPath.forEach(step => {
                const distStep = getManhattanDistance(firingPos, step);
                const obsStep = getObstaclesInLine(firingPos, step, nextMap);
                if (distStep <= unitRange && obsStep === 0) {
                    exposedTiles++;
                    if (!firstExposedPos) firstExposedPos = step;
                }
            });
            if (exposedTiles > 0) {
                hitType = 'INTERCEPT';
                exposureRatio = exposedTiles / targetPath.length;
                impactPos = firstExposedPos || targetPath[0];
            }
        }
    }

    if (hitType === 'NONE') {
      logs.push({ attackerId: attacker.id, targetId: target.id, type: ActionType.ATTACK, resultMessage: "TARGET EVADED / NO LOS", originPoint: firingPos });
      return;
    }

    // --- DAMAGE CALCULATION ---
    const hasCover = getCoverStatus(firingPos, impactPos, nextMap);
    let rangeMult = (getManhattanDistance(firingPos, impactPos) <= 1) ? 1.25 : 1.0;
    
    // TACTICAL DEPTH: Far Range Penalty
    // -15% damage for every tile beyond 3 (unless Hunter)
    if (attacker.unit?.type !== UnitType.HUNTER && distFinal > 3) {
        const excess = distFinal - 3;
        rangeMult -= (excess * 0.15);
        rangeMult = Math.max(0.1, rangeMult); // Min 10% damage
    }

    const interceptMult = hitType === 'INTERCEPT' ? (0.5 * exposureRatio) : 1.0;

    const atkConfig = (ATTACK_CONFIG as any)[att.tier];
    const unitAtkStat = attacker.unit?.atkStat || 1.0;
    const tile = nextMap.tiles[attacker.position.y][attacker.position.x];
    const thresholdBonus = (tile === TileType.THRESHOLD) ? 1.10 : 1.0;

    let rawDmg = BASE_ATTACK_DMG * atkConfig.mult * unitAtkStat * rangeMult * thresholdBonus * interceptMult * (attacker.isAI ? enemyDmgMult : 1);
    
    // REAPER EXECUTE LOGIC
    if (att.isDesperation && attacker.unit?.type === UnitType.REAPER) {
        if (target.hp < (target.maxHp * 0.3)) {
            rawDmg = 9999; // Execute
        } else {
            rawDmg = BASE_ATTACK_DMG * 6.0;
        }
    }

    // HUNTER MULTI-STRIKE (Apex Predator)
    const isApex = attacker.statuses.some(s => s.type === 'APEX_PREDATOR');
    if (isApex) {
        rawDmg *= 3;
    }

    const damage = Math.floor(rawDmg);

    // Defense Logic
    const targetSub = submissions.find(s => s.playerId === target.id);
    const blockTier = targetSub?.action.blockAp || 0;
    
    let shield = 0;
    let pushBack = false;

    if (blockTier > 0) {
       const blockConfig = (BLOCK_CONFIG as any)[blockTier];
       const baseShield = blockConfig.base * (target.unit?.defStat || 1.0);
       const stacks = target.blockFatigue || 0; 
       const overheatPenalty = Math.min(0.9, stacks * 0.15); 
       
       const coverVal = blockTier === 2 ? 0.4 : 0.2;
       const coverBonus = hasCover ? coverVal : 0;
       const distImpact = getManhattanDistance(firingPos, impactPos);
       const closePenalty = (distImpact <= 1) ? 0.2 : 0;
       
       shield = Math.floor(baseShield * (1 - overheatPenalty - closePenalty + coverBonus));

       if (target.unit?.type === UnitType.AEGIS && blockTier === 3 && distImpact <= 1) {
          pushBack = true;
       }
    }

    // --- REFINED DAMAGE TYPES ---
    let finalDmg = 0;
    let messageExtra = "";

    if (damageType === DamageType.KINETIC) {
        if (shield > 0) {
            finalDmg = Math.max(0, damage - shield);
        } else {
            finalDmg = damage * 1.2; 
            messageExtra = " [CRIT]";
        }
    } 
    else if (damageType === DamageType.ENERGY) {
        const dmgToShield = damage * 1.2;
        let remainingShield = shield - dmgToShield;
        
        if (remainingShield >= 0) {
            finalDmg = 0;
            messageExtra = " [SHIELD HIT]";
        } else {
            const overflow = Math.abs(remainingShield);
            finalDmg = overflow * 0.66;
            messageExtra = " [BREACH]";
        }
    } 
    else if (damageType === DamageType.EXPLOSIVE) {
        const explosiveRaw = damage * 0.9;
        finalDmg = Math.max(0, explosiveRaw - shield);
        if (att.tier === 3) {
            nextMap.tiles[impactPos.y][impactPos.x] = TileType.DEBRIS;
            messageExtra += " [TERRAIN DESTROYED]";
        }
    }

    // AEGIS IRON DOME (Desperation Buff) - 90% DR
    const hasIronDome = target.statuses.some(s => s.type === 'IRON_DOME');
    if (hasIronDome) {
        finalDmg = Math.floor(finalDmg * 0.1);
        messageExtra += " [DOME MITIGATION]";
    }

    finalDmg = Math.floor(finalDmg);
    target.hp -= finalDmg;

    // --- PUSH BACK RESOLUTION ---
    if (pushBack) {
       const dx = attacker.position.x - target.position.x;
       const dy = attacker.position.y - target.position.y;
       const moveX = Math.sign(dx);
       const moveY = Math.sign(dy);
       const newX = attacker.position.x + moveX;
       const newY = attacker.position.y + moveY;
       
       if (isValidPos({x: newX, y: newY}) && nextMap.tiles[newY][newX] !== TileType.OBSTACLE) {
          const occupied = nextPlayers.some(p => p.position.x === newX && p.position.y === newY && !p.isEliminated);
          if (!occupied) {
             attacker.position = {x: newX, y: newY};
             logs.push({ attackerId: target.id, type: ActionType.BLOCK, resultMessage: `REFLECTIVE GUARD: ${attacker.name} PUSHED BACK!` });
          }
       }
    }

    if (finalDmg > 0) {
        let traumaFactor = 0.20; 
        if (shield > 0) traumaFactor = 0.05; 
        const trauma = Math.floor(finalDmg * traumaFactor);
        target.maxHp = Math.max(100, target.maxHp - trauma);
    }

    let resultType = hitType === 'INTERCEPT' ? "INTERCEPTED" : "HIT";
    let resultMsg = `${resultType}: ${finalDmg}${messageExtra}`;
    
    if (shield > 0 && finalDmg === 0) resultMsg = `BLOCKED (${shield})`;
    else if (shield > 0 && finalDmg > 0) resultMsg = `SHIELD BROKEN: ${finalDmg}${messageExtra}`;

    if (hitType === 'INTERCEPT') {
        const pct = Math.round(exposureRatio * 100);
        resultMsg += ` (${pct}% EXPOSURE)`;
    }

    const mathStr = `[${damageType}] ${Math.floor(rawDmg)} vs ${shield} Shield (Init: ${att.initiative.toFixed(1)})`;

    logs.push({ 
       attackerId: attacker.id, 
       targetId: target.id, 
       type: hitType === 'INTERCEPT' ? ActionType.INTERCEPT : ActionType.ATTACK, 
       damage: finalDmg, 
       resultMessage: resultMsg, 
       mathDetails: mathStr,
       defenseTier: blockTier,
       shield: shield,
       damageType: damageType,
       impactPoint: impactPos,
       originPoint: firingPos
    });
  });

  // =========================================================================================
  // PHASE 3: AFTERMATH (Decay, Hazards, Income, Capture)
  // =========================================================================================
  
  // 3.1 CAPTURE ZONE LOGIC
  const playersOnThreshold = nextPlayers.filter(p => !p.isEliminated && nextMap.tiles[p.position.y][p.position.x] === TileType.THRESHOLD);
  
  if (playersOnThreshold.length > 0) {
      const hasHuman = playersOnThreshold.some(p => !p.isAI);
      const hasAI = playersOnThreshold.some(p => p.isAI);
      
      if (hasHuman && hasAI) {
          playersOnThreshold.forEach(p => p.captureTurns = 0);
          logs.push({ attackerId: 'SYSTEM', type: ActionType.CAPTURE, resultMessage: "ZONE CONTESTED: PROGRESS RESET" });
      } else {
          playersOnThreshold.forEach(p => {
              // Aegis Iron Dome cannot capture
              const isIronDome = p.statuses.some(s => s.type === 'IRON_DOME');
              if (!isIronDome) {
                  p.captureTurns = (p.captureTurns || 0) + 1;
                  logs.push({ attackerId: p.id, type: ActionType.CAPTURE, resultMessage: `THRESHOLD SECURED (${p.captureTurns})` });
              } else {
                  logs.push({ attackerId: p.id, type: ActionType.CAPTURE, resultMessage: "IRON DOME ACTIVE: CAPTURE HALTED" });
              }
          });
      }
  }

  // 3.2 HAZARD TICKS (Phase 4 Logic)
  nextPlayers.forEach(p => {
    if (p.isEliminated) return;
    
    // Check for Medic Purify
    if (p.unit?.type === UnitType.MEDIC) return;

    // Environmental Hazards
    if (hazard === HazardType.LAVA_FLOOR) {
        const sub = submissions.find(s => s.playerId === p.id);
        if (sub && sub.action.moveAp && sub.action.moveAp > 0) {
            p.hp -= 50;
            logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: "LAVA FLOOR: -50 HP (MOVING)" });
        }
    }
    if (hazard === HazardType.GRAVITY_WELL) {
        const crushDmg = Math.floor(p.hp * 0.1);
        p.hp -= crushDmg;
        logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: `GRAVITY CRUSH: -${crushDmg} HP` });
    }
    if (hazard === HazardType.DATA_STORM) {
        p.ap = Math.max(0, p.ap - 5);
        logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: "DATA STORM: -5 AP" });
    }

    const tile = nextMap.tiles[p.position.y][p.position.x];
    if (tile === TileType.TOXIC) { p.hp -= 50; p.maxHp -= 10; logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: "TOXIC: -50 HP" }); }
    
    if (p.hp <= 0) p.isEliminated = true;
    else {
      // 50 AP INCOME LOGIC (Fixed for AI)
      let difficultyCap = 50;
      if (!p.isAI) {
          // Humans get capped by difficulty
          difficultyCap = difficulty === DifficultyLevel.BLACKOUT ? 30 : difficulty === DifficultyLevel.OVERCLOCK ? 40 : 50;
      } else {
          // AI gets Bonus on Harder difficulties (or at least standard 50)
          difficultyCap = 50; 
      }

      const { total, vented } = calculateIncome(p.ap, currentRound + 1, difficultyCap);
      p.ap = total;
      if (vented > 0) {
          logs.push({ attackerId: p.id, type: ActionType.VENT, resultMessage: `SYSTEM OVERHEAT: ${vented} AP VENTED` });
      }
      p.isAbilityActive = false; 
    }
  });

  return { nextPlayers, logs, nextRound: currentRound + 1, nextMap };
}
