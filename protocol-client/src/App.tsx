import React, { useState, useEffect } from 'react';
import { Phase, VisualLevel, Tab, GameMode } from '../shared/types';
import { useGameState } from './hooks/useGameState';

// --- VIEW IMPORTS ---
import { SplashView } from './components/views/SplashView';
import { GameTypeSelectionView } from './components/views/GameTypeSelectionView';
import { ChapterSelectionView } from './components/views/ChapterSelectionView';
import { NodeSelectorView } from './components/views/NodeSelectorView';
import { BlackMarketView } from './components/views/BlackMarketView';
import { AgencyView } from './components/views/AgencyView';
import { ArmoryView } from './components/views/ArmoryView';
import { MenuView } from './components/views/MenuView';
import { SetupPlayersView } from './components/views/SetupPlayersView';
import { SelectionView } from './components/views/SelectionView';
import { PassPhoneView } from './components/views/PassPhoneView';
import { TurnEntryView } from './components/views/TurnEntryView';
import { ResolutionView } from './components/views/ResolutionView';
import { GameOverView } from './components/views/GameOverView';
import { MultiplayerLobbyView } from './components/views/MultiplayerLobbyView';
import { MultiplayerErrorOverlay } from './components/views/MultiplayerErrorOverlay';
import { useMultiplayer } from './hooks/useMultiplayer'; // 1. Import it

// --- UI COMPONENTS ---
import { BottomNav } from './components/layout/BottomNav';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { 
  AlertTriangle, Activity, Volume2, VolumeX, Share2, Info, 
  MessageSquare, Shield, FileText, Gift, ChevronLeft, Target, 
  Skull, Zap, Globe, Database, Music 
} from 'lucide-react';

// --- DATA & SERVICES ---
import { CHAOS_DECK } from './shared/constants';
import { UNITS } from './shared/operativeRegistry';
import { AudioService } from './services/audioService';

const App: React.FC = () => {
  // game contains all state from useGameState AND the useMultiplayer hook logic
  const game = useGameState();
  const { playSfx, currentTab, setCurrentTab } = game;
  
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<{title: string, content: string} | null>(null);
  const [isNavHidden, setIsNavHidden] = useState(false);

const multiplayer = useMultiplayer();
const activePhase = multiplayer.isConnected ? multiplayer.phase : game.phase;

  console.log("NETWORK_STATUS:", {
    isConnected: multiplayer.isConnected,
    serverPhase: multiplayer.phase,
    localPhase: game.phase,
    activePhase: activePhase
  });

  // --- 1. BGM SYNC ---
  useEffect(() => {
    const audio = AudioService.getInstance();
    const isSplash = game.phase === Phase.SPLASH;
    const isCombat = game.phase === Phase.TURN_ENTRY || game.phase === Phase.RESOLUTION;
    
    if (game.bgmEnabled && !isSplash) {
      // Switch track based on combat vs menu
      const track = isCombat 
        ? "https://raw.githubusercontent.com/VzLatte/Protocol-Blackout/main/public/audio/Shadow%20in%20the%20Lobby.mp3"
        : "https://raw.githubusercontent.com/VzLatte/Protocol-Blackout/main/public/audio/Shadow%20in%20the%20Lobby.mp3";
      
      audio.playBGM(track, game.bgmVolume);
    } else {
      audio.stopBGM();
    }
  }, [game.bgmEnabled, game.bgmVolume, game.phase]);

  // --- 2. VIEW RESOLVER (Multiplayer Aware) ---
  const renderActiveView = () => {
    // Priority 1: Loading/Splash
    if (game.phase === Phase.SPLASH) {
       return <SplashView visualLevel={game.visualLevel} onInitialize={() => {
          const audio = AudioService.getInstance();
          audio.initContext();
          playSfx('startup');
          game.setPhase(Phase.GAME_TYPE_SELECTION);
       }} />;
    }

    // Priority 2: Persistent Tabs (Agency/Armory/Market)
    if (currentTab === Tab.AGENCY) return <AgencyView game={game} onBack={() => setCurrentTab(Tab.TERMINAL)} />;
    if (currentTab === Tab.ARMORY) return <ArmoryView game={game} onBack={() => setCurrentTab(Tab.TERMINAL)} />;
    if (currentTab === Tab.MARKET) return <BlackMarketView game={game} onBack={() => setCurrentTab(Tab.TERMINAL)} setHideNav={setIsNavHidden} />;

    // Priority 3: Multiplayer vs Local Game Phases
    switch (activePhase) {
      case Phase.GAME_TYPE_SELECTION:
  return (
    <GameTypeSelectionView 
      onCampaign={() => game.setPhase(Phase.CHAPTER_SELECTION)}
      onCustom={() => game.startGame(GameMode.TACTICAL)}
      onExitRequest={() => game.setIsExitConfirming(true)}
      // 1. Pass the join function from the App's hook instance
      onFindMatch={() => {
        console.log("Initializing Multiplayer Link...");
        multiplayer.joinMatch({ name: game.playerName });
      }} 
    />
  );
      
      case Phase.MULTIPLAYER_LOBBY:
  return (
    <MultiplayerLobbyView 
      // DATA FROM useMultiplayer()
      players={multiplayer.players}
      sessionId={multiplayer.sessionId}
      onToggleReady={multiplayer.toggleReady}
      onLeave={multiplayer.leaveMatch}
      
      // LOGIC NOT YET IN YOUR HOOK (See below)
      onSelectUnit={(type) => multiplayer.room?.send("selectUnit", { type })}
      
      // DATA FROM useGameState()
      visualLevel={game.visualLevel}
      credits={game.credits}
      xp={game.xp}
    />
  );

      case Phase.PASS_PHONE:
  return (
    <PassPhoneView game={game} />
  );

      case Phase.BLACKOUT_SELECTION:
  return (
    <SelectionView game={game} />
  );

      case Phase.TURN_ENTRY:
  // Ensure we use local game state when not connected to multiplayer; the previous code
  // always supplied `multiplayer.players` (which is empty in local campaign) causing
  // TurnEntryView to receive no player or loadout and show the "Synchronizing Tactical Data..." screen.
  return multiplayer.isConnected ? (
    <TurnEntryView 
      game={{
        ...game,
        players: multiplayer.players,
        currentPlayerIdx: multiplayer.players.findIndex(pl => pl.id === multiplayer.sessionId),
        submitAction: multiplayer.submitAction,
      }} 
    />
  ) : (
    <TurnEntryView game={game} />
  );

      case Phase.RESOLUTION:
        // CRITICAL: We pass the explicit multiplayer props here
        return (
          <ResolutionView 
            players={game.players}
            prevPlayers={game.targetPlayers} // Uses the 'snap' state we built in the hook
            activeMap={game.activeMap}
            resolutionLogs={game.logs}
            round={game.round}
            onResolutionComplete={game.onResolutionComplete}
            visualLevel={game.visualLevel}
            credits={game.credits}
            isMultiplayer={multiplayer.isConnected}
            timeLimit={game.timeLimit}
            isResolving={game.isResolving}
          />
        );

      case Phase.GAME_OVER:
        return <GameOverView game={game} />;
      
            case Phase.CAMPAIGN_MAP:
        return <NodeSelectorView game={game} onSelectLevel={game.startCampaignLevel} onBack={() => game.setPhase(Phase.CHAPTER_SELECTION)} />;
      
      case Phase.CHAPTER_SELECTION:
        return <ChapterSelectionView game={game} onSelectChapter={() => game.setPhase(Phase.CAMPAIGN_MAP)} onBack={() => game.setPhase(Phase.GAME_TYPE_SELECTION)} />;
      
      case Phase.MENU:
  return (
    <MenuView 
      visualLevel={game.visualLevel} 
      onStartGame={game.startGame} 
      onHelp={() => game.setIsHelpOpen(true)} 
      onSettings={() => game.setIsSettingsOpen(true)} 
      onExitRequest={() => game.setIsExitConfirming(true)} // Fixes GlobalHeader dependency
      onBack={() => game.setPhase(Phase.GAME_TYPE_SELECTION)} 
      credits={game.credits} 
      xp={game.xp} 
    />
  );

      case Phase.SETUP_PLAYERS:
        return <SetupPlayersView game={game} />;

      
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-sky-500/30">
      {renderActiveView()}
      
      {/* Navigation Layer */}
      {!isNavHidden && activePhase !== Phase.RESOLUTION && activePhase !== Phase.TURN_ENTRY && (
        <BottomNav 
          currentTab={currentTab} 
          onTabChange={(tab) => {
            playSfx('beep');
            setCurrentTab(tab);
          }} 
          phase={activePhase} 
        />
      )}

      {/* Multiplayer Error Overlay */}
      {game.isConnected && game.error && (
        <MultiplayerErrorOverlay 
          error={game.error} 
          onExit={game.leaveMatch} 
        />
      )}

      {/* --- MODALS --- */}
      <Modal isOpen={game.isHelpOpen} onClose={() => game.setIsHelpOpen(false)} title="OPERATIONAL_MANUAL.SYS" maxWidth="max-w-3xl">
        {/* Help Content (Shortened for brevity, keep your original content here) */}
        <div className="space-y-8 pb-10">
           <section className="space-y-2">
              <h3 className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Target size={14}/> Mission Protocol</h3>
              <p className="text-xs text-slate-400 font-mono">Allocate AP to attack, block, or move. Last operative standing wins.</p>
           </section>
           <Button variant="primary" className="w-full" onClick={() => game.setIsHelpOpen(false)}>Acknowledge</Button>
        </div>
      </Modal>

      <Modal isOpen={game.isSettingsOpen} onClose={() => { game.setIsSettingsOpen(false); setActiveDocument(null); }} title="INTERFACE CONFIG" maxWidth="max-w-xl">
        {/* Settings Content Logic */}
        {activeDocument ? (
          <div className="space-y-4">
            <button onClick={() => setActiveDocument(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-sky-400"><ChevronLeft size={14} /> Back</button>
            <h3 className="text-xl font-black italic text-white uppercase">{activeDocument.title}</h3>
            <div className="bg-black/40 p-4 rounded-xl border border-slate-800 text-slate-400 font-mono text-xs whitespace-pre-wrap">{activeDocument.content}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Promo Code, Audio Toggles, etc. */}
            <div className="flex flex-col gap-4">
               <Button variant="secondary" onClick={() => { game.setBgmEnabled(!game.bgmEnabled); playSfx('beep'); }}>
                  {game.bgmEnabled ? 'Music: ON' : 'Music: OFF'}
               </Button>
               <Button variant="secondary" onClick={() => { game.setSfxEnabled(!game.sfxEnabled); playSfx('beep'); }}>
                  {game.sfxEnabled ? 'SFX: ON' : 'SFX: OFF'}
               </Button>
            </div>
            <Button variant="primary" className="w-full" onClick={() => game.setIsSettingsOpen(false)}>Close</Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={game.isExitConfirming} onClose={() => game.setIsExitConfirming(false)} title="ABORT_MISSION?">
        <div className="text-center py-4">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-slate-400 font-mono text-[10px] uppercase mb-6">Disconnect from current operation?</p>
          <div className="flex gap-4">
             <Button variant="ghost" className="flex-1" onClick={() => game.setIsExitConfirming(false)}>Resume</Button>
             <Button variant="danger" className="flex-1" onClick={game.leaveMatch}>Abort</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;