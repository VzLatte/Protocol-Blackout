
import { Player, TurnData, ResolutionLog, ActionType, UnitType } from '../../../types';

export function resolveDesperation(
  players: Player[],
  submissions: TurnData[],
  logs: ResolutionLog[]
) {
  submissions.forEach(sub => {
      if (sub.action.isDesperation) {
          const p = players.find(x => x.id === sub.playerId)!;
          if (!p.desperationUsed && p.unit) {
              p.desperationUsed = true;
              
              // Apply Specific Desperation Effects
              switch (p.unit.type) {
                  case UnitType.GHOST:
                      p.hp = Math.min(p.maxHp, p.hp + 300);
                      p.statuses.push({ type: 'PHASED', duration: 1 });
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "PHANTOM STEP: PHASED & HEALED" });
                      break;
                  case UnitType.AEGIS:
                      p.statuses.push({ type: 'IRON_DOME', duration: 2 });
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "IRON DOME: DAMAGE REDUCTION ACTIVE" });
                      break;
                  case UnitType.PYRUS:
                      let hitCount = 0;
                      let totalDmg = 0;
                      players.forEach(target => {
                          if (target.id !== p.id && !target.isEliminated) {
                              target.hp -= 500;
                              hitCount++;
                              totalDmg += 500;
                          }
                      });
                      if (hitCount > 0) {
                          logs.push({ 
                              attackerId: p.id, 
                              type: ActionType.ATTACK, 
                              resultMessage: `SOLAR FLARE: GLOBAL PULSE -${totalDmg} (${hitCount} TARGETS)` 
                          });
                      }
                      break;
                  case UnitType.REAPER:
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "FINAL HARVEST: EXECUTION PROTOCOL READY" });
                      break;
                  case UnitType.HUNTER:
                      p.statuses.push({ type: 'APEX_PREDATOR', duration: 1 });
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "APEX PREDATOR: MULTI-STRIKE READY" });
                      break;
                  case UnitType.MEDIC:
                      p.hp = Math.min(p.maxHp, p.hp + 300);
                      p.statuses = []; 
                      logs.push({ attackerId: p.id, type: ActionType.DESPERATION, resultMessage: "BIO-SURGE: SYSTEM RESTORED" });
                      break;
              }
          }
      }
  });
}
