
import { useState } from 'react';
import { Phase, Tab, UnitType, VisualLevel, AIArchetype, AIDifficulty, Player, TurnData, HazardType, DifficultyLevel, GameMode, Action, WinCondition, TileType, MasteryStats } from '../types';
import { INITIAL_HP } from '../constants';
import { CAMPAIGN_LEVELS } from '../campaignRegistry';
import { UNITS } from '../operativeRegistry';
import { AudioService } from '../services/audioService';
import { calculateAIMove } from '../aiLogic';
import { MASTERY_TREES } from '../masteryRegistry';

// Sub-hooks
import { useProgression } from './useProgression';
import { useSettings } from './useSettings';
import { useBattleEngine } from './useBattleEngine';
import { useCampaignManager } from './useCampaignManager';
import { usePlayerDraft } from './usePlayerDraft';
import { useAIController } from './useAIController';
import { useTutorial } from './useTutorial';

export function useGameState() {
  // --- Core State Managers ---
  const progression = useProgression();
  const settings = useSettings();
  const battle = useBattleEngine();
  const campaign = useCampaignManager(battle, progression);
  
  // --- UI State ---
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.TERMINAL);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExitConfirming, setIsExitConfirming] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30);
  const [confirmingUnit, setConfirmingUnit] = useState<UnitType | null>(null);
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [setupCount, setSetupCount] = useState(2);
  const [editingNameIdx, setEditingNameIdx] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");

  const [playerConfigs, setPlayerConfigs] = useState(() => 
    Array(6).fill(null).map((_, i) => ({ 
      name: `AGENT_${i+1}`, isAI: false, archetype: AIArchetype.STRATEGIST, difficulty: AIDifficulty.NORMAL 
    }))
  );

  // --- Sub-Logic Hooks ---
  const tutorial = useTutorial(progression.hasCompletedTutorial);
  const draft = usePlayerDraft(battle.players[battle.currentPlayerIdx]?.id);
  const audioService = AudioService.getInstance();
  const playSfx = (type: any) => audioService.playProceduralSfx(type, settings.sfxEnabled);

  // --- Actions & Resolution Logic ---
  const submitAction = (action: Action) => {
    // If turn is submitted, we reset local draft state
    draft.resetDraft();
    
    battle.submitTurnAction(action, (completeSubmissions) => {
        // If this callback fires, it means all players have moved. Resolve the turn.
        // We calculate campaign hazard here to pass to resolution
        const lvl = campaign.currentCampaignLevelId ? CAMPAIGN_LEVELS.find(l => l.id === campaign.currentCampaignLevelId) : null;
        
        // AI Cheat Logic for Blackout Difficulty
        if (campaign.campaignDifficulty === DifficultyLevel.BLACKOUT) {
           // Find Threshold for context
           let thresholdPos = undefined;
           if (battle.activeMap) {
               battle.activeMap.tiles.forEach((row: any[], y: number) => {
                   row.forEach((tile: TileType, x: number) => {
                       if (tile === TileType.THRESHOLD) {
                           thresholdPos = { x, y };
                       }
                   });
               });
           }

           const cheatContext = {
               difficulty: campaign.campaignDifficulty,
               winCondition: lvl?.winCondition || WinCondition.ELIMINATION,
               thresholdPos: thresholdPos
           };

           completeSubmissions.forEach(sub => {
              const p = battle.players.find(x => x.id === sub.playerId);
              if (p?.isAI) {
                 // Recalculate AI move with knowledge of player moves
                 try {
                   const cheatMove = calculateAIMove(
                     p, battle.players, battle.fullHistory, battle.round, 
                     cheatContext,
                     battle.activeMap, completeSubmissions
                   );
                   sub.action = cheatMove;
                 } catch(e) { console.error("Cheat calc failed", e); }
              }
           });
        }

        const nextPlayers = battle.executeResolution(
            completeSubmissions, 
            campaign.campaignDifficulty, 
            lvl?.hazard || HazardType.NONE,
            campaign.currentCampaignLevelId
        );
        
        // Victory Check
        if (campaign.currentCampaignLevelId) {
            campaign.checkCampaignVictory(nextPlayers);
        } else if (!battle.victoryReason) {
             // Skirmish Mode Victory Check
             const human = nextPlayers.find(p => !p.isAI);
             const alivePlayers = nextPlayers.filter(p => !p.isEliminated);
             
             // If player died
             if (human && human.isEliminated) {
                 battle.setVictoryReason("MISSION_FAILED");
                 progression.updateStats(false);
             } 
             // If only player remains
             else if (human && alivePlayers.length === 1 && alivePlayers[0].id === human.id) {
                 battle.setVictoryReason("MISSION_COMPLETE");
                 progression.updateStats(true);
                 // Contracts Update
                 progression.updateContracts([
                    { type: 'WIN_MATCH', value: 1 },
                    { type: 'PLAY_MATCHES', value: 1 }
                 ]);
             }
             // AI vs AI or Multiplayer end state
             else if (alivePlayers.length <= 1) {
                 battle.setVictoryReason("SIMULATION_COMPLETE");
                 // No stats record for AI vs AI usually
             }
        }
    });
  };
  
  // --- AI Controller ---
  const ai = useAIController(
    battle, 
    campaign.campaignDifficulty, 
    campaign.currentChapter, 
    campaign.currentCampaignLevelId,
    submitAction
  );

  const nextTurn = () => {
    draft.resetDraft();
    battle.nextTurn();
    playSfx('confirm');
  };

  const finalizePlayers = () => {
    // Inject Mod stats & Mastery stats here
    const baseAP = 25; // COLD START
    
    const newPlayers: Player[] = playerConfigs.slice(0, setupCount).map((cfg, idx) => {
      // Calculate stats for HUMAN players only
      let startAp = baseAP;
      let startHp = INITIAL_HP;
      let startMaxHp = INITIAL_HP;
      
      const isHuman = !cfg.isAI;
      let activeMods = isHuman ? progression.equippedMods : [];
      let masteryBonuses: MasteryStats = {};
      let initialStatuses: any[] = [];

      // 1. Apply Mods (Legacy)
      if (activeMods) {
         activeMods.forEach(m => {
            if (m.stats.ap) startAp += m.stats.ap;
            if (m.stats.maxHp) startMaxHp += m.stats.maxHp;
            if (m.stats.hp) startHp += m.stats.hp;
         });
      }

      // 2. Apply Mastery Path (New)
      if (isHuman && confirmingUnit) {
          const unlockedNodes = progression.unitMastery[confirmingUnit] || [];
          const tree = MASTERY_TREES[confirmingUnit] || [];
          
          unlockedNodes.forEach(nodeId => {
              const node = tree.find(n => n.id === nodeId);
              if (node && node.stats) {
                  if (node.stats.maxHp) startMaxHp += node.stats.maxHp;
                  if (node.stats.hp) startHp += node.stats.hp;
                  if (node.stats.ap) startAp += node.stats.ap;
                  if (node.stats.immuneTo) {
                      node.stats.immuneTo.forEach(imm => {
                          initialStatuses.push({ type: `IMMUNE_${imm}`, duration: 999 });
                      });
                  }
                  
                  // Aggregate percentage mods
                  masteryBonuses.atkMod = (masteryBonuses.atkMod || 0) + (node.stats.atkMod || 0);
                  masteryBonuses.defMod = (masteryBonuses.defMod || 0) + (node.stats.defMod || 0);
                  masteryBonuses.speed = (masteryBonuses.speed || 0) + (node.stats.speed || 0);
              }
          });
      }

      // Cap HP
      startHp = Math.min(startHp, startMaxHp);

      return {
        id: `p${idx}`,
        name: cfg.name,
        unit: null,
        hp: startHp,
        maxHp: startMaxHp,
        ap: startAp,
        moveFatigue: 0,
        blockFatigue: 0,
        isEliminated: false,
        isAI: cfg.isAI,
        aiConfig: cfg.isAI ? { archetype: cfg.archetype, difficulty: cfg.difficulty } : undefined,
        totalReservedAp: 0,
        cooldown: 0,
        activeUsed: false,
        desperationUsed: false,
        statuses: initialStatuses,
        isAbilityActive: false,
        position: { x: idx === 0 ? 0 : 6, y: 3 },
        captureTurns: 0,
        equippedMods: activeMods,
        statModifiers: masteryBonuses, // Injected for Combat Engine to read
        loadout: (!cfg.isAI) ? progression.currentLoadout : { primary: null, secondary: null, shield: null },
        itemUses: (!cfg.isAI && progression.currentLoadout?.secondary) 
          ? { current: 0, max: progression.currentLoadout.secondary.maxUses || 0 } 
          : { current: 0, max: 0 }
      };
    });

    battle.setPlayers(newPlayers);
    battle.initDistances(newPlayers);
    battle.setPhase(Phase.BLACKOUT_SELECTION);
    battle.setCurrentPlayerIdx(0);
    battle.setRound(1);
    playSfx('confirm');
  };

  const resetToMain = () => {
    battle.resetBattle();
    battle.setPhase(Phase.GAME_TYPE_SELECTION);
    campaign.setCurrentCampaignLevelId(null);
    setIsExitConfirming(false);
  };

  const startGame = (m: GameMode) => {
    battle.setMode(m);
    battle.setPhase(Phase.SETUP_PLAYERS);
    battle.resetBattle();
    playSfx('confirm');
  };

  const updatePlayerConfig = (i: number, u: any) => {
    setPlayerConfigs(prev => {
      const n = [...prev];
      n[i] = { ...n[i], ...u };
      return n;
    });
  };

  const usePromoCode = (code: string) => {
    if (code === "TEST_UNLOCK") {
      progression.unlockAll();
      playSfx('success');
      return "DEV_ACCESS_GRANTED";
    }
    if (code === "TEST_RESET") {
      progression.resetProgress();
      playSfx('danger');
      return "SYSTEM_FACTORY_RESET";
    }
    playSfx('cancel');
    return "INVALID_KEY";
  };

  // --- Public Interface ---
  return {
    ...progression,
    ...settings,
    ...battle,
    ...campaign,
    ...tutorial,
    ...draft, // Expose drafting state
    isAIThinking: ai.isAIThinking, // Expose AI state

    // UI & Config
    currentTab, setCurrentTab,
    isHelpOpen, setIsHelpOpen,
    isSettingsOpen, setIsSettingsOpen,
    isExitConfirming, setIsExitConfirming,
    timeLimit, setTimeLimit,
    confirmingUnit, setConfirmingUnit,
    isLockedIn, setIsLockedIn,
    setupCount, setSetupCount,
    playerConfigs, updatePlayerConfig,
    editingNameIdx, tempName, setTempName,
    
    // Actions
    playSfx,
    startEditName: (i: number) => { setEditingNameIdx(i); setTempName(playerConfigs[i].name); },
    saveEditName: () => { if (editingNameIdx !== null) updatePlayerConfig(editingNameIdx, { name: tempName }); setEditingNameIdx(null); },
    cancelEditName: () => setEditingNameIdx(null),
    finalizePlayers,
    resetToMain,
    nextTurn,
    startGame,
    submitAction,
    usePromoCode
  };
}
