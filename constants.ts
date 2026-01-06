
import { ActionType, RangeZone, AIArchetype, AIDifficulty, UnitType } from './types';

export const INITIAL_HP = 1000;
export const ACTION_COSTS = {
  [ActionType.ATTACK]: 2,
  [ActionType.BLOCK]: 1,
  [ActionType.MOVE]: 1, // Base cost, scales with Fatigue
  [ActionType.BOUNTY]: 1,
  [ActionType.RESERVE]: 0,
  [ActionType.PHASE]: 3,
};

export const BASE_ATTACK_DMG = 125;

// Defense Overhaul Configuration
export const DEFENSE_CONFIG = {
  1: { mitigation: 0.30, crackedMitigation: 0.10, threshold: 200, name: 'TACTICAL COVER' },
  2: { mitigation: 0.55, crackedMitigation: 0.25, threshold: 400, name: 'FULL BARRIER' },
  3: { mitigation: 0.75, crackedMitigation: 0.40, threshold: 600, name: 'OVERLOAD SHIELD' },
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
  { name: 'SOLAR FLARE', description: 'All Shield Mitigation is reduced by 20% flat. (A "Blood Round").' },
  { name: 'REBATE', description: 'Any AP spent on Block this round is refunded to the player next turn.' },
  { name: 'BOUNTY HUNT', description: 'Every player is automatically "Marked." Whoever deals damage this round gains +1 AP.' },
  { name: 'SYSTEM RESET', description: 'All players\' current AP pools are set to 0. (The "Greed Killer").' },
  { name: 'OVERCLOCK', description: 'Every 1 AP spent on Attack deals 250 damage instead of 125. (Extreme lethality).' },
  { name: 'FOG OF WAR', description: 'You cannot see the HP levels of other players for the next 2 rounds.' },
  { name: 'SUDDEN DEATH', description: 'Everyone loses 150 HP immediately.' },
  { name: 'TRADE DEAL', description: 'The player with the highest HP swaps their AP pool with the player with the lowest HP.' },
  { name: 'SHIELD WALL', description: 'Shield Thresholds are doubled this round.' },
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
