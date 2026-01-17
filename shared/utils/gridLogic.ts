
import { Position, GridMap, TileType } from '../types';
import { GRID_SIZE, TILE_COSTS, BASE_MOVE_COST } from '../constants';

export function getManhattanDistance(p1: Position, p2: Position): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function isValidPos(p: Position): boolean {
  return p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE;
}

export function getStride(speed: number): number {
  return Math.max(2, Math.round(2 * speed));
}

export interface ReachableTile {
  x: number;
  y: number;
  costInAp: number;
}

/**
 * Returns a list of all tiles reachable within the AP budget.
 * Updated: Removed 'stride' cap. Purely AP cost based.
 */
export function getReachableTiles(
  start: Position, 
  maxAp: number, 
  map: GridMap, 
  occupied: Position[],
  unitSpeed: number = 1.0
): ReachableTile[] {
  const moveCostBase = BASE_MOVE_COST;
  const actualCost = Math.max(1, Math.round(moveCostBase / unitSpeed));
  
  const maxMp = maxAp; 
  const costs: Record<string, number> = {}; 
  const queue: { pos: Position, apSpent: number }[] = [{ pos: start, apSpent: 0 }];
  
  costs[`${start.x},${start.y}`] = 0;

  const result: ReachableTile[] = [];

  while (queue.length > 0) {
    queue.sort((a, b) => a.apSpent - b.apSpent);
    const { pos, apSpent } = queue.shift()!;

    if (pos.x !== start.x || pos.y !== start.y) {
       result.push({
         x: pos.x,
         y: pos.y,
         costInAp: apSpent
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

      let terrainMult = 1;
      if (tileType === TileType.HIGH_GROUND) terrainMult = 1.5;
      if (tileType === TileType.DEBRIS) terrainMult = 2.0;

      const stepCost = Math.round(actualCost * terrainMult);
      const newApSpent = apSpent + stepCost;

      if (newApSpent <= maxMp) {
        const key = `${n.x},${n.y}`;
        if (costs[key] === undefined || newApSpent < costs[key]) {
          costs[key] = newApSpent;
          queue.push({ pos: n, apSpent: newApSpent });
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
 * Dijkstra Pathfinding: Finds lowest COST path.
 * Respects Terrain Costs (Debris 2x, etc).
 * Previously known as 'findOptimalPath'.
 */
export function findPath(
  start: Position, 
  end: Position, 
  map: GridMap, 
  occupied: Position[] = [], // Kept for signature compatibility, though often empty for simple pathing
  unitSpeed: number = 1.0
): Position[] {
  if (start.x === end.x && start.y === end.y) return [];

  const moveCostBase = BASE_MOVE_COST;
  const actualCost = Math.max(1, Math.round(moveCostBase / unitSpeed));

  const nodes: Record<string, { pos: Position; cost: number; parent: string | null }> = {};
  const queue: string[] = [`${start.x},${start.y}`];
  
  nodes[`${start.x},${start.y}`] = { pos: start, cost: 0, parent: null };

  const visited = new Set<string>();

  while (queue.length > 0) {
    // Sort queue by lowest accumulated cost (Dijkstra's core)
    queue.sort((a, b) => nodes[a].cost - nodes[b].cost);
    const currentKey = queue.shift()!;
    const { pos, cost } = nodes[currentKey];

    if (pos.x === end.x && pos.y === end.y) {
      // Reconstruct path
      const path: Position[] = [];
      let curr = currentKey;
      while (nodes[curr].parent !== null) {
        path.unshift(nodes[curr].pos);
        curr = nodes[curr].parent!;
      }
      return path;
    }

    visited.add(currentKey);

    const neighbors = [
      { x: pos.x + 1, y: pos.y }, { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 }, { x: pos.x, y: pos.y - 1 }
    ];

    for (const n of neighbors) {
      if (!isValidPos(n)) continue;
      const key = `${n.x},${n.y}`;
      if (visited.has(key)) continue;

      const tileType = map.tiles[n.y][n.x];
      if (tileType === TileType.OBSTACLE) continue;

      let terrainMult = 1;
      if (tileType === TileType.HIGH_GROUND) terrainMult = 1.5;
      if (tileType === TileType.DEBRIS) terrainMult = 2.0;

      const stepCost = Math.round(actualCost * terrainMult);
      const totalCost = cost + stepCost;

      if (!nodes[key] || totalCost < nodes[key].cost) {
        nodes[key] = { pos: n, cost: totalCost, parent: currentKey };
        if (!queue.includes(key)) queue.push(key);
      }
    }
  }
  return [];
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
