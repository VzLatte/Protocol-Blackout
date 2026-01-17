import { useState, useMemo } from 'react';
import { 
    Phase, Tab, UnitType, VisualLevel, AIArchetype, AIDifficulty, 
    Player, HazardType, DifficultyLevel, GameMode, Action, 
    WinCondition, TileType, MasteryStats 
} from '../../src/shared/types';
import { INITIAL_HP } from '../../src/shared/constants';
import { CAMPAIGN_LEVELS } from '../../src/shared/campaignRegistry';
import { UNITS } from '../../src/shared/operativeRegistry';
import { AudioService } from '../services/audioService';
import { calculateAIMove } from '../../src/shared/aiLogic';
import { MASTERY_TREES } from '../../src/shared/masteryRegistry';

// Sub-hooks
import { useProgression } from './useProgression';
import { useSettings } from './useSettings';
import { useBattleEngine } from './useBattleEngine';
import { useCampaignManager } from './useCampaignManager';
import { usePlayerDraft } from './usePlayerDraft';
import { useAIController } from './useAIController';
import { useTutorial } from './useTutorial';
import { useMultiplayer } from './useMultiplayer';

export function useGameState() {
  // --- Core State Managers ---
  const progression = useProgression();
  const settings = useSettings();
  const battle = useBattleEngine();
  const campaign = useCampaignManager(battle, progression);
  const multiplayer = useMultiplayer();
  
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
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);

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
    if (isMultiplayerMode) {
        multiplayer.submitAction(action);
        return;
    }

    draft.resetDraft();
    
    battle.submitTurnAction(action, (completeSubmissions) => {
        const lvl = campaign.currentCampaignLevelId ? CAMPAIGN_LEVELS.find(l => l.id === campaign.currentCampaignLevelId) : null;
        
        if (campaign.campaignDifficulty === DifficultyLevel.BLACKOUT) {
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
        
        if (campaign.currentCampaignLevelId) {
            campaign.checkCampaignVictory(nextPlayers);
        } else if (!battle.victoryReason) {
             const human = nextPlayers.find(p => !p.isAI);
             const alivePlayers = nextPlayers.filter(p => !p.isEliminated);
             
             if (human && human.isEliminated) {
                 battle.setVictoryReason("MISSION_FAILED");
                 progression.updateStats(false);
             } 
             else if (human && alivePlayers.length === 1 && alivePlayers[0].id === human.id) {
                 battle.setVictoryReason("MISSION_COMPLETE");
                 progression.updateStats(true);
                 progression.updateContracts([
                    { type: 'WIN_MATCH', value: 1 },
                    { type: 'PLAY_MATCHES', value: 1 }
                 ]);
             }
             else if (alivePlayers.length <= 1) {
                 battle.setVictoryReason("SIMULATION_COMPLETE");
             }
        }
    });
  };
  
  const ai = useAIController(
    battle, 
    campaign.campaignDifficulty, 
    campaign.currentChapter, 
    campaign.currentCampaignLevelId,
    submitAction
  );

  const nextTurn = () => {
    if (isMultiplayerMode) {
        // This clears the resolution view lock in the hook
        multiplayer.onResolutionComplete();
        return;
    }
    draft.resetDraft();
    battle.nextTurn();
    playSfx('confirm');
  };

  const finalizePlayers = () => {
    const baseAP = 25; 
    
    const newPlayers: Player[] = playerConfigs.slice(0, setupCount).map((cfg, idx) => {
      let startAp = baseAP;
      let startHp = INITIAL_HP;
      let startMaxHp = INITIAL_HP;
      
      const isHuman = !cfg.isAI;
      let activeMods = isHuman ? progression.equippedMods : [];
      let masteryBonuses: MasteryStats = {};
      let initialStatuses: any[] = [];

      if (activeMods) {
         activeMods.forEach(m => {
            if (m.stats.ap) startAp += m.stats.ap;
            if (m.stats.maxHp) startMaxHp += m.stats.maxHp;
            if (m.stats.hp) startHp += m.stats.hp;
         });
      }

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
                  
                  masteryBonuses.atkMod = (masteryBonuses.atkMod || 0) + (node.stats.atkMod || 0);
                  masteryBonuses.defMod = (masteryBonuses.defMod || 0) + (node.stats.defMod || 0);
                  masteryBonuses.speed = (masteryBonuses.speed || 0) + (node.stats.speed || 0);
              }
          });
      }

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
        statModifiers: masteryBonuses, 
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
    if (isMultiplayerMode) {
        multiplayer.leaveMatch();
        setIsMultiplayerMode(false);
    }
    battle.resetBattle();
    battle.setPhase(Phase.GAME_TYPE_SELECTION);
    campaign.setCurrentCampaignLevelId(null);
    setIsExitConfirming(false);
  };

  const startGame = (m: GameMode) => {
    setIsMultiplayerMode(false);
    battle.setMode(m);
    battle.setPhase(Phase.SETUP_PLAYERS);
    battle.resetBattle();
    playSfx('confirm');
  };

  const startMultiplayer = () => {
    if (multiplayer.isConnecting || multiplayer.isConnected) return;
      setIsMultiplayerMode(true);
      const defaultUnit = confirmingUnit || (progression.unlockedUnits.length > 0 ? progression.unlockedUnits[0] : UnitType.PYRUS);
      
      multiplayer.joinMatch({ 
          name: settings.playerName,
          unit: defaultUnit,
          loadout: progression.currentLoadout 
      });
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

  // --- DERIVED STATE: The "Master Switch" ---
  const activeState = useMemo(() => {
    if (isMultiplayerMode) {
      return {
        // During resolution: 
        // players = state at the start of resolution
        // targetPlayers = state at the end of resolution
        players: multiplayer.players, 
        targetPlayers: multiplayer.targetPlayers,
        activeMap: multiplayer.activeMap,
        round: multiplayer.round,
        phase: multiplayer.phase,
        logs: multiplayer.logs,
        victoryReason: multiplayer.winnerId 
          ? (multiplayer.winnerId === multiplayer.sessionId ? "OPERATIONAL_SUCCESS" : "MISSION_FAILED")
          : null, 
        currentPlayerIdx: Math.max(0, multiplayer.players.findIndex((p: any) => p.id === multiplayer.sessionId)),
        timeLimit: multiplayer.turnTimer,
        isResolving: multiplayer.isResolving,
        sessionId: multiplayer.sessionId,
      };
    }
    return {
      players: battle.players,
      targetPlayers: battle.prevPlayers, // Use the pre-resolution snapshot for the local replay
      activeMap: battle.activeMap,
      round: battle.round,
      phase: battle.phase,
      logs: battle.resolutionLogs,
      victoryReason: battle.victoryReason,
      currentPlayerIdx: battle.currentPlayerIdx,
      timeLimit: timeLimit,
      isResolving: false,
      sessionId: 'local-agent',
    };
  }, [isMultiplayerMode, multiplayer, battle, timeLimit]);

  return {
    // Sub-hooks & Managers
    ...progression,
    ...settings,
    ...campaign,
    ...tutorial,
    ...draft, 
    
    // Multiplayer Hook Direct Access
    isConnected: multiplayer.isConnected,
    isConnecting: multiplayer.isConnecting,
    isMultiplayerMode,
    error: multiplayer.error,
    toggleReady: multiplayer.toggleReady, 
    onResolutionComplete: isMultiplayerMode ? multiplayer.onResolutionComplete : nextTurn,
    leaveMatch: multiplayer.leaveMatch,
    
    // The Shared Game Reality
    ...activeState,
    
    // Engine Passthrough
    resetBattle: battle.resetBattle,
    initDistances: battle.initDistances,
    selectUnit: battle.selectUnit,
    setPhase: battle.setPhase,
    isAIThinking: ai.isAIThinking,

    // UI & App Config
    currentTab, setCurrentTab,
    isHelpOpen, setIsHelpOpen,
    isSettingsOpen, setIsSettingsOpen,
    isExitConfirming, setIsExitConfirming,
    setTimeLimit,
    confirmingUnit, setConfirmingUnit,
    isLockedIn, setIsLockedIn,
    setupCount, setSetupCount,
    playerConfigs, updatePlayerConfig,
    editingNameIdx, tempName, setTempName,
    
    // Core Handlers
    playSfx,
    startEditName: (i: number) => { setEditingNameIdx(i); setTempName(playerConfigs[i].name); },
    saveEditName: () => { if (editingNameIdx !== null) updatePlayerConfig(editingNameIdx, { name: tempName }); setEditingNameIdx(null); },
    cancelEditName: () => setEditingNameIdx(null),
    finalizePlayers,
    resetToMain,
    nextTurn,
    startGame,
    startMultiplayer,
    submitAction,
    usePromoCode
  };
}