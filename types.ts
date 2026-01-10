
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
  AGENCY = 'AGENCY', 
  ARMORY = 'ARMORY', 
  TERMINAL = 'TERMINAL', 
  MARKET = 'MARKET' 
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
  PYRUS = 'PYRUS',
  AEGIS = 'AEGIS',
  GHOST = 'GHOST',
  REAPER = 'REAPER',
  HUNTER = 'HUNTER',
  MEDIC = 'MEDIC'
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
  CONTROL = 'CONTROL' // New
}

// --- NEW COMBAT TYPES ---
export enum DamageType {
  KINETIC = 'KINETIC',
  ENERGY = 'ENERGY',
  EXPLOSIVE = 'EXPLOSIVE'
}

export enum ItemSlot {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  SHIELD = 'SHIELD'
}

export interface Item {
  id: string;
  name: string;
  description: string;
  slot: ItemSlot;
  cost: number;
  
  // Primary Stats
  range?: number;
  damageType?: DamageType;
  weight?: number; // Affects stride (-1, 0, +1)
  
  // Secondary Stats
  maxUses?: number;
  effectType?: 'HEAL' | 'EMP' | 'SMOKE' | 'STIM';
  effectValue?: number;

  // Shield Stats
  defenseType?: 'STANDARD' | 'REFLECT' | 'PHASE';
  mitigationMod?: number; // 1.0 = normal, 1.2 = 20% better
}

export interface Loadout {
  primary: Item | null;
  secondary: Item | null;
  shield: Item | null;
}

// --- ECONOMY & CRAFTING ---
export enum MaterialType {
  SCRAP = 'SCRAP', 
  NEURAL_GLASS = 'NEURAL_GLASS', 
  ISOTOPE_7 = 'ISOTOPE_7', 
  CLASSIFIED_CORE = 'CLASSIFIED_CORE',
  CYBER_CORE = 'CYBER_CORE' // New Mastery Currency
}

export interface Mod {
  id: string;
  instanceId: string;
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'ELITE' | 'LEGENDARY';
  stats: any;
  slot: string;
  scrapValue: number;
}

export interface Contract {
  id: string;
  title: string;
  description: string;
  rewardStanding: number;
  rewardMaterial?: { type: MaterialType, amount: number };
  conditionType: 'WIN_MATCH' | 'DEAL_DAMAGE' | 'USE_TIER_1_ONLY' | 'NO_DAMAGE_TAKEN';
  targetValue: number;
  currentValue: number;
  completed: boolean;
  claimed: boolean;
}

// --- MASTERY SYSTEM ---
export interface MasteryStats {
  hp?: number;
  maxHp?: number;
  ap?: number;
  speed?: number;
  atkMod?: number; // 1.1 = +10%
  defMod?: number;
  range?: number;
  immuneTo?: string[]; // 'BURN', 'POISON'
}

export interface MasteryNode {
  id: string;
  levelReq: number;
  type: 'STAT' | 'GATE';
  name: string;
  description: string;
  cost: number; // Cyber Cores
  stats: MasteryStats;
  parentId?: string;
  conflictId?: string; // If this is Gate A, conflictId is Gate B
}

// --- GRID TYPES ---
export enum TileType {
  EMPTY = 0,
  OBSTACLE = 1,
  HIGH_GROUND = 2,
  TOXIC = 3,
  THRESHOLD = 4,
  DEBRIS = 5 // New Difficult Terrain
}

export interface Position {
  x: number;
  y: number;
}

export interface GridMap {
  id: string;
  name: string;
  tiles: TileType[][];
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
  customSquad?: UnitType[]; // For mixed enemy types
  cumulativeCapture?: boolean; // For Control mode
}

export interface StatusEffect {
  type: 'BURN' | 'POISON' | 'PARALYZE' | 'BLIND' | 'STAGGER' | 'AP_BURN' | 'PHASED' | 'IRON_DOME' | 'APEX_PREDATOR' | 'IMMUNE_BURN';
  duration: number;
  value?: number;
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
  range: number; 
  atkStat: number; 
  defStat: number; 
  passiveDesc: string;
  activeDesc: string;
  desperationName?: string;
  desperationDesc?: string;
  cooldownMax: number; 
  truth: string;
  image?: string;
  minTierToPierceWalls?: number; 
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
  position: Position;
  moveFatigue: number; 
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
  captureTurns: number;
  loadout: Loadout; // New Loadout System
  itemUses: { current: number, max: number }; // For Secondary
  tempSpeedMod?: number; // Kinetic Stagger
  // Runtime Stats Modifiers
  statModifiers?: MasteryStats;
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
  CAPTURE = 'CAPTURE',
  ITEM = 'ITEM',
  INTERCEPT = 'INTERCEPT',
  VENT = 'VENT' // New Log Type
}

export interface Action {
  blockAp: number; 
  attackAp: number; 
  moveAp: number; 
  movePath?: Position[]; 
  abilityActive: boolean;
  isDesperation?: boolean;
  useItem?: boolean; // New: Trigger Secondary
  targetId?: string;
  moveDest?: Position; 
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
  damageType?: DamageType; 
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
  
  // New Visual Data
  impactPoint?: Position; 
  originPoint?: Position; 
  path?: Position[]; 
}

export interface TutorialState {
  step: number;
  isActive: boolean;
}
