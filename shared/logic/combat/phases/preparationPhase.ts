
import { Player, TurnData, ResolutionLog, ActionType, HazardType, UnitType } from '../../../types';
import { BLOCK_CONFIG, ATTACK_CONFIG } from '../../../constants';

export function resolvePreparation(
  players: Player[],
  submissions: TurnData[],
  logs: ResolutionLog[],
  hazard: HazardType
) {
  submissions.forEach(sub => {
    const p = players.find(x => x.id === sub.playerId)!;
    
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
                // @ts-ignore
                shield: BLOCK_CONFIG[sub.action.blockAp].base,
                mathDetails: `[COST: ${blockCost} AP]`
            });
        }
    }

    // 1.2 Status Effects
    p.statuses.forEach(s => {
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
    p.tempSpeedMod = 0; 

    // 1.3 Active Abilities
    if (sub.action.abilityActive && !p.activeUsed) {
       if (p.unit?.type === UnitType.MEDIC) {
          const healAmt = hazard === HazardType.VIRAL_INVERSION ? -400 : 400;
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          p.activeUsed = true;
       }
    }
  });
}
