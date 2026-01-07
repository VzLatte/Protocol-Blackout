
import { Player, TurnData, ResolutionLog, ActionType, UnitType, GameMode, MoveIntent, RangeZone, DifficultyLevel, HazardType } from './types';
import { BASE_ATTACK_DMG, ATTACK_CONFIG, BLOCK_CONFIG, RANGE_NAMES } from './constants';
import { calculateIncome } from './apManager';

interface CombatResult {
  nextPlayers: Player[];
  logs: ResolutionLog[];
  nextRound: number;
  nextDistanceMatrix: Map<string, number>;
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
  hazard: HazardType = HazardType.NONE
): CombatResult {
  const nextPlayers = JSON.parse(JSON.stringify(currentPlayers)) as Player[];
  const logs: ResolutionLog[] = [];
  const nextDistanceMatrix = new Map(distanceMatrix);
  const fatigueUpdates = new Map<string, number>();

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

  // --- Step 1: Energy Accounting & Fatigue Management ---
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    
    // Init Fatigue if undefined
    if (p.moveFatigue === undefined) p.moveFatigue = 0;
    if (p.blockFatigue === undefined) p.blockFatigue = 0;

    // Calculate Dynamic Costs
    const moveCost = sub.action.moveAp > 0 ? 1 + p.moveFatigue : 0;
    
    // Resolve AP Costs from Tiers
    // @ts-ignore
    const blockCost = sub.action.blockAp > 0 ? BLOCK_CONFIG[sub.action.blockAp].ap : 0;
    // @ts-ignore
    const attackCost = sub.action.attackAp > 0 ? ATTACK_CONFIG[sub.action.attackAp].ap : 0;
    
    const totalCost = blockCost + attackCost + moveCost;
    const reserved = p.ap - totalCost;
    p.ap -= totalCost;
    
    if (reserved > 0) logs.push({ attackerId: p.id, type: ActionType.RESERVE, resultMessage: `RESERVED: ${reserved} AP` });
  });

  // --- Step 2: Fatigue Logic (Overheat & Move) ---
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;

    // Move Fatigue Logic: +1 if moved, else Reset to 0
    if (sub.action.moveAp > 0) {
      p.moveFatigue += 1;
    } else {
      p.moveFatigue = 0;
    }

    // Block Fatigue (Overheat) Logic: +1 if Blocked, else Reset to 0
    // Note: Overheat applies PENALTY based on *current* stack, then increments for *next* turn.
    // However, the rule says "Every turn you spend AP on Block, you generate 1 stack."
    if (sub.action.blockAp > 0) {
      p.blockFatigue += 1;
    } else {
      // Cooling Turn: No Block used -> Clear stacks
      if (p.blockFatigue > 0) {
        logs.push({ attackerId: p.id, type: ActionType.BLOCK, resultMessage: "SYSTEM COOLED: Overheat Reset." });
      }
      p.blockFatigue = 0;
    }
  });

  // --- Step 3: Movement Resolution ---
  submissions.filter(s => s.action.moveAp > 0 && s.action.targetId).forEach(move => {
    const mover = nextPlayers.find(p => p.id === move.playerId)!;
    const target = nextPlayers.find(p => p.id === move.action.targetId)!;
    if (mover.statuses.find(s => s.type === 'PARALYZE')) return;
    
    const pairKey = [mover.id, target.id].sort().join('-');
    const currentDist = nextDistanceMatrix.get(pairKey) ?? 1;
    const dir = move.action.moveIntent === MoveIntent.CLOSE ? -1 : 1;
    const newDist = Math.max(0, Math.min(2, currentDist + dir));
    nextDistanceMatrix.set(pairKey, newDist);
    
    if (hazard === HazardType.LAVA_FLOOR) mover.hp -= 30;
    
    logs.push({ 
      attackerId: mover.id, 
      targetId: target.id, 
      type: ActionType.MOVE, 
      resultMessage: `MOVED to ${RANGE_NAMES[newDist as keyof typeof RANGE_NAMES]}`, 
      fatigueGained: mover.moveFatigue // Log the new fatigue level
    });
  });

  // --- Step 4: Combat Resolution ---
  interface Attack { attackerId: string; targetId: string; tier: number; speed: number; }
  const attacks: Attack[] = [];
  
  submissions.forEach(s => {
    if (s.action.attackAp > 0 && s.action.targetId) {
      const p = nextPlayers.find(x => x.id === s.playerId)!;
      // attackAp maps to Tier (1, 2, 3)
      attacks.push({ 
        attackerId: p.id, 
        targetId: s.action.targetId, 
        tier: s.action.attackAp, 
        speed: p.unit?.speed || 1.0 
      });
    }
  });
  
  // Sort by Unit Speed (Higher is faster)
  attacks.sort((a, b) => b.speed - a.speed);

  attacks.forEach(att => {
    const attacker = nextPlayers.find(p => p.id === att.attackerId)!;
    const target = nextPlayers.find(p => p.id === att.targetId)!;
    
    if (attacker.hp <= 0 && attacker.unit?.type !== UnitType.REAPER) return;
    if (target.unit?.type === UnitType.GHOST && target.isAbilityActive) {
      logs.push({ attackerId: attacker.id, targetId: target.id, type: ActionType.ATTACK, resultMessage: "MISS: Target Phased." });
      return;
    }

    // Calculate Attack
    const atkConfig = (ATTACK_CONFIG as any)[att.tier];
    const range = nextDistanceMatrix.get([attacker.id, target.id].sort().join('-')) ?? 1;
    
    // Focus Modifier: Range 2 penalty reduction based on Focus stat
    const rangeMult = range === 0 ? 1.2 : range === 2 ? (0.75 + (attacker.unit?.focus || 0)) : 1.0;
    
    const rawDmg = BASE_ATTACK_DMG * atkConfig.mult * (attacker.unit?.atkStat || 1.0) * rangeMult * (attacker.isAI ? enemyDmgMult : 1);
    const damage = Math.floor(rawDmg);

    // Calculate Defense
    const targetSub = submissions.find(s => s.playerId === target.id);
    const blockTier = targetSub?.action.blockAp || 0;
    
    let shield = 0;
    let overheatPenalty = 0;

    if (blockTier > 0) {
       const blockConfig = (BLOCK_CONFIG as any)[blockTier];
       const baseShield = blockConfig.base * (target.unit?.defStat || 1.0);
       
       // Overheat Penalty: -15% per stack (Stacks were incremented in Step 2, so we use current value)
       // NOTE: Logic assumes stacks applied this turn count for this turn's penalty if strictly consecutive
       const stacks = target.blockFatigue || 0; 
       overheatPenalty = Math.min(0.9, stacks * 0.15); // Cap at 90% reduction
       shield = Math.floor(baseShield * (1 - overheatPenalty));
    }

    // Aegis Ability Override
    if (target.unit?.type === UnitType.AEGIS && target.isAbilityActive) {
        // Flat 80% mitigation
        const mitigated = Math.floor(damage * 0.8);
        const taken = damage - mitigated;
        target.hp -= taken;
        logs.push({ 
           attackerId: attacker.id, targetId: target.id, type: ActionType.ATTACK, 
           damage: taken, resultMessage: `AEGIS SHIELD: ${taken} DMG`, 
           isCracked: false 
        });
        return; 
    }

    // Resolution
    let finalDmg = Math.max(0, damage - shield);
    let isChip = false;

    // Apply Chip Damage for Tier 3 Attacks
    if (att.tier === 3 && atkConfig.chip && shield > 0) {
       const chipDmg = Math.floor(damage * atkConfig.chip);
       if (finalDmg < chipDmg) {
          finalDmg = chipDmg;
          isChip = true;
       }
    }

    target.hp -= finalDmg;

    // Log Generation
    let resultMsg = `HIT: ${finalDmg}`;
    if (shield > 0) {
       if (finalDmg === 0) resultMsg = `BLOCKED (${shield} Shield)`;
       else if (isChip) resultMsg = `CHIP DMG: ${finalDmg} (Pierced)`;
       else resultMsg = `BROKE SHIELD: ${finalDmg} DMG`;
    }
    
    if (overheatPenalty > 0 && shield > 0) {
       resultMsg += ` [OVERHEAT -${Math.round(overheatPenalty * 100)}%]`;
    }

    logs.push({ 
       attackerId: attacker.id, 
       targetId: target.id, 
       type: ActionType.ATTACK, 
       damage: finalDmg, 
       resultMessage: resultMsg, 
       isCracked: isChip || (shield > 0 && finalDmg > 0), 
       defenseTier: blockTier,
       shield: shield
    });

    if (attacker.unit?.type === UnitType.PYRUS && Math.random() < 0.2) applyStatus(target, 'BURN', 2);
  });

  // --- Step 5: Environmental & Status Decay ---
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

  return { nextPlayers, logs, nextRound: currentRound + 1, nextDistanceMatrix };
}
