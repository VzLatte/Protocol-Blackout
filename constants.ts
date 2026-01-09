
import { ActionType, RangeZone, AIArchetype, AIDifficulty, UnitType, TileType, GridMap } from './types';

export const INITIAL_HP = 1000;
export const BASE_ATTACK_DMG = 120;
export const GRID_SIZE = 7;
export const COLLISION_DAMAGE = 50;
export const THRESHOLD_WIN_TURNS = 3;

// Maps Definition
const createEmptyMap = (id: string, name: string): GridMap => {
  const tiles = Array(7).fill(null).map(() => Array(7).fill(TileType.EMPTY));
  return { id, name, tiles };
};

const EMPTY_MAP = createEmptyMap('MAP_EMPTY', 'PURE_GRID');

// Chapter 1: Basic Cover (Crossfire)
const CHAPTER_1_MAP = createEmptyMap('MAP_C1', 'CROSSFIRE');
CHAPTER_1_MAP.tiles[2][2] = TileType.OBSTACLE;
CHAPTER_1_MAP.tiles[2][4] = TileType.OBSTACLE;
CHAPTER_1_MAP.tiles[4][2] = TileType.OBSTACLE;
CHAPTER_1_MAP.tiles[4][4] = TileType.OBSTACLE;

// Chapter 2: Arena Hold (King of the Hill)
const CHAPTER_2_MAP = createEmptyMap('MAP_C2', 'ARENA_HOLD');
CHAPTER_2_MAP.tiles[3][3] = TileType.THRESHOLD; // Center Capture Point
CHAPTER_2_MAP.tiles[2][2] = TileType.HIGH_GROUND;
CHAPTER_2_MAP.tiles[2][4] = TileType.HIGH_GROUND;
CHAPTER_2_MAP.tiles[4][2] = TileType.HIGH_GROUND;
CHAPTER_2_MAP.tiles[4][4] = TileType.HIGH_GROUND;
// Cover for backline
CHAPTER_2_MAP.tiles[1][3] = TileType.OBSTACLE;
CHAPTER_2_MAP.tiles[5][3] = TileType.OBSTACLE;

// Chapter 3: Hazard Zone (Reactor Leak)
const CHAPTER_3_MAP = createEmptyMap('MAP_C3', 'REACTOR_LEAK');
// Toxic Core
CHAPTER_3_MAP.tiles[3][3] = TileType.TOXIC;
CHAPTER_3_MAP.tiles[2][3] = TileType.TOXIC;
CHAPTER_3_MAP.tiles[4][3] = TileType.TOXIC;
CHAPTER_3_MAP.tiles[3][2] = TileType.TOXIC;
CHAPTER_3_MAP.tiles[3][4] = TileType.TOXIC;
// Safe high ground corners
CHAPTER_3_MAP.tiles[0][0] = TileType.HIGH_GROUND;
CHAPTER_3_MAP.tiles[6][0] = TileType.HIGH_GROUND;
CHAPTER_3_MAP.tiles[0][6] = TileType.HIGH_GROUND;
CHAPTER_3_MAP.tiles[6][6] = TileType.HIGH_GROUND;
// Tactical cover
CHAPTER_3_MAP.tiles[1][1] = TileType.OBSTACLE;
CHAPTER_3_MAP.tiles[5][5] = TileType.OBSTACLE;
CHAPTER_3_MAP.tiles[1][5] = TileType.OBSTACLE;
CHAPTER_3_MAP.tiles[5][1] = TileType.OBSTACLE;

export const MAPS: Record<string | number, GridMap> = {
  1: CHAPTER_1_MAP,
  2: CHAPTER_2_MAP,
  3: CHAPTER_3_MAP,
  'EMPTY': EMPTY_MAP
};

export const TILE_COSTS = {
  [TileType.EMPTY]: 1,
  [TileType.OBSTACLE]: 99,
  [TileType.HIGH_GROUND]: 2, // Movement Points cost (Stride)
  [TileType.TOXIC]: 2,
  [TileType.THRESHOLD]: 1
};

export const TILE_BONUSES = {
  [TileType.HIGH_GROUND]: { focus: 0.1 },
  [TileType.TOXIC]: { damage: 50 }, // Dmg per turn if ending here
  [TileType.THRESHOLD]: { atk: 0.10, defMalus: 0.15 } // +10% DMG dealt, +15% DMG Taken
};

// AP Costs: Level 1 = 1, Level 2 = 3 (1+2), Level 3 = 6 (1+2+3)
export const ATTACK_CONFIG = {
  1: { ap: 1, mult: 1.0, name: 'PROBE' },
  2: { ap: 3, mult: 2.25, name: 'STRIKE' },
  3: { ap: 6, mult: 4.5, chip: 0.1, name: 'EXECUTE' }
};

export const BLOCK_CONFIG = {
  1: { ap: 1, base: 150, name: 'COVER' },
  2: { ap: 3, base: 350, name: 'BARRIER' },
  3: { ap: 6, base: 650, name: 'FORTRESS' }
};

export const DESPERATION_MOVES: Record<UnitType, { name: string, flavor: string, effect: string }> = {
  [UnitType.PYRUS]: { name: "SOLAR FLARE", flavor: "NEURAL_CORE_IGNITION: PULSE_WAVE_EMITTED.", effect: "5.0x Damage to all targets." },
  [UnitType.GHOST]: { name: "PHANTOM STEP", flavor: "TRACE_DELETED: SYSTEM_GHOST_ACTIVE.", effect: "Gain 300 Block + 1 AP. Position Reset." },
  [UnitType.AEGIS]: { name: "IRON DOME", flavor: "CERAMIC_PLATING_LOCKDOWN: IMMOVABLE.", effect: "100% Damage Nullification for 2 turns." },
  [UnitType.REAPER]: { name: "FINAL HARVEST", flavor: "SCYTHE_PROTOCOL: SOUL_DATA_EXTRACTED.", effect: "Execute if < 30% HP, else 6.0x Damage." },
  [UnitType.TROJAN]: { name: "LOGIC BOMB", flavor: "KERNEL_ACCESS_GRANTED: FORCED_REBOOT.", effect: "Drain all Enemy AP. Force Random Move." },
  [UnitType.KILLSHOT]: { name: "POINT BLANK", flavor: "SAFETY_LIMITERS_OFF: ONE_SHOT_ONE_KILL.", effect: "8.0x Damage. Reduces self to 1 HP." },
  [UnitType.HUNTER]: { name: "APEX PREDATOR", flavor: "SYNAPTIC_OVERDRIVE: PREY_SIGHT_LOCKED.", effect: "3x Attacks at 1.0x Damage." },
  [UnitType.MEDIC]: { name: "BIO-SURGE", flavor: "ADRENALINE_OVERFLOW: BIOLOGICAL_COST_PAID.", effect: "Heal 500 HP. Lose 1 Max AP permanently." },
  [UnitType.BATTERY]: { name: "DISCHARGE", flavor: "CAPACITOR_BURST: ENERGY_LEAK_CRITICAL.", effect: "Convert all HP to Dmg (1:2 ratio). Set HP to 1." },
  [UnitType.GLITCH]: { name: "TEMPORAL RIP", flavor: "INDEX_OUT_OF_BOUNDS: TIME_STRING_REWRITTEN.", effect: "Heal last turn damage. Teleport." },
  [UnitType.LEECH]: { name: "NEURAL DRAIN", flavor: "PARASITIC_LINK_ESTABLISHED: DATA_SIPHON.", effect: "Steal 200 HP and 1 AP." },
  [UnitType.WARDEN]: { name: "BLACKSITE", flavor: "CONTAINMENT_PROCEDURE: SUBJECT_ISOLATED.", effect: "Trap target. Gain 200 Block." },
  [UnitType.SINGULARITY]: { name: "EVENT HORIZON", flavor: "REALITY_COLLAPSE_IMMINENT.", effect: "Wipe Sector. 10.0x True Damage." },
  [UnitType.RAVEN]: { name: "OMNISCIENCE", flavor: "FUTURE_SIGHT_ESTABLISHED.", effect: "Dodge next attack. Gain 4 AP." },
  [UnitType.PYTHON]: { name: "CONSTRICTION", flavor: "VITAL_SIGNS_FAILING.", effect: "Deal 400 True Damage. Target Paralyzed." },
  [UnitType.STATIC]: { name: "EMP BLAST", flavor: "ELECTRONICS_FRIED.", effect: "Enemy AP set to 0. Deal 300 Dmg." },
};

export const ACTION_COSTS = {
  [ActionType.ATTACK]: 0, 
  [ActionType.BLOCK]: 0, 
  [ActionType.MOVE]: 1, // Fixed 1 AP cost
  [ActionType.BOUNTY]: 0,
  [ActionType.RESERVE]: 0,
  [ActionType.PHASE]: 3,
  [ActionType.DESPERATION]: 0,
  [ActionType.COLLISION]: 0,
  [ActionType.CAPTURE]: 0
};

export const DEFENSE_CONFIG = {
  1: { mitigation: 0, threshold: 150, name: 'COVER' },
  2: { mitigation: 0, threshold: 350, name: 'BARRIER' },
  3: { mitigation: 0, threshold: 650, name: 'FORTRESS' },
};

export const RANGE_VALUES = {
  [RangeZone.CLOSE]: 0,
  [RangeZone.MID]: 1,
  [RangeZone.FAR]: 2
};

export const RANGE_NAMES = {
  0: RangeZone.CLOSE,
  1: RangeZone.MID,
  2: RangeZone.FAR
};

export const TIME_LIMITS = [0, 15, 30, 60];

export const CHAOS_DECK = [
  { name: 'SOLAR FLARE', description: 'Overheat penalty is doubled this round (30% per stack).' },
  { name: 'REBATE', description: 'Any AP spent on Block this round is refunded to the player next turn.' },
  { name: 'BOUNTY HUNT', description: 'Every player is automatically "Marked." Whoever deals damage this round gains +1 AP.' },
  { name: 'SYSTEM RESET', description: 'All players\' current AP pools are set to 0. (The "Greed Killer").' },
  { name: 'ADRENALINE', description: 'Stride +1 for all units.' },
  { name: 'FOG OF WAR', description: 'You cannot see the HP levels of other players for the next 2 rounds.' },
  { name: 'SUDDEN DEATH', description: 'Everyone loses 150 HP immediately.' },
  { name: 'TRADE DEAL', description: 'The player with the highest HP swaps their AP pool with the player with the lowest HP.' },
  { name: 'SHIELD WALL', description: 'Shield Values are +50% effective this round.' },
  { name: 'MIRAGE', description: 'All "Abilities" are disabled for this round. Pure Jurassic World math only.' }
];
