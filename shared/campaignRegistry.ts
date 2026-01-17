
import { UnitType, AIArchetype, HazardType, WinCondition, CampaignLevel } from './types';

const BASE_CREDITS = 100;
const BASE_XP = 50;

// Helper to build levels cleanly
const createLevel = (
  chapter: number, 
  seq: number, 
  title: string, 
  unit: UnitType, 
  ai: AIArchetype,
  hazard: HazardType,
  details: Partial<CampaignLevel>
): CampaignLevel => {
  return {
    id: `C${chapter}-L${seq}`,
    chapter,
    sequence: seq,
    title,
    description: details.description || "Terminate the target.",
    enemyUnit: unit,
    enemyAi: ai,
    enemyCount: details.enemyCount || 1,
    enemyHpMult: details.enemyHpMult || 1.0,
    hazard,
    winCondition: details.winCondition || WinCondition.ELIMINATION,
    winValue: details.winValue || 0,
    creditReward: (BASE_CREDITS * chapter) + (seq * 10),
    xpReward: (BASE_XP * chapter) + (seq * 5),
    unlockUnit: unit, // Default: Beating them unlocks them
    introText: details.introText || "Connection established. Eliminate hostile.",
    winText: details.winText || "Target purged. Data secured.",
    lossText: details.lossText || "Signal lost. Recompiling...",
    ...details
  };
};

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
  
  // =========================================================================
  // CHAPTER 1: THE OUTER RIM
  // Focus: Fundamentals of AP, Range, and Positioning.
  // =========================================================================
  
  createLevel(1, 1, "Hello World", UnitType.AEGIS, AIArchetype.TURTLE, HazardType.NONE, {
    description: "The 'Block' tutorial. Time your strikes.",
    introText: "The Firewall Sentry blocks often. Patience is key.",
    winCondition: WinCondition.ELIMINATION,
    unlockUnit: UnitType.AEGIS
  }),

  createLevel(1, 2, "Static Noise", UnitType.PYRUS, AIArchetype.AGGRO, HazardType.NONE, {
    description: "The 'Initiative' tutorial. Counter the burn.",
    introText: "Aggressive signal detected. Do not trade damage recklessly.",
    winCondition: WinCondition.ELIMINATION,
    unlockUnit: UnitType.PYRUS
  }),

  createLevel(1, 3, "High Ground", UnitType.REAPER, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Force the player to take the center hill.",
    introText: "Strategic position identified. Occupy the high ground.",
    winCondition: WinCondition.CONTROL,
    winValue: 3, // Updated to 3
    unlockUnit: UnitType.REAPER
  }),

  createLevel(1, 4, "The Shortcut", UnitType.GHOST, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Evasion tutorial. Catch the Ghost.",
    introText: "Target is evasive. Predict their movement.",
    winCondition: WinCondition.ELIMINATION,
    unlockUnit: UnitType.GHOST
  }),

  createLevel(1, 5, "Threshold", UnitType.HUNTER, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "The Hunter will try to pull you off the point.",
    introText: "Hold the line. The Hunter is coming.",
    winCondition: WinCondition.CONTROL,
    winValue: 3,
    unlockUnit: UnitType.HUNTER
  }),

  createLevel(1, 6, "System Purge", UnitType.GHOST, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Pure survival for 8 turns.",
    introText: "System purge imminent. Survive until the cycle ends.",
    winCondition: WinCondition.SURVIVAL,
    winValue: 8,
  }),

  createLevel(1, 7, "Data Leak", UnitType.MEDIC, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Sustain/Attrition tutorial.",
    introText: "Target is regenerating. Out-damage their sustain.",
    winCondition: WinCondition.ELIMINATION,
    unlockUnit: UnitType.MEDIC
  }),

  createLevel(1, 8, "Pressure Map", UnitType.AEGIS, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Force the player to fight a tank on the point.",
    introText: "Heavy armor on the objective. Displace or destroy.",
    winCondition: WinCondition.CONTROL,
    winValue: 3,
  }),

  createLevel(1, 9, "Triangulation", UnitType.HUNTER, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Marking tutorial. Avoid the lock.",
    introText: "You are being tracked. Break the line of sight.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(1, 10, "Gravity Well", UnitType.PYRUS, AIArchetype.TURTLE, HazardType.GRAVITY_WELL, {
    description: "Movement penalty tutorial.",
    introText: "Heavy gravity detected. Movement costs are doubled.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(1, 11, "Tag Team", UnitType.GHOST, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Focus-fire tutorial.",
    introText: "Multiple hostiles. Coordinate your defense.",
    customSquad: [UnitType.GHOST, UnitType.PYRUS],
    enemyCount: 2,
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(1, 12, "GATEKEEPER", UnitType.AEGIS, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Boss: You must hold the gate to win.",
    enemyName: "THE GATEKEEPER",
    introText: "I am the edge of the known network. You go no further.",
    winCondition: WinCondition.CONTROL,
    winValue: 3,
    enemyHpMult: 2.0,
    creditReward: 1000
  }),

  // =========================================================================
  // CHAPTER 2: THE NEURAL HUB
  // Focus: Hazard adaptation and Resource management.
  // =========================================================================

  createLevel(2, 1, "Viral Load", UnitType.MEDIC, AIArchetype.STRATEGIST, HazardType.VIRAL_INVERSION, {
    description: "Viral Inversion: Healing = Damage.",
    introText: "Medical protocols corrupted. Healing will harm you.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(2, 2, "Logic Loop", UnitType.GHOST, AIArchetype.STRATEGIST, HazardType.AP_FLUX, {
    description: "AP Flux: Hold ground with random AP.",
    introText: "Power regulation failing. Adapt to flux.",
    winCondition: WinCondition.CONTROL,
    winValue: 4, // Updated to 4
  }),

  createLevel(2, 3, "Floor is Lava", UnitType.PYRUS, AIArchetype.AGGRO, HazardType.LAVA_FLOOR, {
    description: "Movement deals damage.",
    introText: "The floor is unstable. Move only when necessary.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(2, 4, "Deep Freeze", UnitType.AEGIS, AIArchetype.TURTLE, HazardType.NONE, {
    description: "No Reserve AP allowed.",
    introText: "Cryogenic statis. Energy storage disabled.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(2, 5, "Backdoor", UnitType.GHOST, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Enemy ignores Tier 1 Shields.",
    introText: "Piercing protocols active. Heavy defense required.",
    winCondition: WinCondition.CONTROL,
    winValue: 3, // Updated to 3
  }),

  createLevel(2, 6, "Heartbleed", UnitType.MEDIC, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Ability usage costs HP.",
    introText: "Bio-link established. Abilities drain life.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(2, 7, "Memory Leak", UnitType.GHOST, AIArchetype.STRATEGIST, HazardType.FOG_OF_WAR, {
    description: "Fog of War survival.",
    introText: "Visual feed corrupted. Survive the darkness.",
    winCondition: WinCondition.SURVIVAL,
    winValue: 10,
  }),

  createLevel(2, 8, "Deadlock", UnitType.AEGIS, AIArchetype.TURTLE, HazardType.NONE, {
    description: "Duo: High defense + Healing.",
    customSquad: [UnitType.AEGIS, UnitType.MEDIC],
    enemyCount: 2,
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(2, 9, "Short Circuit", UnitType.PYRUS, AIArchetype.AGGRO, HazardType.OVERLOAD, {
    description: "Overload: High damage reflects back to you.",
    introText: "Feedback loops active. Control your output.",
    winCondition: WinCondition.CONTROL,
    winValue: 4, // Updated to 4
  }),

  createLevel(2, 10, "Panic", UnitType.REAPER, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Execute threshold active.",
    introText: "Do not fall below critical integrity.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(2, 11, "Decay", UnitType.HUNTER, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Max HP drops every turn. Speed is key.",
    introText: "System entropy increasing. Hurry.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(2, 12, "ARCHITECT", UnitType.REAPER, AIArchetype.STRATEGIST, HazardType.AP_FLUX, {
    description: "Boss: The Architect swaps your AP.",
    enemyName: "THE ARCHITECT",
    introText: "I wrote the rules. I can rewrite your energy.",
    winCondition: WinCondition.CONTROL,
    winValue: 5, // Updated to 5
    enemyHpMult: 2.5,
    creditReward: 2000
  }),

  // =========================================================================
  // CHAPTER 3: THE CORE
  // Focus: Master-level execution and rule-breaking.
  // =========================================================================

  createLevel(3, 1, "Zero Day", UnitType.REAPER, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Sniper Alley: Range 2 (Far) damage is +50%.",
    introText: "Long range vectors amplified. Close the distance.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(3, 2, "Fatal Error", UnitType.GHOST, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Glass: 50% HP / 200% DMG for all.",
    introText: "Safety rails removed. One hit kills.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(3, 3, "Rubber Band", UnitType.AEGIS, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Pulled to Range 0 every turn. Melee brawl.",
    introText: "Magnetic tether active. Prepare for melee.",
    winCondition: WinCondition.CONTROL,
    winValue: 4, // Updated to 4
  }),

  createLevel(3, 4, "Echo Chamber", UnitType.GHOST, AIArchetype.STRATEGIST, HazardType.FOG_OF_WAR, {
    description: "Find the 1 real unit among 2 illusions.",
    enemyCount: 3,
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(3, 5, "Power Surge", UnitType.PYRUS, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Both start with 10 AP. Extreme aggression.",
    introText: "Unrestricted power flow.",
    winCondition: WinCondition.SURVIVAL,
    winValue: 6,
  }),

  createLevel(3, 6, "The Anvil", UnitType.AEGIS, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "One blocks, one burns. Hold the center.",
    customSquad: [UnitType.AEGIS, UnitType.PYRUS],
    enemyCount: 2,
    winCondition: WinCondition.CONTROL,
    winValue: 5, // Updated to 5
  }),

  createLevel(3, 7, "Null Pointer", UnitType.HUNTER, AIArchetype.STRATEGIST, HazardType.NULL_FIELD, {
    description: "No abilities allowed. Pure tactics.",
    introText: "Abilities offline. Rely on fundamentals.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(3, 8, "Predator", UnitType.HUNTER, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Enemy always wins Initiative.",
    introText: "They are faster than light.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(3, 9, "Redundancy", UnitType.MEDIC, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "They heal each other while you try to sit on the point.",
    customSquad: [UnitType.MEDIC, UnitType.MEDIC],
    enemyCount: 2,
    winCondition: WinCondition.CONTROL,
    winValue: 5, // Updated to 5
  }),

  createLevel(3, 10, "Total Eclipse", UnitType.REAPER, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Blackout Phase from Round 1.",
    introText: "Lights out. Good luck.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(3, 11, "Mirror", UnitType.GHOST, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Enemy is a copy of your current unit.",
    introText: "Fighting self... match detected.",
    winCondition: WinCondition.ELIMINATION,
  }),

  createLevel(3, 12, "THE SOURCE", UnitType.REAPER, AIArchetype.STRATEGIST, HazardType.DATA_STORM, {
    description: "Final Boss: Survive the storm and hold the center.",
    enemyName: "THE SOURCE",
    introText: "I am the beginning and the end. Submit.",
    winCondition: WinCondition.CONTROL,
    winValue: 5,
    cumulativeCapture: true, // Cumulative progress
    enemyHpMult: 3.0,
    creditReward: 5000,
  }),
];
