
export enum GameMode {
  TACTICAL = 'TACTICAL',
  CHAOS = 'CHAOS'
}

export enum VisualLevel {
  LOW = 'LOW',
  MID = 'MID',
  HIGH = 'HIGH'
}

export enum DifficultyLevel {
  NORMAL = 'NORMAL',
  OVERCLOCK = 'OVERCLOCK',
  BLACKOUT = 'BLACKOUT'
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
  CHAPTER_SELECTION = 'CHAPTER_SELECTION',
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
  STATIC = 'STATIC',
  GLITCH = 'GLITCH',
  WARDEN = 'WARDEN',
  SINGULARITY = 'SINGULARITY'
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

export enum HazardType {
  NONE = 'NONE',
  DATA_STORM = 'DATA_STORM', // Periodic damage at Far range
  VIRAL_INVERSION = 'VIRAL_INVERSION', // Healing hurts
  LAVA_FLOOR = 'LAVA_FLOOR', // Movement deals damage
  FOG_OF_WAR = 'FOG_OF_WAR', // Hidden enemy intent/range
  AP_FLUX = 'AP_FLUX', // Random AP generation
  NULL_FIELD = 'NULL_FIELD', // No Abilities allowed
  GRAVITY_WELL = 'GRAVITY_WELL', // Movement costs double
  OVERLOAD = 'OVERLOAD', // High damage deals recoil
}

export enum WinCondition {
  ELIMINATION = 'ELIMINATION', // Kill enemy
  SURVIVAL = 'SURVIVAL', // Survive X rounds
  UPLOAD = 'UPLOAD', // End turn at Range 0 for X turns
  RESOURCE_HOLD = 'RESOURCE_HOLD', // End with X AP
}

export interface CampaignLevel {
  id: string;
  chapter: number;
  sequence: number; // 1-12
  title: string;
  description: string;
  
  // Enemy Configuration
  enemyUnit: UnitType;
  enemyName?: string; 
  enemyAi: AIArchetype;
  enemyCount: number; 
  enemyHpMult: number; 
  
  // Tactical Modifiers
  hazard: HazardType;
  winCondition: WinCondition;
  winValue: number; 
  
  // Rewards
  creditReward: number;
  xpReward: number;
  unlockUnit?: UnitType; 
  
  // Narrative
  introText: string;
  winText: string;
  lossText: string;
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
  special: string;
  hp: number;
  maxHp: number;
  speed: number;
  focus: number;
  dmgMultiplier: number;
  passiveDesc: string;
  activeDesc: string;
  cooldownMax: number; 
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
  targetLockId?: string;
  overclockTurns?: number;
  isBoss?: boolean;
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
  fatigueGained?: number;
}

export interface TutorialState {
  step: number;
  isActive: boolean;
}
