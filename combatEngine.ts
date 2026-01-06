
import { Player, TurnData, ResolutionLog, ActionType, UnitType, GameMode, MoveIntent, RangeZone, StatusEffect, DifficultyLevel, HazardType } from './types';
import { BASE_ATTACK_DMG, ACTION_COSTS, DEFENSE_CONFIG, RANGE_VALUES, RANGE_NAMES } from './constants';
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
  const fatigueGainAdd = difficulty === DifficultyLevel.BLACKOUT ? 2 : difficulty === DifficultyLevel.OVERCLOCK ? 1 : 0;

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

  // --- Step 1: Energy Accounting ---
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    const moveCost = (ACTION_COSTS[ActionType.MOVE] + (p.fatigue || 0)) * (hazard === HazardType.GRAVITY_WELL ? 2 : 1);
    const cost = (sub.action.blockAp * ACTION_COSTS[ActionType.BLOCK]) + 
                 (sub.action.attackAp * ACTION_COSTS[ActionType.ATTACK]) +
                 (sub.action.moveAp * moveCost);
    const reserved = p.ap - cost;
    p.ap -= cost;
    if (reserved > 0) logs.push({ attackerId: p.id, type: ActionType.RESERVE, resultMessage: `RESERVED: ${reserved} AP` });
  });

  // --- Step 2: Movement Resolution ---
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
    logs.push({ attackerId: mover.id, targetId: target.id, type: ActionType.MOVE, resultMessage: `MOVED to ${RANGE_NAMES[newDist as keyof typeof RANGE_NAMES]}`, fatigueGained: 1 + fatigueGainAdd });
    fatigueUpdates.set(mover.id, (fatigueUpdates.get(mover.id) || 0) + 1 + fatigueGainAdd);
  });

  fatigueUpdates.forEach((val, id) => { const p = nextPlayers.find(x => x.id === id); if(p) p.fatigue += val; });

  // --- Step 3: Combat (Speed Initiative) ---
  interface Attack { attackerId: string; targetId: string; ap: number; speed: number; }
  const attacks: Attack[] = [];
  submissions.forEach(s => {
    if (s.action.attackAp > 0 && s.action.targetId) {
      const p = nextPlayers.find(x => x.id === s.playerId)!;
      attacks.push({ attackerId: p.id, targetId: s.action.targetId, ap: s.action.attackAp, speed: p.unit?.speed || 5 });
    }
  });
  attacks.sort((a, b) => b.speed - a.speed);

  attacks.forEach(att => {
    const attacker = nextPlayers.find(p => p.id === att.attackerId)!;
    const target = nextPlayers.find(p => p.id === att.targetId)!;
    if (attacker.hp <= 0 && attacker.unit?.type !== UnitType.REAPER) return;
    if (target.unit?.type === UnitType.GHOST && target.isAbilityActive) {
      logs.push({ attackerId: attacker.id, targetId: target.id, type: ActionType.ATTACK, resultMessage: "MISS: Target Phased." });
      return;
    }

    const range = nextDistanceMatrix.get([attacker.id, target.id].sort().join('-')) ?? 1;
    const rangeMult = range === 0 ? 1.2 : range === 2 ? (0.75 + (attacker.unit?.focus || 0)/100) : 1.0;
    let dmg = Math.floor(BASE_ATTACK_DMG * att.ap * (attacker.unit?.dmgMultiplier || 1) * rangeMult * (attacker.isAI ? enemyDmgMult : 1));

    const tier = submissions.find(s => s.playerId === target.id)?.action.blockAp || 0;
    const config = (DEFENSE_CONFIG as any)[tier] || { mitigation: 0, threshold: 0 };
    const tempDmg = (target as any)._turnDmg || 0;
    const cracked = tempDmg > config.threshold && tier > 0;
    let mitigation = cracked ? (config.crackedMitigation || 0.1) : config.mitigation;
    if (target.unit?.type === UnitType.AEGIS && target.isAbilityActive) mitigation = 0.8;
    
    const finalDmg = Math.floor(dmg * (1 - mitigation));
    target.hp -= finalDmg;
    (target as any)._turnDmg = tempDmg + finalDmg;

    logs.push({ attackerId: attacker.id, targetId: target.id, type: ActionType.ATTACK, damage: finalDmg, resultMessage: `IMPACT: ${finalDmg} DMG`, isCracked: cracked, mitigationPercent: mitigation, defenseTier: tier });
    if (attacker.unit?.type === UnitType.PYRUS && Math.random() < 0.2) applyStatus(target, 'BURN', 2);
  });

  // --- Step 4: Environmental & Status Decay ---
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
      if (difficulty !== DifficultyLevel.BLACKOUT) p.fatigue = Math.max(0, p.fatigue - 1);
      p.isAbilityActive = false;
      delete (p as any)._turnDmg;
    }
  });

  return { nextPlayers, logs, nextRound: currentRound + 1, nextDistanceMatrix };
}
