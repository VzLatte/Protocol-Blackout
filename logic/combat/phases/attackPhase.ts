
import { Player, TurnData, ResolutionLog, ActionType, UnitType, DifficultyLevel, GridMap, DamageType, TileType, Position } from '../../../types';
import { BASE_ATTACK_DMG, ATTACK_CONFIG, BLOCK_CONFIG } from '../../../constants';
import { getManhattanDistance, getObstaclesInLine, getCoverStatus, isValidPos } from '../../../utils/gridLogic';

interface Attack { 
    attackerId: string; 
    targetId: string; 
    tier: number; 
    initiative: number; 
    isDesperation: boolean; 
}

export function resolveAttacks(
  players: Player[],
  submissions: TurnData[],
  logs: ResolutionLog[],
  map: GridMap,
  difficulty: DifficultyLevel
) {
  const enemyDmgMult = difficulty === DifficultyLevel.BLACKOUT ? 1.25 : difficulty === DifficultyLevel.OVERCLOCK ? 1.1 : 1.0;
  const attacks: Attack[] = [];
  
  submissions.forEach(s => {
    // Standard Attacks
    if (s.action.attackAp > 0 && s.action.targetId && !s.action.isDesperation) {
      const p = players.find(x => x.id === s.playerId)!;
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
       const p = players.find(x => x.id === s.playerId)!;
       if (p.unit?.type === UnitType.REAPER && s.action.targetId) {
           // FIX: Add speed to 999 to differentiate between multiple Reapers
           const speed = p.unit.speed || 1.0;
           attacks.push({ 
               attackerId: p.id, 
               targetId: s.action.targetId, 
               tier: 3, 
               initiative: 999 + speed, 
               isDesperation: true 
           });
       }
    }
  });
  
  // Sort by Initiative High -> Low
  attacks.sort((a, b) => b.initiative - a.initiative);

  attacks.forEach(att => {
    const attacker = players.find(p => p.id === att.attackerId)!;
    const target = players.find(p => p.id === att.targetId)!;
    
    // INITIATIVE SNAP
    if (attacker.hp <= 0 && attacker.unit?.type !== UnitType.REAPER) {
        logs.push({ attackerId: attacker.id, type: ActionType.ATTACK, resultMessage: "NEUTRALIZED BEFORE FIRING" });
        return;
    }

    // CHECK: Phased Attacker (Ghost Rule)
    // If the attacker is currently Phased (untargetable), they cannot fire out.
    const attackerPhased = attacker.statuses.some(s => s.type === 'PHASED');
    if (attackerPhased) {
        logs.push({ attackerId: attacker.id, type: ActionType.ATTACK, resultMessage: "PHASED STATE: UNABLE TO ENGAGE" });
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
    const obstaclesFinal = getObstaclesInLine(firingPos, target.position, map);
    
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
                const obsStep = getObstaclesInLine(firingPos, step, map);
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
    const hasCover = getCoverStatus(firingPos, impactPos, map);
    let rangeMult = (getManhattanDistance(firingPos, impactPos) <= 1) ? 1.25 : 1.0;
    
    // TACTICAL DEPTH: Far Range Penalty
    if (attacker.unit?.type !== UnitType.HUNTER && distFinal > 3) {
        const excess = distFinal - 3;
        rangeMult -= (excess * 0.15);
        rangeMult = Math.max(0.1, rangeMult); 
    }

    const interceptMult = hitType === 'INTERCEPT' ? (0.5 * exposureRatio) : 1.0;

    // @ts-ignore
    const atkConfig = ATTACK_CONFIG[att.tier];
    const unitAtkStat = attacker.unit?.atkStat || 1.0;
    const tile = map.tiles[attacker.position.y][attacker.position.x];
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
       // @ts-ignore
       const blockConfig = BLOCK_CONFIG[blockTier];
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
            map.tiles[impactPos.y][impactPos.x] = TileType.DEBRIS;
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
       
       if (isValidPos({x: newX, y: newY}) && map.tiles[newY][newX] !== TileType.OBSTACLE) {
          const occupied = players.some(p => p.position.x === newX && p.position.y === newY && !p.isEliminated);
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
}
