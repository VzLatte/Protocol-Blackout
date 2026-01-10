
import { Player, Position, ActionType, ResolutionLog } from '../../../types';
import { COLLISION_DAMAGE } from '../../../constants';

export interface MoveRequest {
    player: Player;
    path: Position[];
    cost: number;
    dest: Position;
    speed: number;
    originalPos: Position;
    isInertia: boolean;
}

export function resolveCollisions(
    destMap: Map<string, MoveRequest[]>,
    logs: ResolutionLog[]
) {
    destMap.forEach((requests) => {
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
          
          // Check for tie
          let tie = false;
          if (requests.length > 1) {
             const runnerUp = requests[1];
             if (!winner.isInertia && !runnerUp.isInertia && winner.speed === runnerUp.speed) {
                tie = true;
             }
          }

          if (tie) {
             // BOTH CRASH
             requests.forEach(req => {
                const bouncePos = req.path.length > 1 ? req.path[req.path.length - 2] : req.originalPos;
                req.player.position = bouncePos;
                const dmg = COLLISION_DAMAGE; 
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
                 loser.player.hp -= COLLISION_DAMAGE; 
                 logs.push({ attackerId: loser.player.id, type: ActionType.COLLISION, resultMessage: `DISPLACED BY ${winner.player.name}! -${COLLISION_DAMAGE} HP` });
             }
          }
      }
  });
}
