

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

export enum RangeZone {
  CLOSE = 'CLOSE',
  MID = 'MID',
  FAR = 'FAR'
}

export enum MoveIntent {
  CLOSE = 'CLOSE',
  OPEN = 'OPEN'
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
  DATA_STORM = 'DATA_STORM',
  VIRAL_INVERSION = 'VIRAL_INVERSION',
  LAVA_FLOOR = 'LAVA_FLOOR',
  FOG_OF_WAR = 'FOG_OF_WAR',
  AP_FLUX = 'AP_FLUX',
  NULL_FIELD = 'NULL_FIELD',
  GRAVITY_WELL = 'GRAVITY_WELL',
  OVERLOAD = 'OVERLOAD',
}

export enum WinCondition {
  ELIMINATION = 'ELIMINATION',
  SURVIVAL = 'SURVIVAL',
  UPLOAD = 'UPLOAD',
  RESOURCE_HOLD = 'RESOURCE_HOLD',
}

// --- GRID TYPES ---
export enum TileType {
  EMPTY = 0,
  OBSTACLE = 1,     // Blocks movement and LOS
  HIGH_GROUND = 2,  // Cost 2 Move Points, +0.1 Focus
  TOXIC = 3,        // Cost 2 Move Points, No bonus
  THRESHOLD = 4     // Capture point. +Risk/+Reward. Win cond.
}

export interface Position {
  x: number;
  y: number;
}

export interface GridMap {
  id: string;
  name: string;
  tiles: TileType[][]; // 7x7 grid
}
// ------------------

export interface CampaignLevel {
  id: string;
  chapter: number;
  sequence: number;
  title: string;
  description: string;
  enemyUnit: UnitType;
  enemyName?: string; 
  enemyAi: AIArchetype;
  enemyCount: number; 
  enemyHpMult: number; 
  hazard: HazardType;
  winCondition: WinCondition;
  winValue: number; 
  creditReward: number;
  xpReward: number;
  unlockUnit?: UnitType; 
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
  range: number; // New Range Stat
  atkStat: number; 
  defStat: number; 
  passiveDesc: string;
  activeDesc: string;
  cooldownMax: number; 
  truth: string;
  image?: string;
  minTierToPierceWalls?: number; // AI Logic extensibility
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
  position: Position; // New: Grid Position
  moveFatigue: number; // Deprecated but kept for type safety in legacy logs
  blockFatigue: number; 
  isEliminated: boolean;
  isAI: boolean;
  aiConfig?: AIConfig;
  totalReservedAp: number;
  cooldown: number;
  activeUsed: boolean;
  desperationUsed: boolean; 
  statuses: StatusEffect[];
  isAbilityActive: boolean;
  targetLockId?: string;
  overclockTurns?: number;
  isBoss?: boolean;
  captureTurns: number; // New: Track consecutive turns on threshold
}

export enum ActionType {
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  MOVE = 'MOVE', 
  RESERVE = 'RESERVE',
  PHASE = 'PHASE',
  ABILITY = 'ABILITY',
  BOUNTY = 'BOUNTY',
  DESPERATION = 'DESPERATION',
  COLLISION = 'COLLISION',
  CAPTURE = 'CAPTURE'
}

export interface Action {
  blockAp: number; // 0-3
  attackAp: number; // 0-3
  moveAp: number; // AP Spent on movement
  movePath?: Position[]; // New: List of steps taken
  abilityActive: boolean;
  isDesperation?: boolean;
  targetId?: string;
  moveDest?: Position; // Legacy/End Point
  moveIntent?: MoveIntent; // Legacy
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
  mathDetails?: string; 
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
