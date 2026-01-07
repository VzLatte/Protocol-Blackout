
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
  atkStat: number; // Replaces dmgMultiplier
  defStat: number; // New stat for Shield scaling
  passiveDesc: string;
  activeDesc: string;
  cooldownMax: number; 
  truth: string;
  image?: string;
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
  moveFatigue: number; // Tracks consecutive moves for cost scaling
  blockFatigue: number; // "Overheat" - Tracks consecutive blocks
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

export interface Action {
  blockAp: number; // 0-3
  attackAp: number; // 0-3
  moveAp: number; // 0 or 1 (cost calculated based on fatigue)
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
  isCracked?: boolean; // Used for "Chip Damage" or Overheat break
  mitigationPercent?: number;
  defenseTier?: number;
  rangeChange?: string;
  fatigueGained?: number;
}

export interface TutorialState {
  step: number;
  isActive: boolean;
}
