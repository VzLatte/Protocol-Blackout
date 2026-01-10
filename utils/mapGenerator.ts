
import { GridMap, TileType } from '../types';
import { GRID_SIZE } from '../constants';

class SeededRNG {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  
  // Simple LCG
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Range [min, max] inclusive
  range(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

const createBaseMap = (id: string, name: string): GridMap => {
  const tiles = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(TileType.EMPTY));
  return { id, name, tiles };
};

// Mirror point calculation (Central Point Symmetry)
const getMirroredPoint = (x: number, y: number): [number, number] => {
  return [GRID_SIZE - 1 - x, GRID_SIZE - 1 - y];
};

export const generateChapter1Map = (seed: number): GridMap => {
  const rng = new SeededRNG(seed);
  const map = createBaseMap(`C1_${seed}`, 'CROSSFIRE_V2');

  // 1. Procedural Obstacles (Cover)
  // INCREASED DENSITY: 5-8 Pairs (10-16 blocks) to reduce empty space on 11x11
  const obstacleCount = rng.range(5, 8); 
  for (let i = 0; i < obstacleCount; i++) {
    // Avoid spawn zones (rows 0-1 and 9-10)
    const x = rng.range(2, 8);
    const y = rng.range(2, 8);
    
    // Don't block center completely
    if (x === 5 && y === 5) continue;

    if (map.tiles[y][x] === TileType.EMPTY) {
        map.tiles[y][x] = TileType.OBSTACLE;
        const [mx, my] = getMirroredPoint(x, y);
        map.tiles[my][mx] = TileType.OBSTACLE;
    }
  }

  // 2. High Ground Corners (Fixed Archetype)
  map.tiles[3][3] = TileType.HIGH_GROUND;
  map.tiles[3][7] = TileType.HIGH_GROUND;
  map.tiles[7][3] = TileType.HIGH_GROUND;
  map.tiles[7][7] = TileType.HIGH_GROUND;

  // 3. Central Conflict Point (Optional Cover)
  if (rng.next() > 0.5 && map.tiles[5][5] === TileType.EMPTY) {
    map.tiles[5][5] = TileType.OBSTACLE;
  }

  return map;
};

export const generateChapter2Map = (seed: number): GridMap => {
  const rng = new SeededRNG(seed);
  const map = createBaseMap(`C2_${seed}`, 'ARENA_HOLD_V2');

  // 1. FIXED: 3x3 Central Threshold
  for (let y = 4; y <= 6; y++) {
    for (let x = 4; x <= 6; x++) {
      map.tiles[y][x] = TileType.THRESHOLD;
    }
  }

  // 2. Procedural Obstacles (The Clutter)
  const safeZone = [4, 5, 6];
  // Higher density outside ring to create lanes
  const obstacleCount = rng.range(6, 8); 

  for (let i = 0; i < obstacleCount; i++) {
    const x = rng.range(1, 9);
    const y = rng.range(1, 9);

    // Skip Threshold
    if (safeZone.includes(x) && safeZone.includes(y)) continue;
    
    // Skip Spawn
    if (x < 2 || x > 8) continue;

    if (map.tiles[y][x] === TileType.EMPTY) {
        map.tiles[y][x] = TileType.OBSTACLE;
        const [mx, my] = getMirroredPoint(x, y);
        map.tiles[my][mx] = TileType.OBSTACLE;
    }
  }

  // 3. SAFETY BREACH: Ensure Cardinal Entrances are open
  // This guarantees the ring is never fully walled off by bad RNG
  const entrances = [[5, 3], [5, 7], [3, 5], [7, 5]];
  entrances.forEach(([ex, ey]) => {
      map.tiles[ey][ex] = TileType.EMPTY;
  });

  // 4. High Ground (Tactical Over-watch)
  // Randomly place 2 pairs of high ground
  for (let i = 0; i < 2; i++) {
      const x = rng.range(2, 8);
      const y = rng.range(2, 8);
      if (map.tiles[y][x] === TileType.EMPTY && !(safeZone.includes(x) && safeZone.includes(y))) {
          map.tiles[y][x] = TileType.HIGH_GROUND;
          const [mx, my] = getMirroredPoint(x, y);
          map.tiles[my][mx] = TileType.HIGH_GROUND;
      }
  }

  return map;
};

export const generateChapter3Map = (seed: number): GridMap => {
  const rng = new SeededRNG(seed);
  const map = createBaseMap(`C3_${seed}`, 'REACTOR_LEAK_V2');

  // 1. FIXED: Toxic River (Row 5 - Middle)
  for (let x = 0; x < GRID_SIZE; x++) {
      map.tiles[5][x] = TileType.TOXIC;
  }

  // 2. Procedural Bridges (Mirrored)
  // Reduced frequency: Either just center (Hard) or Center + 1 Pair.
  const extraBridges = rng.range(0, 1);
  
  if (extraBridges > 0) {
      const x = rng.range(1, 3); // Left side bridge candidates
      map.tiles[5][x] = TileType.EMPTY; // Bridge
      
      const [mx, my] = getMirroredPoint(x, 5);
      map.tiles[my][mx] = TileType.EMPTY; // Mirrored Bridge
  }
  // Always bridge the exact center for a choke point
  map.tiles[5][5] = TileType.EMPTY;

  // 3. Debris Fields (Slow Zones)
  // Increased density for "muddy" mid-game feel
  const debrisCount = rng.range(8, 12);
  for (let i = 0; i < debrisCount; i++) {
      const x = rng.range(0, 10);
      const y = rng.range(2, 8); // Engagement zone only
      
      // ALLOW DEBRIS ON BRIDGES:
      // We check if the tile is EMPTY. Since Bridges (step 2) are EMPTY and River (step 1) is TOXIC,
      // this logic naturally places debris on bridges if RNG selects y=5, but ignores the acid river.
      
      if (map.tiles[y][x] === TileType.EMPTY) {
          map.tiles[y][x] = TileType.DEBRIS;
          const [mx, my] = getMirroredPoint(x, y);
          map.tiles[my][mx] = TileType.DEBRIS;
      }
  }

  // 4. Corner High Ground
  map.tiles[0][0] = TileType.HIGH_GROUND;
  map.tiles[10][0] = TileType.HIGH_GROUND;
  map.tiles[0][10] = TileType.HIGH_GROUND;
  map.tiles[10][10] = TileType.HIGH_GROUND;

  return map;
};

export const generateMap = (chapter: number, seed: number = Date.now()): GridMap => {
    switch(chapter) {
        case 1: return generateChapter1Map(seed);
        case 2: return generateChapter2Map(seed);
        case 3: return generateChapter3Map(seed);
        default: return generateChapter1Map(seed);
    }
};
