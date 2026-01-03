
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
  TITAN = 'TITAN',
  REAPER = 'REAPER',
  LEECH = 'LEECH',
  OVERLOAD = 'OVERLOAD',
  MASK = 'MASK',
  GAMBLER = 'GAMBLER'
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

export interface AIConfig {
  archetype: AIArchetype;
  difficulty: AIDifficulty;
}

export interface Unit {
  type: UnitType;
  name: string;
  role: string;
  description: string;
  hp: number;
  maxHp: number;
  special: string;
  truth: string;
}

export interface Player {
  id: string;
  name: string;
  unit: Unit | null;
  hp: number;
  maxHp: number;
  ap: number;
  isEliminated: boolean;
  isAI: boolean;
  aiConfig?: AIConfig;
  bountyOn?: string;
  apRefundNext?: number;
  originalType?: UnitType;
}

export enum ActionType {
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  BOUNTY = 'BOUNTY',
  RESERVE = 'RESERVE',
  PHASE = 'PHASE'
}

export interface Action {
  blockAp: number;
  attackAp: number;
  targetId?: string;
}

export interface TurnData {
  playerId: string;
  action: Action;
}

export interface ResolutionLog {
  attackerId: string;
  targetId?: string;
  type: ActionType;
  damage?: number;
  blocked?: number;
  reflected?: number;
  shield?: number;
  resultMessage: string;
  isElimination?: boolean;
}
