
import { Player, TurnData, ResolutionLog, ActionType, UnitType, GameMode, MoveIntent, RangeZone, StatusEffect } from './types';
import { BASE_ATTACK_DMG, ACTION_COSTS, DEFENSE_CONFIG, RANGE_VALUES, RANGE_NAMES } from './constants';
import { calculateIncome } from './apManager';

interface CombatResult {
  nextPlayers: Player[];
  logs: ResolutionLog[];
  nextRound: number;
  nextDistanceMatrix: Map<string, number>;
}

export function resolveCombat(
  currentPlayers: Player[],
  submissions: TurnData[],
  currentRound: number,
  maxRounds: number,
  mode: GameMode,
  activeChaosEvent: any,
  distanceMatrix: Map<string, number>
): CombatResult {
  const nextPlayers = JSON.parse(JSON.stringify(currentPlayers)) as Player[];
  const logs: ResolutionLog[] = [];
  const nextDistanceMatrix = new Map(distanceMatrix);
  const fatigueUpdates = new Map<string, number>();

  // --- Step 0: Pre-Combat Ability Triggers (Self-Buffs/Healing/Marking) ---
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    if (sub.action.abilityActive && !p.activeUsed) {
      if (p.unit?.type === UnitType.BATTERY) {
        p.ap += 4;
        p.hp -= 100;
        p.activeUsed = true;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "OVERCHARGE_ACTIVE: +4 AP // SYSTEM_STRAIN: -100 HP" });
      } else if (p.unit?.type === UnitType.MEDIC) {
        p.hp = Math.min(p.maxHp, p.hp + 400);
        p.activeUsed = true;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "EMERGENCY_PATCH_SUCCESS: +400 HP RECOVERED" });
      } else if (p.unit?.type === UnitType.HUNTER && sub.action.targetId) {
        p.targetLockId = sub.action.targetId;
        p.activeUsed = true;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: `TARGET_LOCKED: ${nextPlayers.find(x => x.id === sub.action.targetId)?.name}` });
      } else if (p.unit?.type === UnitType.TROJAN) {
        p.overclockTurns = 3;
        p.activeUsed = true;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "OVERCLOCK_INITIATED: SHIELD_PIERCE_ENABLED" });
      } else if (p.unit?.type === UnitType.LEECH) {
        // Handled in damage step for lifesteal rate, but log activation here
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "SIPHON_SOUL_ARMED: 100% LIFESTEAL" });
      }
    }
  });

  // --- Step 1: AP Deduction & Costing & Reservation Logging ---
  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    const moveCost = ACTION_COSTS[ActionType.MOVE] + (p.fatigue || 0);
    const cost = (sub.action.blockAp * ACTION_COSTS[ActionType.BLOCK]) + 
                 (sub.action.attackAp * ACTION_COSTS[ActionType.ATTACK]) +
                 (sub.action.moveAp * moveCost);
                 
    const reserved = p.ap - cost;
    p.ap -= cost;
    p.totalReservedAp += Math.max(0, reserved);

    if (reserved > 0) {
      logs.push({ 
        attackerId: p.id, 
        type: ActionType.RESERVE, 
        apSpent: 0, 
        resultMessage: `ENERGY_RESERVED: +${reserved} AP STORED` 
      });
    }

    // Python Neural Paralysis check for targets
    const paralyzer = submissions.find(s => s.action.abilityActive && nextPlayers.find(np => np.id === s.playerId)?.unit?.type === UnitType.PYTHON && s.action.targetId === p.id);
    if (paralyzer && reserved > 0) {
      p.ap -= reserved; // Force lose reserved AP
      logs.push({ attackerId: paralyzer.playerId, targetId: p.id, type: ActionType.PHASE, resultMessage: "NEURAL_PARALYSIS: UNSPENT_AP_PURGED" });
    }
  });

  // --- Step 2: Movement Resolution ---
  const movers = submissions.filter(s => s.action.moveAp > 0 && s.action.targetId);
  const handledMoves = new Set<string>();

  movers.forEach(move => {
     if (handledMoves.has(move.playerId)) return;
     const mover = nextPlayers.find(p => p.id === move.playerId)!;
     const target = nextPlayers.find(p => p.id === move.action.targetId)!;
     const targetMove = movers.find(m => m.playerId === target.id && m.action.targetId === mover.id);

     const pairKey = [mover.id, target.id].sort().join('-');
     let currentDist = nextDistanceMatrix.get(pairKey) ?? 1;

     if (targetMove) {
        handledMoves.add(mover.id); handledMoves.add(target.id);
        if (move.action.moveIntent === targetMove.action.moveIntent) {
            const dir = move.action.moveIntent === MoveIntent.CLOSE ? -1 : 1;
            const newDist = Math.max(0, Math.min(2, currentDist + dir));
            nextDistanceMatrix.set(pairKey, newDist);
            logs.push({ attackerId: mover.id, targetId: target.id, type: ActionType.MOVE, resultMessage: `MUTUAL_MANEUVER: ${mover.name} & ${target.name}`, rangeChange: `${RANGE_NAMES[currentDist]} -> ${RANGE_NAMES[newDist]}` });
            fatigueUpdates.set(mover.id, 1); fatigueUpdates.set(target.id, 1);
        } else {
             const mSpd = mover.unit?.speed || 5; const tSpd = target.unit?.speed || 5;
             if (Math.abs(mSpd - tSpd) < 2) {
                logs.push({ attackerId: "SYSTEM", type: ActionType.MOVE, resultMessage: `MOVEMENT_STALEMATE: ${mover.name} vs ${target.name}` });
                fatigueUpdates.set(mover.id, 2); fatigueUpdates.set(target.id, 2);
             } else {
                const winner = mSpd > tSpd ? mover : target; const wMove = mSpd > tSpd ? move : targetMove;
                const dir = wMove.action.moveIntent === MoveIntent.CLOSE ? -1 : 1;
                const newDist = Math.max(0, Math.min(2, currentDist + dir));
                nextDistanceMatrix.set(pairKey, newDist);
                logs.push({ attackerId: winner.id, type: ActionType.MOVE, resultMessage: `SPEED_CHECK_WON`, rangeChange: `${RANGE_NAMES[currentDist]} -> ${RANGE_NAMES[newDist]}` });
                fatigueUpdates.set(mover.id, 1); fatigueUpdates.set(target.id, 2);
             }
        }
     } else {
        handledMoves.add(mover.id);
        const dir = move.action.moveIntent === MoveIntent.CLOSE ? -1 : 1;
        const newDist = Math.max(0, Math.min(2, currentDist + dir));
        nextDistanceMatrix.set(pairKey, newDist);
        logs.push({ attackerId: mover.id, targetId: target.id, type: ActionType.MOVE, resultMessage: `MANEUVER_SUCCESS vs ${target.name}`, rangeChange: `${RANGE_NAMES[currentDist]} -> ${RANGE_NAMES[newDist]}` });
        fatigueUpdates.set(mover.id, 1);
     }
  });

  // Apply Fatigue Updates
  fatigueUpdates.forEach((value, id) => {
    const p = nextPlayers.find(x => x.id === id);
    if (p) p.fatigue = (p.fatigue || 0) + value;
  });

  // --- Step 3: Offense Logic ---
  const incomingDmg = new Map<string, number>();
  const attackMap: Array<{ attackerId: string, targetId: string, dmg: number, isShieldPierce: boolean }> = [];

  submissions.forEach(sub => {
    const p = nextPlayers.find(x => x.id === sub.playerId)!;
    
    // Ghost Check
    if (p.unit?.type === UnitType.GHOST && sub.action.abilityActive) {
      if (sub.action.attackAp > 0) {
        logs.push({ attackerId: p.id, type: ActionType.ATTACK, resultMessage: "GHOST_SHIFT: ATTACK_FAILURE (Combat disabled)" });
        return;
      }
    }

    if (sub.action.attackAp > 0 && sub.action.targetId) {
      const target = nextPlayers.find(x => x.id === sub.action.targetId)!;
      
      // Untargetable Check (Ghost Active)
      const targetSub = submissions.find(s => s.playerId === target.id);
      if (target.unit?.type === UnitType.GHOST && targetSub?.action.abilityActive) {
        logs.push({ attackerId: p.id, type: ActionType.ATTACK, resultMessage: `MISS: ${target.name} is PHASE_SHIFTED` });
        return;
      }

      let baseDmg = BASE_ATTACK_DMG * sub.action.attackAp;
      if (p.unit?.type === UnitType.KILLSHOT) baseDmg *= 1.1; // 10% buff
      if (p.targetLockId === target.id) baseDmg *= 1.3; // Hunter mark

      // Range Multiplier
      const key = [p.id, target.id].sort().join('-');
      const range = nextDistanceMatrix.get(key) ?? 1;
      let mult = 1.0;
      if (range === 0) mult = 1.2;
      else if (range === 2) mult = (0.75 + (p.unit?.focus || 0) / 100);
      
      let finalDmg = Math.floor(baseDmg * mult);

      // Reaper Execution
      if (p.unit?.type === UnitType.REAPER && sub.action.abilityActive && target.hp < 250) {
        finalDmg = 9999;
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "FINAL_HARVEST: LETHAL_EXECUTION_TRIGGERED" });
      }

      // Trojan Shield Pierce Logic
      let isShieldPierce = false;
      if (p.unit?.type === UnitType.TROJAN) {
        if (p.overclockTurns && p.overclockTurns > 0) {
          isShieldPierce = true;
          // Reduction of overclock turns happens in income step now for clarity
        } else if (Math.random() < 0.15) {
          isShieldPierce = true;
          logs.push({ attackerId: p.id, type: ActionType.PHASE, resultMessage: "CRITICAL_SYSTEM_BYPASS: SHIELD_PIERCE_PROC" });
        }
      }

      // Poison debuff
      if (p.statuses.some(s => s.type === 'POISON')) finalDmg *= 0.8;

      incomingDmg.set(target.id, (incomingDmg.get(target.id) || 0) + finalDmg);
      attackMap.push({ attackerId: p.id, targetId: target.id, dmg: finalDmg, isShieldPierce });

      // Pyrus Burn proc
      if (p.unit?.type === UnitType.PYRUS && Math.random() < 0.20 && target.unit?.type !== UnitType.MEDIC) {
        target.statuses.push({ type: 'BURN', duration: 2 });
      }
      // Python Poison proc
      if (p.unit?.type === UnitType.PYTHON && Math.random() < 0.35 && target.unit?.type !== UnitType.MEDIC) {
        target.statuses.push({ type: 'POISON', duration: 3 });
      }
    }

    // Pyrus Firewall Active
    if (sub.action.abilityActive && p.unit?.type === UnitType.PYRUS && sub.action.targetId) {
      const target = nextPlayers.find(x => x.id === sub.action.targetId)!;
      incomingDmg.set(target.id, (incomingDmg.get(target.id) || 0) + 100);
      attackMap.push({ attackerId: p.id, targetId: target.id, dmg: 100, isShieldPierce: false });
      if (Math.random() < 0.5) {
        target.ap = Math.max(0, target.ap - 1);
        logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "FIREWALL_ACTIVE: -1 AP DRAINED FROM TARGET" });
      }
    }

    // Killshot Double Tap
    if (sub.action.abilityActive && p.unit?.type === UnitType.KILLSHOT && sub.action.targetId) {
       const target = nextPlayers.find(x => x.id === sub.action.targetId)!;
       const freeDmg = Math.floor(BASE_ATTACK_DMG * 1.1 * 2); 
       incomingDmg.set(target.id, (incomingDmg.get(target.id) || 0) + freeDmg);
       attackMap.push({ attackerId: p.id, targetId: target.id, dmg: freeDmg, isShieldPierce: false });
       logs.push({ attackerId: p.id, type: ActionType.ABILITY, resultMessage: "DOUBLE_TAP_SUCCESS: 2 FREE_BURST_ATTACKS" });
    }
  });

  // --- Step 4: Mitigation & Cracking ---
  const finalMitigation = new Map<string, { percent: number, isCracked: boolean }>();
  nextPlayers.forEach(p => {
    const sub = submissions.find(s => s.playerId === p.id);
    const tier = sub?.action.blockAp || 0;
    const incoming = incomingDmg.get(p.id) || 0;
    
    // Aegis Active Check
    if (p.unit?.type === UnitType.AEGIS && sub?.action.abilityActive) {
      finalMitigation.set(p.id, { percent: 0.8, isCracked: false });
      logs.push({ attackerId: p.id, type: ActionType.BLOCK, resultMessage: "TITAN_SHIELD_DEPLOYED: 80% MITIGATION" });
      return;
    }

    const config = (DEFENSE_CONFIG as any)[tier] || { mitigation: 0, crackedMitigation: 0, threshold: 0 };
    const isCracked = incoming > config.threshold;
    let percent = isCracked ? config.crackedMitigation : config.mitigation;
    
    // Aegis Passive 10% DR
    if (p.unit?.type === UnitType.AEGIS) percent += 0.1;

    finalMitigation.set(p.id, { percent, isCracked });
    
    if (tier > 0) {
      logs.push({ 
        attackerId: p.id, 
        type: ActionType.BLOCK, 
        defenseTier: tier, 
        isCracked, 
        resultMessage: isCracked ? `BARRIER_CRACKED: ${Math.round(percent*100)}% DR LEFT` : `BARRIER_HOLDING: ${Math.round(percent*100)}% DR` 
      });
    }
  });

  // --- Step 5: Damage Application & Reflection ---
  attackMap.forEach(att => {
     const attacker = nextPlayers.find(p => p.id === att.attackerId)!;
     const target = nextPlayers.find(p => p.id === att.targetId)!;
     const mit = finalMitigation.get(target.id)!;
     
     const mitApplied = att.isShieldPierce ? 0 : mit.percent;
     const damageTaken = Math.floor(att.dmg * (1 - mitApplied));
     
     target.hp -= damageTaken;

     // Leech Lifesteal
     if (attacker.unit?.type === UnitType.LEECH) {
       const sub = submissions.find(s => s.playerId === attacker.id);
       const lifestealRate = sub?.action.abilityActive ? 1.0 : 0.3;
       attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.floor(damageTaken * lifestealRate));
     }

     logs.push({
       attackerId: attacker.id, attackerName: attacker.name, targetId: target.id, targetName: target.name,
       type: ActionType.ATTACK, damage: damageTaken, mitigatedAmount: Math.floor(att.dmg * mitApplied),
       resultMessage: `IMPACT: ${damageTaken} HP ${att.isShieldPierce ? '(PIERCED)' : ''}`
     });
  });

  // --- Step 6: Status Ticks ---
  nextPlayers.forEach(p => {
    p.statuses = p.statuses.filter(s => {
      if (s.type === 'BURN') { p.hp -= 50; logs.push({ attackerId: "SYSTEM", targetId: p.id, type: ActionType.PHASE, resultMessage: "STATUS_BURN: -50 HP" }); }
      if (s.type === 'POISON') { p.hp -= 40; logs.push({ attackerId: "SYSTEM", targetId: p.id, type: ActionType.PHASE, resultMessage: "STATUS_TOXIN: -40 HP" }); }
      s.duration--;
      return s.duration > 0;
    });
  });

  // --- Step 7: Initiative Mutual Kill Check ---
  const deadThisRound = nextPlayers.filter(p => p.hp <= 0 && !p.isEliminated);
  if (deadThisRound.length > 1) {
     const reaper = deadThisRound.find(p => p.unit?.type === UnitType.REAPER);
     let winner = reaper || deadThisRound.sort((a, b) => (b.unit?.speed || 0) - (a.unit?.speed || 0))[0];
     
     deadThisRound.forEach(p => { if (p.id !== winner.id) p.isEliminated = true; });
     winner.hp = 1; // Pyrrhic winner stays at 1 HP
     logs.push({ attackerId: winner.id, type: ActionType.PHASE, resultMessage: `PYRRHIC_VICTOR: INITIATIVE_ADVANTAGE (${winner.unit?.speed})` });
  } else {
     deadThisRound.forEach(p => p.isEliminated = true);
  }

  // --- Step 8: Income & Cleanup ---
  const nextRound = currentRound + 1;
  nextPlayers.forEach(p => {
    if (!p.isEliminated) {
      let income = calculateIncome(p.ap, nextRound);
      
      // Static Feedback Loop
      if (p.unit?.type === UnitType.STATIC) {
         nextPlayers.forEach(other => {
            if (other.id !== p.id && other.ap > calculateIncome(0, nextRound)) {
               other.hp -= 50;
               logs.push({ attackerId: p.id, type: ActionType.PHASE, resultMessage: `FEEDBACK_LOOP: AGGRESSIVE_RESERVE_PENALTY -> ${other.name}` });
            }
         });
      }

      // Battery Storage Gain
      if (p.unit?.type === UnitType.BATTERY && incomingDmg.has(p.id)) {
        income += Math.min(2, Math.floor((incomingDmg.get(p.id) || 0) / 100) || 1);
      }

      // Static Blackout Active
      const staticDisruptor = submissions.find(s => s.action.abilityActive && nextPlayers.find(np => np.id === s.playerId)?.unit?.type === UnitType.STATIC);
      if (staticDisruptor) {
        income = 2; // Fixed base AP
      }

      p.ap = income;
      if (p.cooldown > 0) p.cooldown--;
      
      // Reduce Overclock Turns correctly based on attack points used
      const mySub = submissions.find(s => s.playerId === p.id);
      if (p.overclockTurns) {
        p.overclockTurns = Math.max(0, p.overclockTurns - (mySub?.action.attackAp || 0));
      }
    }
  });

  return { nextPlayers, logs, nextRound, nextDistanceMatrix };
}
