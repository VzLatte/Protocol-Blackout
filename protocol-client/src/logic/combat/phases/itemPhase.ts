
import { Player, TurnData, ResolutionLog, ActionType } from '../../../../src/shared/types';
import { AP_COST_ITEM } from '../../../../src/shared/constants';

export function resolveItems(
  players: Player[],
  submissions: TurnData[],
  logs: ResolutionLog[]
) {
  submissions.forEach(sub => {
    if (sub.action.useItem) {
      const p = players.find(x => x.id === sub.playerId)!;
      const item = p.loadout.secondary;
      
      // Basic Validation
      if (!item) return;
      if (p.itemUses.current >= p.itemUses.max) {
          logs.push({ attackerId: p.id, type: ActionType.ITEM, resultMessage: "ITEM DEPLETED" });
          return;
      }

      // AP Cost Check
      if (p.ap < AP_COST_ITEM) {
          logs.push({ 
              attackerId: p.id, 
              type: ActionType.ITEM, 
              resultMessage: "INSUFFICIENT_AP: CANNOT_USE_ITEM" 
          });
          return;
      }

      let effectApplied = false;

      // EFFECT: HEAL
      if (item.effectType === 'HEAL') {
          const val = item.effectValue || 0;
          const oldHp = p.hp;
          // Apply Heal (respect maxHP)
          p.hp = Math.min(p.maxHp, p.hp + val);
          const healed = p.hp - oldHp;
          logs.push({ 
              attackerId: p.id, 
              type: ActionType.ITEM, 
              resultMessage: `${item.name}: +${healed} HP` 
          });
          effectApplied = true;
      } 
      // EFFECT: EMP
      else if (item.effectType === 'EMP') {
          const targetId = sub.action.targetId;
          const target = players.find(t => t.id === targetId && !t.isEliminated);
          
          if (target) {
              const val = item.effectValue || 0;
              target.ap = Math.max(0, target.ap - val);
              logs.push({ 
                  attackerId: p.id, 
                  targetId: target.id, 
                  type: ActionType.ITEM, 
                  resultMessage: `${item.name}: -${val} AP` 
              });
              effectApplied = true;
          } else {
              logs.push({ attackerId: p.id, type: ActionType.ITEM, resultMessage: "EMP FAILED: NO TARGET" });
          }
      }
      // EFFECT: STIM (Example generic buff)
      else if (item.effectType === 'STIM') {
          // Placeholder for future buffs
          effectApplied = true; 
      }

      // Consume Charge and Deduct AP
      if (effectApplied) {
          p.itemUses.current += 1;
          p.ap -= AP_COST_ITEM;
      }
    }
  });
}
