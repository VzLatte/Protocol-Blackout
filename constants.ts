
import { ActionType, RangeZone, AIArchetype, AIDifficulty, UnitType } from './types';

export const INITIAL_HP = 1000;
export const BASE_ATTACK_DMG = 120;

// New Tiered System Configuration
// AP Costs: Level 1 = 1, Level 2 = 3 (1+2), Level 3 = 6 (1+2+3)
export const ATTACK_CONFIG = {
  1: { ap: 1, mult: 1.0, name: 'PROBE' },
  2: { ap: 3, mult: 2.25, name: 'STRIKE' },
  3: { ap: 6, mult: 4.5, chip: 0.1, name: 'EXECUTE' } // 10% Chip Damage
};

export const BLOCK_CONFIG = {
  1: { ap: 1, base: 150, name: 'COVER' },
  2: { ap: 3, base: 350, name: 'BARRIER' },
  3: { ap: 6, base: 650, name: 'FORTRESS' }
};

// Legacy cost map for simple lookups, though logic is now dynamic
export const ACTION_COSTS = {
  [ActionType.ATTACK]: 0, // Dynamic
  [ActionType.BLOCK]: 0, // Dynamic
  [ActionType.MOVE]: 1, // Base, increases with fatigue
  [ActionType.BOUNTY]: 0,
  [ActionType.RESERVE]: 0,
  [ActionType.PHASE]: 3,
};

export const DEFENSE_CONFIG = {
  // Legacy mapping kept for compatibility with UI components if needed
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
  { name: 'ADRENALINE', description: 'Move Fatigue is reset to 0 for everyone.' },
  { name: 'FOG OF WAR', description: 'You cannot see the HP levels of other players for the next 2 rounds.' },
  { name: 'SUDDEN DEATH', description: 'Everyone loses 150 HP immediately.' },
  { name: 'TRADE DEAL', description: 'The player with the highest HP swaps their AP pool with the player with the lowest HP.' },
  { name: 'SHIELD WALL', description: 'Shield Values are +50% effective this round.' },
  { name: 'MIRAGE', description: 'All "Abilities" are disabled for this round. Pure Jurassic World math only.' }
];

export const CHAPTER_1_LEVELS = [
  {
    id: 1,
    name: "STATIC THRESHOLD",
    enemyUnit: UnitType.AEGIS,
    archetype: AIArchetype.TURTLE,
    difficulty: AIDifficulty.EASY,
    lesson: "SHIELD_CRACKING: Defense has limits. Overwhelm thresholds to minimize mitigation.",
    taunts: {
      win: "BARRIER_NEUTRALIZED. Integrity is a fragile concept.",
      loss: "IMMOVABLE. Your aggression lacked the necessary mathematical weight."
    }
  },
  {
    id: 2,
    name: "NEURAL FRICTION",
    enemyUnit: UnitType.HUNTER,
    archetype: AIArchetype.AGGRO,
    difficulty: AIDifficulty.NORMAL,
    lesson: "FATIGUE_MANAGEMENT: Every maneuver strains the system. Repetitive movement will drain your AP.",
    taunts: {
      win: "TRACE_LOST. You've escaped the cycle... for now.",
      loss: "CALCULATED_END. Speed is useless when you have nowhere to hide."
    }
  },
  {
    id: 3,
    name: "BUFFER OVERFLOW",
    enemyUnit: UnitType.PYRUS,
    archetype: AIArchetype.STRATEGIST,
    difficulty: AIDifficulty.NORMAL,
    lesson: "ENERGY_RESERVING: Aggression isn't always optimal. Reserve energy to prepare for high-tier defensive sequences.",
    taunts: {
      win: "OVERHEAT_STABILIZED. The flame flickers out.",
      loss: "SYSTEM_INCINERATED. You waited too long to cool the logic gates."
    }
  },
  {
    id: 4,
    name: "BLACKOUT PROTOCOL",
    enemyUnit: UnitType.LEECH,
    archetype: AIArchetype.STRATEGIST,
    difficulty: AIDifficulty.HARD,
    lesson: "SYNERGETIC_CYCLES: The final gate. Adapt to parasitic energy theft or face total extraction.",
    taunts: {
      win: "PURGATORY_BYPASSED. The network depth awaits.",
      loss: "ENERGY_SIPHONED. You are now just a memory in the Establishment archive."
    }
  }
];
