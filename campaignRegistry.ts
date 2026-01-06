
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
  // =========================================================================
  
  createLevel(1, 1, "Hello World", UnitType.AEGIS, AIArchetype.TURTLE, HazardType.NONE, {
    description: "The Firewall Sentry. It blocks often. Time your strikes.",
    introText: "You are an unauthorized packet. The Sentry will try to deny your access. Prove you are persistent.",
    winText: "Firewall breached. Access granted.",
    lossText: "Access Denied. You struck the shield until you broke.",
    enemyHpMult: 0.8,
    unlockUnit: UnitType.AEGIS
  }),

  createLevel(1, 2, "Static Noise", UnitType.PYRUS, AIArchetype.AGGRO, HazardType.NONE, {
    description: "An aggressive daemon. Do not trade damage; block the burn.",
    introText: "This signal is corrupted and volatile. It will burn itself out if you survive the initial heat.",
    winText: "Heat signature dissipated.",
    lossText: "Your code was incinerated. You played too recklessly.",
    unlockUnit: UnitType.PYRUS
  }),

  createLevel(1, 3, "Range Test", UnitType.KILLSHOT, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "A sniper protocol. Stay at Range 0 (Melee) to minimize their damage.",
    introText: "Target is holding position at Range 2. If you stay visible, you will be deleted.",
    winText: "Sniper neutralized. Range advantage nullified.",
    lossText: "Headshot. You made yourself an easy target.",
    unlockUnit: UnitType.KILLSHOT
  }),

  createLevel(1, 4, "The Wall", UnitType.AEGIS, AIArchetype.TURTLE, HazardType.NONE, {
    description: "A hardened node. Use Reserve AP to break the threshold.",
    introText: "Standard attacks will not scratch this plating. Conserve energy. Strike once, strike hard.",
    winText: "Armor shattered. Route clear.",
    lossText: "You ran out of energy before he ran out of shield.",
  }),

  createLevel(1, 5, "Ghost Protocol", UnitType.GHOST, AIArchetype.STRATEGIST, HazardType.FOG_OF_WAR, {
    description: "Evasive target. Do not attack when the Phase Shift is active.",
    introText: "Sensors are unreliable here. The target is phasing in and out of the sector.",
    winText: "Pattern locked. Ghost deleted.",
    lossText: "You swung at nothing and hit nothing.",
    unlockUnit: UnitType.GHOST
  }),

  createLevel(1, 6, "Optimization", UnitType.TROJAN, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Time trial. Defeat the enemy before the system purges you (10 Turns).",
    winCondition: WinCondition.SURVIVAL, 
    winValue: 10,
    introText: "System purge imminent. You have 10 cycles to delete this obstacle.",
    winText: "Obstacle removed. Purge avoided.",
    lossText: "Time out. System format complete.",
    unlockUnit: UnitType.TROJAN
  }),

  createLevel(1, 7, "Data Leak", UnitType.LEECH, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Vampiric logic. Out-damage the regeneration.",
    introText: "Target is siphoning your integrity. Every hit you take heals him.",
    winText: "Parasite removed. Leak plugged.",
    lossText: "You became the fuel. He ended the fight with more health than he started.",
    unlockUnit: UnitType.LEECH
  }),

  createLevel(1, 8, "Overclock", UnitType.BATTERY, AIArchetype.AGGRO, HazardType.NONE, {
    description: "High energy threat. Beware the AP surge.",
    introText: "Target reactor is unstable. Expect massive energy spikes.",
    winText: "Reactor cooled. Energy claimed.",
    lossText: "Overload. You couldn't weather the storm.",
    unlockUnit: UnitType.BATTERY
  }),

  createLevel(1, 9, "Triangulation", UnitType.HUNTER, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "You are Marked. Play defensively when the lock is active.",
    introText: "Lock-on detected. The Hunter knows your position. Move or die.",
    winText: "Tracker disabled. The hunter becomes the prey.",
    lossText: "Caught in the open. A fatal error.",
    unlockUnit: UnitType.HUNTER
  }),

  createLevel(1, 10, "System Halt", UnitType.WARDEN, AIArchetype.TURTLE, HazardType.GRAVITY_WELL, {
    description: "Heavy Gravity. Movement costs double AP.",
    introText: "Sector viscosity increased. Movement will drain you. Stand and fight.",
    winText: "Warden decomissioned. Gravity normalized.",
    lossText: "Exhaustion. You wasted your energy trying to run.",
    unlockUnit: UnitType.WARDEN
  }),

  createLevel(1, 11, "Double Blind", UnitType.PYRUS, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Tag Team: 2 Enemies (50% HP each). Kill the Pyrus first.",
    enemyCount: 2, 
    enemyHpMult: 0.6, 
    introText: "Two signatures detected. One is elusive, one is deadly. Prioritize.",
    winText: "Duo eliminated. Multitasking complete.",
    lossText: "Overwhelmed. You couldn't track both vectors.",
  }),

  createLevel(1, 12, "GATEKEEPER", UnitType.AEGIS, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "CHAPTER BOSS. High HP. High Defense. The final test.",
    enemyName: "THE GATEKEEPER",
    enemyHpMult: 2.5,
    introText: "I am the edge of the known network. You go no further.",
    winText: "Gatekeeper offline. Welcome to the Neural Hub.",
    lossText: "You are not ready for the deep web.",
    creditReward: 1000,
  }),

  // =========================================================================
  // CHAPTER 2: THE NEURAL HUB
  // =========================================================================

  createLevel(2, 1, "Viral Load", UnitType.MEDIC, AIArchetype.STRATEGIST, HazardType.VIRAL_INVERSION, {
    description: "Inversion: Healing deals damage this level.",
    introText: "The medical protocols are reversed. Do not attempt to repair.",
    winText: "Virus quarantined. Logic restored.",
    lossText: "Fatal error. You tried to fix what was broken.",
    unlockUnit: UnitType.MEDIC
  }),

  createLevel(2, 2, "Logic Loop", UnitType.GLITCH, AIArchetype.STRATEGIST, HazardType.AP_FLUX, {
    description: "Flux: Your AP generation is randomized (2-6).",
    introText: "Power regulation is offline. Adapt to the fluctuating energy.",
    winText: "Glitch patched. Stability returned.",
    lossText: "Power failure. You couldn't adapt to the chaos.",
    unlockUnit: UnitType.GLITCH
  }),

  createLevel(2, 3, "Burning Chrome", UnitType.PYRUS, AIArchetype.AGGRO, HazardType.LAVA_FLOOR, {
    description: "Inferno: Floor is lava. Take damage if you Move.",
    introText: "The floor is compiling garbage data. Step on it and you burn.",
    winText: "Fire extinguished.",
    lossText: "Melted. You moved too much.",
  }),

  createLevel(2, 4, "Deep Freeze", UnitType.WARDEN, AIArchetype.TURTLE, HazardType.NONE, {
    description: "Stasis: You cannot gain Reserve AP.",
    introText: "Cryogenic protocols active. No excess energy storage allowed.",
    winText: "Blockade lifted.",
    lossText: "Dependency error. You relied too much on reserves.",
  }),

  createLevel(2, 5, "Backdoor", UnitType.TROJAN, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Piercing: Enemy ignores Defense Tier 1.",
    introText: "This unit has shield-breaker algorithms. Light defense is useless.",
    winText: "Backdoor closed.",
    lossText: "Security breach. Your shields did nothing.",
  }),

  createLevel(2, 6, "Heartbleed", UnitType.LEECH, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Blood Price: Abilities cost HP instead of CD.",
    introText: "Standard cooldowns are disabled. Every ability uses your own integrity as a catalyst.",
    winText: "Siphon broken.",
    lossText: "Bled dry. The price was too high.",
  }),

  createLevel(2, 7, "Memory Leak", UnitType.GLITCH, AIArchetype.STRATEGIST, HazardType.FOG_OF_WAR, {
    description: "Amnesia: Map is obscured (Fog of War).",
    introText: "Visuals are offline. You are fighting a ghost in the machine.",
    winText: "Visibility restored.",
    lossText: "Blind sided.",
  }),

  createLevel(2, 8, "Deadlock", UnitType.AEGIS, AIArchetype.TURTLE, HazardType.NONE, {
    description: "Synergy: Medic heals Aegis every 2 turns.",
    enemyCount: 2, 
    introText: "A symbiotic pair. Break the cycle.",
    winText: "Cycle broken.",
    lossText: "Stalemate. They outlasted you.",
  }),

  createLevel(2, 9, "Short Circuit", UnitType.BATTERY, AIArchetype.AGGRO, HazardType.OVERLOAD, {
    description: "Overload: Dealing >200 dmg hurts YOU for 50.",
    introText: "Feedback loops active. If you hit too hard, it snaps back.",
    winText: "Circuit grounded.",
    lossText: "Fried by your own output.",
  }),

  createLevel(2, 10, "Panic", UnitType.REAPER, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Execution: Instant death if you fall < 20% HP.",
    introText: "The Reaper is here. Do not let your integrity drop.",
    winText: "Death defied.",
    lossText: "Harvested.",
    unlockUnit: UnitType.REAPER
  }),

  createLevel(2, 11, "Entropy", UnitType.TROJAN, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Decay: Max HP drops by 50 every round.",
    introText: "Your code is rotting. Finish this quickly.",
    winText: "Integrity stabilized.",
    lossText: "Zeroed out.",
  }),

  createLevel(2, 12, "THE ARCHITECT", UnitType.GLITCH, AIArchetype.STRATEGIST, HazardType.AP_FLUX, {
    description: "CHAPTER BOSS. Swaps your AP with his every 3 turns.",
    enemyName: "THE ARCHITECT",
    enemyHpMult: 2.5,
    introText: "I wrote the rules you are trying to break.",
    winText: "Architect crashed. Core access granted.",
    lossText: "Rewrite complete. You have been formatted.",
    creditReward: 2000,
  }),

  // =========================================================================
  // CHAPTER 3: THE CORE
  // =========================================================================

  createLevel(3, 1, "Zero Day", UnitType.KILLSHOT, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Sniper Alley: Range 2 (Far) damage is +50%.",
    introText: "The firing lanes are wide open. Close in or die.",
    winText: "Sniper disconnected.",
    lossText: "Deleted from range.",
  }),

  createLevel(3, 2, "Fatal Exception", UnitType.REAPER, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Glass: Everyone has 50% HP but 200% DMG.",
    introText: "Safety protocols disabled. One hit is all it takes.",
    winText: "Exception handled.",
    lossText: "Critical failure.",
  }),

  createLevel(3, 3, "Rubber Band", UnitType.WARDEN, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Tether: You are pulled to Range 0 every turn.",
    introText: "Escape is impossible. Prepare for melee.",
    winText: "Tether severed.",
    lossText: "Crushed in the grip.",
  }),

  createLevel(3, 4, "Echo Chamber", UnitType.GHOST, AIArchetype.STRATEGIST, HazardType.FOG_OF_WAR, {
    description: "Mirage: 3 Ghosts appear. 2 are fake (1 HP).",
    enemyCount: 3, 
    introText: "Multiple signatures. Find the real one.",
    winText: "Illusion dispelled.",
    lossText: "Chasing shadows.",
  }),

  createLevel(3, 5, "Power Surge", UnitType.BATTERY, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Supercharge: Both players start with 10 AP.",
    introText: "Unrestricted energy flow. Don't hold back.",
    winText: "Surge contained.",
    lossText: "You hesitated.",
  }),

  createLevel(3, 6, "Firewall", UnitType.PYRUS, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "The Anvil: Aegis blocks, Pyrus burns.",
    enemyCount: 2,
    introText: "One burns, one blocks. Divide and conquer.",
    winText: "Firewall deactivated.",
    lossText: "Trapped and burned.",
  }),

  createLevel(3, 7, "Null Pointer", UnitType.GLITCH, AIArchetype.STRATEGIST, HazardType.NULL_FIELD, {
    description: "Silence: No Abilities allowed.",
    introText: "Functions undefined. Manual override only.",
    winText: "Pointer fixed.",
    lossText: "Null reference exception.",
  }),

  createLevel(3, 8, "Bleeding Edge", UnitType.HUNTER, AIArchetype.AGGRO, HazardType.NONE, {
    description: "Predator: Hunter always wins Initiative.",
    introText: "He is faster than you. You will always strike second.",
    winText: "Speed isn't everything.",
    lossText: "Too slow.",
  }),

  createLevel(3, 9, "Redundancy", UnitType.MEDIC, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Immortal: They heal each other endlessly.",
    enemyCount: 2,
    introText: "Infinite loop detected. Break the synergy.",
    winText: "Loop broken.",
    lossText: "Stack overflow.",
  }),

  createLevel(3, 10, "Total Eclipse", UnitType.TROJAN, AIArchetype.STRATEGIST, HazardType.NONE, {
    description: "Blackout Phase starts Round 1.",
    introText: "Lights out. No safety rails. Good luck.",
    winText: "Darkness lifted.",
    lossText: "Lost in the dark.",
  }),

  createLevel(3, 11, "Final Trace", UnitType.REAPER, AIArchetype.STRATEGIST, HazardType.FOG_OF_WAR, {
    description: "Doppelganger: Enemy matches your unit type.",
    introText: "Fighting self... match detected.",
    winText: "Self-improvement complete.",
    lossText: "You are your own worst enemy.",
  }),

  createLevel(3, 12, "SOURCE", UnitType.SINGULARITY, AIArchetype.STRATEGIST, HazardType.DATA_STORM, {
    description: "THE END. God Mode. Survive the Collapse.",
    enemyName: "THE SOURCE",
    enemyHpMult: 3.0,
    introText: "I am the beginning and the end. Submit.",
    winText: "System Rebooting... You are the new Admin.",
    lossText: "Ctrl + Alt + Delete.",
    creditReward: 5000,
    unlockUnit: UnitType.SINGULARITY
  }),
];
