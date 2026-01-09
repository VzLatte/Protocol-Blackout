
import { Position, GridMap, TileType } from '../types';
import { GRID_SIZE, TILE_COSTS } from '../constants';

export function getManhattanDistance(p1: Position, p2: Position): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function isValidPos(p: Position): boolean {
  return p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE;
}

export function getStride(speed: number): number {
  return Math.round(2 * speed);
}

export interface ReachableTile {
  x: number;
  y: number;
  costInAp: number;
}

/**
 * Returns a list of all tiles reachable within the AP budget.
 * Used for AI scoring and UI Highlighting.
 */
export function getReachableTiles(
  start: Position, 
  stride: number, 
  maxAp: number, 
  map: GridMap, 
  occupied: Position[] = [] 
): ReachableTile[] {
  const maxMp = maxAp * stride; // Total Movement Points available
  const costs: Record<string, number> = {}; // key: "x,y", val: mpSpent
  const queue: { pos: Position, mp: number }[] = [{ pos: start, mp: 0 }];
  
  costs[`${start.x},${start.y}`] = 0;

  const result: ReachableTile[] = [];

  while (queue.length > 0) {
    queue.sort((a, b) => a.mp - b.mp);
    const { pos, mp } = queue.shift()!;

    if (pos.x !== start.x || pos.y !== start.y) {
       result.push({
         x: pos.x,
         y: pos.y,
         costInAp: Math.ceil(mp / stride)
       });
    }

    const neighbors = [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 }
    ];

    for (const n of neighbors) {
      if (!isValidPos(n)) continue;
      
      const tileType = map.tiles[n.y][n.x];
      
      if (tileType === TileType.OBSTACLE) continue;
      if (occupied.some(occ => occ.x === n.x && occ.y === n.y)) continue;

      const moveCost = TILE_COSTS[tileType] || 1;
      const newMp = mp + moveCost;

      if (newMp <= maxMp) {
        const key = `${n.x},${n.y}`;
        if (costs[key] === undefined || newMp < costs[key]) {
          costs[key] = newMp;
          queue.push({ pos: n, mp: newMp });
        }
      }
    }
  }

  const uniqueResults = new Map<string, ReachableTile>();
  result.forEach(r => {
    const key = `${r.x},${r.y}`;
    if (!uniqueResults.has(key) || uniqueResults.get(key)!.costInAp > r.costInAp) {
      uniqueResults.set(key, r);
    }
  });

  return Array.from(uniqueResults.values());
}

/**
 * Finds the shortest valid path between start and end using BFS.
 * Returns array of positions excluding start, including end.
 * Used for actual AI movement execution to prevent wall-phasing.
 */
export function findPath(start: Position, end: Position, map: GridMap, occupied: Position[] = []): Position[] {
  if (start.x === end.x && start.y === end.y) return [];

  const queue: { pos: Position, path: Position[] }[] = [{ pos: start, path: [] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;

    if (pos.x === end.x && pos.y === end.y) {
      return path;
    }

    const neighbors = [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 }
    ];

    for (const n of neighbors) {
      if (!isValidPos(n)) continue;
      const key = `${n.x},${n.y}`;
      if (visited.has(key)) continue;

      const tileType = map.tiles[n.y][n.x];
      
      // Allow moving onto the END tile even if it's technically occupied (collision logic handles that later)
      // But walls are hard stops.
      if (tileType === TileType.OBSTACLE) continue;
      
      // We don't check 'occupied' strictly here because dynamic collision resolution happens in combatEngine
      // But if we wanted strict pathfinding we would check occupied.
      
      visited.add(key);
      queue.push({ pos: n, path: [...path, n] });
    }
  }
  return []; // No path found
}

export function getObstaclesInLine(start: Position, end: Position, map: GridMap): number {
  let obstacles = 0;
  
  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if ((x0 !== start.x || y0 !== start.y) && (x0 !== end.x || y0 !== end.y)) {
       const tile = map.tiles[y0][x0];
       if (tile === TileType.OBSTACLE) {
         obstacles++;
       }
    }

    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }

  return obstacles;
}

export function getCoverStatus(attackerPos: Position, targetPos: Position, map: GridMap): boolean {
  const dx = attackerPos.x - targetPos.x;
  const dy = attackerPos.y - targetPos.y;

  const dirX = Math.sign(dx);
  const dirY = Math.sign(dy);

  const checkX = targetPos.x + dirX;
  const checkY = targetPos.y + dirY;

  if (isValidPos({x: checkX, y: checkY})) {
    if (map.tiles[checkY][checkX] === TileType.OBSTACLE) return true;
  }
  
  if (dirX !== 0 && dirY !== 0) {
     const checkX2 = targetPos.x + dirX;
     const checkY2 = targetPos.y;
     if (isValidPos({x: checkX2, y: checkY2}) && map.tiles[checkY2][checkX2] === TileType.OBSTACLE) return true;

     const checkX3 = targetPos.x;
     const checkY3 = targetPos.y + dirY;
     if (isValidPos({x: checkX3, y: checkY3}) && map.tiles[checkY3][checkX3] === TileType.OBSTACLE) return true;
  }

  return false;
}
