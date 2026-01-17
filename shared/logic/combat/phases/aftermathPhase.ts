
import { Player, TurnData, ResolutionLog, ActionType, GridMap, TileType, UnitType, HazardType, DifficultyLevel } from '../../../types';
import { calculateIncome } from '../../../apManager';

export function resolveAftermath(
  players: Player[],
  submissions: TurnData[],
  logs: ResolutionLog[],
  map: GridMap,
  round: number,
  hazard: HazardType,
  difficulty: DifficultyLevel
) {
  // 3.1 CAPTURE ZONE LOGIC
  const playersOnThreshold = players.filter(p => !p.isEliminated && map.tiles[p.position.y][p.position.x] === TileType.THRESHOLD);
  
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

  // 3.2 HAZARD TICKS
  players.forEach(p => {
    if (p.isEliminated) return;
    
    // Removed blanket Medic Immunity here. Medics are affected by physical hazards.

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

    const tile = map.tiles[p.position.y][p.position.x];
    
    // Medic 'Purify' prevents TOXIC tile damage (regarded as a Status Effect), but not physical/environmental hazards
    if (tile === TileType.TOXIC && p.unit?.type !== UnitType.MEDIC) { 
        p.hp -= 50; 
        p.maxHp -= 10; 
        logs.push({ attackerId: p.id, type: ActionType.BOUNTY, resultMessage: "TOXIC: -50 HP" }); 
    }
    
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

      const { total, vented } = calculateIncome(p.ap, round + 1, difficultyCap);
      p.ap = total;
      if (vented > 0) {
          logs.push({ attackerId: p.id, type: ActionType.VENT, resultMessage: `SYSTEM OVERHEAT: ${vented} AP VENTED` });
      }
      p.isAbilityActive = false; 
    }
  });
}
