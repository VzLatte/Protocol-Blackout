
export enum GameMode {
  TACTICAL = 'TACTICAL',
  CHAOS = 'CHAOS'
}

export enum VisualLevel {
  LOW = 'LOW',
  MID = 'MID',
  HIGH = 'HIGH'
}

export enum Tab {
  MARKET = 'MARKET',
  OPERATIVES = 'OPERATIVES',
  TERMINAL = 'TERMINAL',
  ARCHIVE = 'ARCHIVE'
}

export enum Phase {
  SPLASH = 'SPLASH',
  GAME_TYPE_SELECTION = 'GAME_TYPE_SELECTION',
  CAMPAIGN_MAP = 'CAMPAIGN_MAP',
  STORE = 'STORE',
  MENU = 'MENU',
  SETUP_PLAYERS = 'SETUP_PLAYERS',
  BLACKOUT_SELECTION = 'BLACKOUT_SELECTION',
  TURN_ENTRY = 'TURN_ENTRY',
  PASS_PHONE = 'PASS_PHONE',
  RESOLUTION = 'RESOLUTION',
  GAME_OVER = 'GAME_OVER'
}

export enum UnitType {
  GHOST = 'GHOST',
  REAPER = 'REAPER',
  AEGIS = 'AEGIS',
  PYRUS = 'PYRUS',
  TROJAN = 'TROJAN',
  KILLSHOT = 'KILLSHOT',
  HUNTER = 'HUNTER',
  RAVEN = 'RAVEN',
  PYTHON = 'PYTHON',
  MEDIC = 'MEDIC',
  LEECH = 'LEECH',
  BATTERY = 'BATTERY',
  STATIC = 'STATIC'
}

export enum AIArchetype {
  TURTLE = 'TURTLE',
  AGGRO = 'AGGRO',
  STRATEGIST = 'STRATEGIST'
}

export enum AIDifficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}

export interface StatusEffect {
  type: 'BURN' | 'POISON' | 'PARALYZE';
  duration: number;
}

export interface Unit {
  type: UnitType;
  name: string;
  role: string;
  description: string;
  // Summary of the unit's main tactical advantage
  special: string;
  hp: number;
  maxHp: number;
  speed: number;
  focus: number;
  passiveDesc: string;
  activeDesc: string;
  cooldownMax: number; // -1 for once per game
  truth: string;
}

export interface AIConfig {
  archetype: AIArchetype;
  difficulty: AIDifficulty;
}

export interface Player {
  id: string;
  name: string;
  unit: Unit | null;
  hp: number;
  maxHp: number;
  ap: number;
  fatigue: number; 
  isEliminated: boolean;
  isAI: boolean;
  aiConfig?: AIConfig;
  totalReservedAp: number;
  cooldown: number;
  activeUsed: boolean;
  statuses: StatusEffect[];
  isAbilityActive: boolean;
  targetLockId?: string; // For Hunter's mark
  overclockTurns?: number; // For Trojan
}

export enum ActionType {
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  MOVE = 'MOVE', 
  RESERVE = 'RESERVE',
  PHASE = 'PHASE',
  ABILITY = 'ABILITY',
  BOUNTY = 'BOUNTY'
}

export enum RangeZone {
  CLOSE = 'CLOSE',
  MID = 'MID',
  FAR = 'FAR'
}

export enum MoveIntent {
  CLOSE = 'CLOSE',
  OPEN = 'OPEN'
}

export interface Action {
  blockAp: number;
  attackAp: number;
  moveAp: number;
  abilityActive: boolean;
  targetId?: string;
  moveIntent?: MoveIntent;
}

export interface TurnData {
  playerId: string;
  action: Action;
}

export interface ResolutionLog {
  attackerId: string;
  attackerName?: string;
  targetId?: string;
  targetName?: string;
  type: ActionType;
  damage?: number;
  mitigatedAmount?: number;
  shield?: number; 
  apSpent?: number;
  resultMessage: string;
  isElimination?: boolean;
  isCracked?: boolean;
  mitigationPercent?: number;
  defenseTier?: number;
  rangeChange?: string;
  fatigueGain?: number;
}

export interface TutorialState {
  step: number;
  isActive: boolean;
}
