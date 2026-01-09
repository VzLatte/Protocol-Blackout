
import { useState } from 'react';
import { Phase, Tab, UnitType, VisualLevel, AIArchetype, AIDifficulty, Player, TurnData, HazardType, DifficultyLevel, GameMode, Action } from '../types';
import { INITIAL_HP } from '../constants';
import { CAMPAIGN_LEVELS } from '../campaignRegistry';
import { UNITS } from '../operativeRegistry';
import { AudioService } from '../services/audioService';
import { calculateAIMove } from '../aiLogic';

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
           completeSubmissions.forEach(sub => {
              const p = battle.players.find(x => x.id === sub.playerId);
              if (p?.isAI) {
                 // Recalculate AI move with knowledge of player moves
                 try {
                   const cheatMove = calculateAIMove(
                     p, battle.players, battle.fullHistory, battle.round, campaign.currentChapter, campaign.campaignDifficulty, battle.activeMap, completeSubmissions
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
    const newPlayers: Player[] = playerConfigs.slice(0, setupCount).map((cfg, idx) => ({
      id: `p${idx}`,
      name: cfg.name,
      unit: null,
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      ap: 3,
      moveFatigue: 0,
      blockFatigue: 0,
      isEliminated: false,
      isAI: cfg.isAI,
      aiConfig: cfg.isAI ? { archetype: cfg.archetype, difficulty: cfg.difficulty } : undefined,
      totalReservedAp: 0,
      cooldown: 0,
      activeUsed: false,
      desperationUsed: false,
      statuses: [],
      isAbilityActive: false,
      position: { x: idx === 0 ? 0 : 6, y: 3 },
      captureTurns: 0
    }));

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
