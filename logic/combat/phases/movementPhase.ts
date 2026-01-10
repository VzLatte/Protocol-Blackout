
import { Player, TurnData, ResolutionLog, ActionType, UnitType } from '../../../types';
import { resolveCollisions, MoveRequest } from '../utils/collisionLogic';

export function resolveMovement(
  players: Player[],
  submissions: TurnData[],
  logs: ResolutionLog[]
) {
  const moveRequests: MoveRequest[] = [];

  submissions.forEach(sub => {
    if (sub.action.moveAp > 0 && !sub.action.isDesperation) {
        const p = players.find(x => x.id === sub.playerId)!;
        
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
                isInertia: p.unit?.type === UnitType.AEGIS 
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

  resolveCollisions(destMap, logs);
}
