
import { UnitType, Unit, ActionType } from './types';

export const INITIAL_HP = 40;
export const MAX_AP_DEFAULT = 10;
export const AP_INCOME_DEFAULT = 2;

export const ACTION_COSTS = {
  [ActionType.ATTACK]: 1,
  [ActionType.BLOCK]: 1,
  [ActionType.BOUNTY]: 1,
  [ActionType.RESERVE]: 0,
  [ActionType.PHASE]: 3,
};

export const BASE_ATTACK_DMG = 5;
export const BASE_BLOCK_SHIELD = 5;

export const TIME_LIMITS = [0, 15, 30, 60];

export const UNIT_PRICES: Record<UnitType, { tier: number, cost: number }> = {
  [UnitType.GHOST]: { tier: 1, cost: 0 },
  [UnitType.TITAN]: { tier: 1, cost: 0 },
  [UnitType.REAPER]: { tier: 1, cost: 0 },
  [UnitType.LEECH]: { tier: 2, cost: 500 },
  [UnitType.OVERLOAD]: { tier: 2, cost: 500 },
  [UnitType.MASK]: { tier: 3, cost: 1500 },
  [UnitType.GAMBLER]: { tier: 3, cost: 1500 },
};

export const UNITS: Record<UnitType, Unit> = {
  [UnitType.GHOST]: {
    type: UnitType.GHOST,
    name: 'THE GHOST',
    role: 'The Counter',
    description: 'Punishes "All-In" attacks.',
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    special: 'Phase: If you spend exactly 3 AP on Block (Phase), you take 0 damage from all sources.',
    truth: 'If the enemy spends 8 AP to kill you and you spend 3, they lose the game.',
  },
  [UnitType.TITAN]: {
    type: UnitType.TITAN,
    name: 'THE TITAN',
    role: 'The Wall',
    description: 'Punishes small, constant pokes.',
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    special: 'Spike: Every 1 AP spent on Block negates 5 damage and reflects 2 damage back to the attacker.',
    truth: 'Attacking a Titan with low HP is suicide.',
  },
  [UnitType.REAPER]: {
    type: UnitType.REAPER,
    name: 'THE REAPER',
    role: 'The Finisher',
    description: 'Prevents "Stall" players from sitting at low health.',
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    special: 'Harvest: Attacks deal +3 bonus damage (flat) if the target is below 15 HP.',
    truth: 'Prevents Stall; forces the end of the game.',
  },
  [UnitType.LEECH]: {
    type: UnitType.LEECH,
    name: 'THE LEECH',
    role: 'The Parasite',
    description: 'The ultimate counter to "Greedy" players.',
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    special: 'Drain: If your target chooses "Reserve" while you "Attack," you heal 3 HP per AP spent.',
    truth: 'Hoarding 10 AP becomes a liability against a Leech.',
  },
  [UnitType.OVERLOAD]: {
    type: UnitType.OVERLOAD,
    name: 'THE OVERLOAD',
    role: 'The Battery',
    description: 'Weak early, god-like late.',
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    special: 'Surge: Your AP cap is 12 (instead of 10), and you gain +3 AP per turn instead of +2.',
    truth: 'If they survive to Turn 5, they become an unstoppable god.',
  },
  [UnitType.MASK]: {
    type: UnitType.MASK,
    name: 'THE MASK',
    role: 'The Mimic',
    description: 'Adds unpredictable chaos.',
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    special: 'Identity Theft: On Turn 1, The Mask is hidden. On Turn 2, they permanently turn into a random unit from this list.',
    truth: 'Opponents don\'t know how to counter you for the first 2 rounds.',
  },
  [UnitType.GAMBLER]: {
    type: UnitType.GAMBLER,
    name: 'THE GAMBLER',
    role: 'The High Roller',
    description: 'Desperate measures for desperate times.',
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    special: 'Desperation: Deal +1 damage for every 5 HP you are missing.',
    truth: 'The closer I am to death, the faster you will follow.',
  }
};

export const CHAOS_DECK = [
  { name: 'SOLAR FLARE', description: 'All Block values are reduced to 0. (A "Blood Round" where everyone must attack or reserve).' },
  { name: 'REBATE', description: 'Any AP spent on Block this round is refunded to the player next turn.' },
  { name: 'BOUNTY HUNT', description: 'Every player is automatically "Marked." Whoever deals damage this round gains +1 AP.' },
  { name: 'SYSTEM RESET', description: 'All players\' current AP pools are set to 0. (The "Greed Killer").' },
  { name: 'OVERCLOCK', description: 'Every 1 AP spent on Attack deals 10 damage instead of 5. (Extreme lethality).' },
  { name: 'FOG OF WAR', description: 'You cannot see the HP levels of other players for the next 2 rounds.' },
  { name: 'SUDDEN DEATH', description: 'Everyone loses 5 HP immediately.' },
  { name: 'TRADE DEAL', description: 'The player with the highest HP swaps their AP pool with the player with the lowest HP.' },
  { name: 'SHIELD WALL', description: 'All Blocks negate double damage, but Attacks cost 2 AP instead of 1.' },
  { name: 'MIRAGE', description: 'All "Abilities" are disabled for this round. Pure Jurassic World math only.' }
];
