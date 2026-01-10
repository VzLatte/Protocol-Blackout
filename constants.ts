
import { ActionType, RangeZone, AIArchetype, AIDifficulty, UnitType, TileType, GridMap, MaterialType, Mod, Contract, Item, ItemSlot, DamageType } from './types';
import { generateMap } from './utils/mapGenerator';

export const INITIAL_HP = 1000;
export const BASE_ATTACK_DMG = 100; // Baseline Calibration 1.0
export const GRID_SIZE = 11; // Expanded for 3x3 Control Zones
export const COLLISION_DAMAGE = 100;
export const THRESHOLD_WIN_TURNS = 3;
export const BASE_MOVE_COST = 5; // Standard Move Cost before speed mod

// --- MAP DEFINITIONS VIA GENERATOR ---
// Using fixed seeds for consistent "Preview" maps in UI
const CHAPTER_1_MAP = generateMap(1, 1001);
const CHAPTER_2_MAP = generateMap(2, 2002);
const CHAPTER_3_MAP = generateMap(3, 3003);

const createEmptyMap = (id: string, name: string): GridMap => {
  const tiles = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(TileType.EMPTY));
  return { id, name, tiles };
};
const EMPTY_MAP = createEmptyMap('MAP_EMPTY', 'PURE_GRID');

export const MAPS: Record<string | number, GridMap> = {
  1: CHAPTER_1_MAP,
  2: CHAPTER_2_MAP,
  3: CHAPTER_3_MAP,
  'EMPTY': EMPTY_MAP
};

export const TILE_COSTS = {
  [TileType.EMPTY]: 1,
  [TileType.OBSTACLE]: 99,
  [TileType.HIGH_GROUND]: 2, 
  [TileType.TOXIC]: 2,
  [TileType.THRESHOLD]: 1,
  [TileType.DEBRIS]: 2 // Difficult Terrain
};

export const TILE_BONUSES = {
  [TileType.HIGH_GROUND]: { focus: 0.1 },
  [TileType.TOXIC]: { damage: 50 }, 
  [TileType.THRESHOLD]: { atk: 0.10, defMalus: 0.15 },
  [TileType.DEBRIS]: { speedMalus: 0.2 }
};

// --- NEW 50 AP ECONOMY CONFIG ---
export const ATTACK_CONFIG = {
  1: { ap: 12, mult: 0.8, name: 'SNAPFIRE', speedMod: 0.2 },
  2: { ap: 22, mult: 1.2, name: 'TACTICAL', speedMod: 0.0 },
  3: { ap: 38, mult: 2.2, name: 'OVERLOAD', speedMod: -0.3 }
};

export const BLOCK_CONFIG = {
  1: { ap: 8, base: 200, name: 'REACTIVE' },
  2: { ap: 18, base: 450, name: 'HARDENED' },
  3: { ap: 32, base: 900, name: 'FORTRESS' }
};

export const DESPERATION_MOVES: Record<UnitType, { name: string, flavor: string, effect: string }> = {
  [UnitType.PYRUS]: { name: "SOLAR FLARE", flavor: "NEURAL_CORE_IGNITION: PULSE_WAVE_EMITTED.", effect: "5.0x Damage to all targets." },
  [UnitType.GHOST]: { name: "PHANTOM STEP", flavor: "TRACE_DELETED: SYSTEM_GHOST_ACTIVE.", effect: "Gain 300 Block + 1 AP. Position Reset." },
  [UnitType.AEGIS]: { name: "IRON DOME", flavor: "CERAMIC_PLATING_LOCKDOWN: IMMOVABLE.", effect: "100% Damage Nullification for 2 turns." },
  [UnitType.REAPER]: { name: "FINAL HARVEST", flavor: "SCYTHE_PROTOCOL: SOUL_DATA_EXTRACTED.", effect: "Execute if < 30% HP, else 6.0x Damage." },
  [UnitType.HUNTER]: { name: "APEX PREDATOR", flavor: "SYNAPTIC_OVERDRIVE: PREY_SIGHT_LOCKED.", effect: "3x Attacks at 1.0x Damage." },
  [UnitType.MEDIC]: { name: "BIO-SURGE", flavor: "ADRENALINE_OVERFLOW: BIOLOGICAL_COST_PAID.", effect: "Heal 500 HP. Lose 1 Max AP permanently." }
};

export const ACTION_COSTS = {
  [ActionType.ATTACK]: 0, 
  [ActionType.BLOCK]: 0, 
  [ActionType.MOVE]: 5, // Base Cost in 50AP economy
  [ActionType.BOUNTY]: 0,
  [ActionType.RESERVE]: 0,
  [ActionType.PHASE]: 3,
  [ActionType.DESPERATION]: 0,
  [ActionType.COLLISION]: 0,
  [ActionType.CAPTURE]: 0,
  [ActionType.ITEM]: 0,
  [ActionType.INTERCEPT]: 0,
  [ActionType.VENT]: 0
};

export const DEFENSE_CONFIG = {
  1: { mitigation: 0, threshold: 200, name: 'REACTIVE' },
  2: { mitigation: 0, threshold: 450, name: 'HARDENED' },
  3: { mitigation: 0, threshold: 900, name: 'FORTRESS' },
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

// Update Chaos Deck for new AP Economy
export const CHAOS_DECK = [
  { name: 'SOLAR FLARE', description: 'Overheat penalty is doubled this round (30% per stack).' },
  { name: 'REBATE', description: 'Any AP spent on Block this round is refunded to the player next turn.' },
  { name: 'BOUNTY HUNT', description: 'Every player is automatically "Marked." Whoever deals damage this round gains +5 AP.' },
  { name: 'SYSTEM RESET', description: 'All players\' current AP pools are set to 5. (The "Greed Killer").' },
  { name: 'ADRENALINE', description: 'Stride +1 for all units.' },
  { name: 'FOG OF WAR', description: 'You cannot see the HP levels of other players for the next 2 rounds.' },
  { name: 'SUDDEN DEATH', description: 'Everyone loses 250 HP immediately.' },
  { name: 'TRADE DEAL', description: 'The player with the highest HP swaps their AP pool with the player with the lowest HP.' },
  { name: 'SHIELD WALL', description: 'Shield Values are +50% effective this round.' },
  { name: 'MIRAGE', description: 'All "Abilities" are disabled for this round. Pure Jurassic World math only.' }
];

export const MATERIAL_LORE: Record<MaterialType, string> = {
  [MaterialType.SCRAP]: "Salvaged from destroyed Sentry units in the outer rim.",
  [MaterialType.NEURAL_GLASS]: "Recovered from a shattered mainframe in Sector 4. Contains traces of an illegal AI.",
  [MaterialType.ISOTOPE_7]: "Confiscated from a black market courier. Highly unstable energy source.",
  [MaterialType.CLASSIFIED_CORE]: "Stolen directly from The Architect's private server. Decryption pending.",
  [MaterialType.CYBER_CORE]: "Pure data construct required for reprogramming unit logic gates."
};

// --- NEW ITEMS (ARMORY) ---
export const ARMORY_ITEMS: Item[] = [
  // PRIMARIES
  {
    id: 'W_VECTOR',
    name: 'Vector SMG',
    description: 'Lightweight Kinetic weapon. Increases mobility.',
    slot: ItemSlot.PRIMARY,
    cost: 50,
    range: 3,
    damageType: DamageType.KINETIC,
    weight: 1 // +1 Speed
  },
  {
    id: 'W_PLASMA',
    name: 'Plasma Rifle',
    description: 'Balanced Energy weapon. Melts shields.',
    slot: ItemSlot.PRIMARY,
    cost: 150,
    range: 5,
    damageType: DamageType.ENERGY,
    weight: 0
  },
  {
    id: 'W_THUMPER',
    name: 'Thumper GL',
    description: 'Heavy Explosive launcher. Destroys cover.',
    slot: ItemSlot.PRIMARY,
    cost: 300,
    range: 4,
    damageType: DamageType.EXPLOSIVE,
    weight: -1 // -1 Speed
  },
  
  // SECONDARIES
  {
    id: 'U_STIM',
    name: 'Stim Injector',
    description: 'Restores 200 HP immediately.',
    slot: ItemSlot.SECONDARY,
    cost: 50,
    maxUses: 2,
    effectType: 'HEAL',
    effectValue: 200
  },
  {
    id: 'U_EMP',
    name: 'EMP Grenade',
    description: 'Drains 5 AP from target enemy.',
    slot: ItemSlot.SECONDARY,
    cost: 100,
    maxUses: 1,
    effectType: 'EMP',
    effectValue: 5
  },
  
  // SHIELDS
  {
    id: 'S_AEGIS',
    name: 'Aegis Standard',
    description: 'Reliable kinetic plating. Standard defense.',
    slot: ItemSlot.SHIELD,
    cost: 50,
    defenseType: 'STANDARD',
    mitigationMod: 1.0
  },
  {
    id: 'S_REFLECT',
    name: 'Mirror Plate',
    description: 'Reflects 10% of blocked damage back.',
    slot: ItemSlot.SHIELD,
    cost: 200,
    defenseType: 'REFLECT',
    mitigationMod: 0.9
  }
];

export const MOD_TEMPLATES: Mod[] = [];
export const CONTRACT_TEMPLATES: Contract[] = [];
export const BATTLE_PASS_REWARDS = [];
