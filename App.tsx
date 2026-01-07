
import React, { useState, useEffect } from 'react';
import { Phase, VisualLevel, Tab } from './types';
import { useGameState } from './hooks/useGameState';
import { SplashView } from './components/views/SplashView';
import { GameTypeSelectionView } from './components/views/GameTypeSelectionView';
import { ChapterSelectionView } from './components/views/ChapterSelectionView';
import { NodeSelectorView } from './components/views/NodeSelectorView';
import { ArchiveView } from './components/views/ArchiveView';
import { BlackMarketView } from './components/views/BlackMarketView';
import { MenuView } from './components/views/MenuView';
import { SetupPlayersView } from './components/views/SetupPlayersView';
import { SelectionView } from './components/views/SelectionView';
import { PassPhoneView } from './components/views/PassPhoneView';
import { TurnEntryView } from './components/views/TurnEntryView';
import { ResolutionView } from './components/views/ResolutionView';
import { GameOverView } from './components/views/GameOverView';
import { OperativesListView } from './components/views/OperativesListView';
import { BottomNav } from './components/layout/BottomNav';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { AlertTriangle, Activity, Volume2, VolumeX, Share2, Info, MessageSquare, Shield, FileText, Gift, ChevronLeft, Target, Skull, Zap, Coins, Cpu, Globe, Database, Music } from 'lucide-react';
import { CHAOS_DECK } from './constants';
import { UNITS } from './operativeRegistry';
import { AudioService } from './services/audioService';

const App: React.FC = () => {
  const game = useGameState();
  const { playSfx, currentTab, setCurrentTab } = game;
  
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<{title: string, content: string} | null>(null);

  // --- BGM Management ---
  useEffect(() => {
    const audio = AudioService.getInstance();
    // Stop BGM on Splash or if disabled
    const isSplash = game.phase === Phase.SPLASH;
    
    if (game.bgmEnabled && !isSplash) {
      // Using direct raw content link
      const menuBgm = "https://raw.githubusercontent.com/VzLatte/Protocol-Blackout/main/public/audio/Shadow%20in%20the%20Lobby.mp3";
      audio.playBGM(menuBgm, game.bgmVolume);
    } else {
      audio.stopBGM();
    }
  }, [game.bgmEnabled, game.bgmVolume, game.phase]);

  const handlePromo = () => {
    if (!promoCode) return;
    const msg = game.usePromoCode(promoCode);
    setPromoMessage(msg);
    setPromoCode("");
    setTimeout(() => setPromoMessage(null), 4000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'PROTOCOL - BLACKOUT',
      text: 'Survive the high-stakes tactical combat in PROTOCOL - BLACKOUT!',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(window.location.href);
        setPromoMessage("LINK_COPIED_TO_CLIPBOARD");
        setTimeout(() => setPromoMessage(null), 2000);
      }
    } catch (err) {
      console.log('Error sharing', err);
    }
  };

  const showPrivacy = () => {
    setActiveDocument({
      title: "PRIVACY_PROTOCOL",
      content: "1. DATA_ISOLATION: No user data is transmitted to external servers. All session metadata is processed locally on this device.\n\n2. PERSISTENCE: Credits and unlocks are stored in the browser's Local Storage. Clearing cache will reset progression.\n\n3. ANALYTICS: We do not track tactical performance or operative identities. The system is designed for complete anonymity."
    });
  };

  const showTerms = () => {
    setActiveDocument({
      title: "TERMS_OF_SERVICE",
      content: "1. OPERATIONAL_RISK: You acknowledge that tactical failure, AP mismanagement, and total elimination are inherent risks of the protocol.\n\n2. FAIR_PLAY: The AP matrix is a fixed mathematical constant. Attempts to bypass logic gates are prohibited.\n\n3. DISCRETION: Operative identities should remain encrypted during the pass-phase to maintain tactical integrity."
    });
  };

  const showFeedback = () => {
    setActiveDocument({
      title: "FEEDBACK_TRANSMISSION",
      content: "SYSTEM_MESSAGE: Direct uplink currently offline.\n\nPlease transmit all bug reports, balance suggestions, or feature requests to:\n\ndev@protocol-blackout.sys\n\nInclude your 'Build Version' (v2.5.2) in the subject line for priority processing."
    });
  };

  const showAbout = () => {
    setActiveDocument({
      title: "ABOUT_THE_ARCHITECT",
      content: "PROTOCOL - BLACKOUT was developed by VzLatte at CyberNexus Labs.\n\nBuilt on a foundation of recursive logic and high-stakes strategy, this system serves as a training ground for operatives seeking to master energy management and psychological prediction.\n\nENGINE: SynthCore v2.5\nAUDIO: Pulsar-OS\nVISUALS: Interlink-Grid"
    });
  };

  const handleInitialize = () => {
    const audio = AudioService.getInstance();
    audio.initContext();
    playSfx('startup');
    game.setPhase(Phase.GAME_TYPE_SELECTION);
  };

  const renderActiveView = () => {
    if (game.phase === Phase.SPLASH) {
       return <SplashView visualLevel={game.visualLevel} onInitialize={handleInitialize} />;
    }

    if (currentTab === Tab.MARKET) {
      return <BlackMarketView game={game} onBack={() => setCurrentTab(Tab.TERMINAL)} />;
    }
    if (currentTab === Tab.ARCHIVE) {
      return <ArchiveView game={game} onBack={() => setCurrentTab(Tab.TERMINAL)} />;
    }
    if (currentTab === Tab.OPERATIVES) {
      return <OperativesListView game={game} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} />;
    }

    switch (game.phase) {
      case Phase.GAME_TYPE_SELECTION:
        return (
          <GameTypeSelectionView 
            visualLevel={game.visualLevel} 
            onCampaign={() => game.setPhase(Phase.CHAPTER_SELECTION)}
            onCustom={() => game.setPhase(Phase.MENU)}
            onHelp={() => game.setIsHelpOpen(true)}
            onSettings={() => game.setIsSettingsOpen(true)}
            credits={game.credits}
            xp={game.xp}
          />
        );
      case Phase.CHAPTER_SELECTION:
        return <ChapterSelectionView game={game} onSelectChapter={() => game.setPhase(Phase.CAMPAIGN_MAP)} onBack={() => game.setPhase(Phase.GAME_TYPE_SELECTION)} />;
      case Phase.CAMPAIGN_MAP:
        return <NodeSelectorView game={game} onSelectLevel={game.startCampaignLevel} onBack={() => game.setPhase(Phase.CHAPTER_SELECTION)} />;
      case Phase.MENU:
        return <MenuView visualLevel={game.visualLevel} onStartGame={game.startGame} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onBack={() => game.setPhase(Phase.GAME_TYPE_SELECTION)} credits={game.credits} xp={game.xp} />;
      case Phase.SETUP_PLAYERS:
        return <SetupPlayersView game={game} />;
      case Phase.BLACKOUT_SELECTION:
        return <SelectionView game={game} />;
      case Phase.PASS_PHONE:
        return <PassPhoneView game={game} />;
      case Phase.TURN_ENTRY:
        return <TurnEntryView game={game} />;
      case Phase.RESOLUTION:
        return <ResolutionView game={game} />;
      case Phase.GAME_OVER:
        return <GameOverView game={game} />;
      default:
        return <GameTypeSelectionView 
            visualLevel={game.visualLevel} 
            onCampaign={() => game.setPhase(Phase.CHAPTER_SELECTION)}
            onCustom={() => game.setPhase(Phase.MENU)}
            onHelp={() => game.setIsHelpOpen(true)}
            onSettings={() => game.setIsSettingsOpen(true)}
            credits={game.credits}
            xp={game.xp}
          />;
    }
  };

  return (
    <>
      {renderActiveView()}
      
      <BottomNav 
        currentTab={currentTab} 
        onTabChange={(tab) => {
          playSfx('beep');
          setCurrentTab(tab);
        }} 
        phase={game.phase} 
      />

      <Modal 
        isOpen={game.isHelpOpen} 
        onClose={() => game.setIsHelpOpen(false)} 
        title="OPERATIONAL_MANUAL.SYS"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-12 pb-10">
           <section className="space-y-4">
              <h3 className="text-white font-black mb-3 uppercase text-[10px] tracking-widest border-b border-sky-500/30 pb-2 flex items-center gap-2"><Target size={16} className="text-sky-400"/> THE MISSION</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Protocol - Blackout is a high-stakes tactical game of psychological warfare. Players allocate <span className="text-sky-400 font-bold">Action Points (AP)</span> in secret to attack, block, or reserve energy. The goal is simple: be the last operative standing.
              </p>
           </section>

           <section className="space-y-4">
              <h3 className="text-white font-black mb-3 uppercase text-[10px] tracking-widest border-b border-red-500/30 pb-2 flex items-center gap-2"><Activity size={16} className="text-red-400"/> CORE MECHANICS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-black/40 p-5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-teal-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> Action Points</div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-mono">You gain +2 AP every round (up to a cap of 10). Mismanaging your energy leads to a total system failure.</p>
                 </div>
                 <div className="bg-black/40 p-5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-red-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><Skull size={12}/> HP Pool</div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-mono">Start with 40 HP. When you reach 0, you are neutralized. Defense is mandatory.</p>
                 </div>
              </div>
           </section>

           <section className="space-y-4">
              <h3 className="text-white font-black mb-3 uppercase text-[10px] tracking-widest border-b border-sky-500/30 pb-2 flex items-center gap-2"><Globe size={16} className="text-sky-400"/> CHAOS EVENTS</h3>
              <p className="text-[10px] text-slate-500 font-mono mb-4 uppercase">Chaos mode introduces environmental variables every round:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                 {CHAOS_DECK.map(event => (
                   <div key={event.name} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex justify-between gap-4">
                      <span className="text-sky-400 font-black text-[9px] uppercase tracking-tighter whitespace-nowrap min-w-[100px]">{event.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono text-right">{event.description}</span>
                   </div>
                 ))}
              </div>
           </section>

           <section className="space-y-4">
              <h3 className="text-white font-black mb-3 uppercase text-[10px] tracking-widest border-b border-sky-500/30 pb-2 flex items-center gap-2"><Database size={16} className="text-sky-400"/> PROGRESSION & MERIT</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Winning simulations grants <span className="text-sky-400 font-bold">Data Credits (CR)</span>. Use these in the <span className="text-teal-400 font-bold">Operatives Terminal</span> to unlock experimental units. Completion of the campaign nodes also unlocks new tiers of operatives.
              </p>
           </section>

           <section>
              <h3 className="text-white font-black mb-3 uppercase text-[10px] tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">ROSTER DATA</h3>
              <div className="space-y-3">
                 {Object.values(UNITS).map(u => (
                   <div key={u.type} className="bg-black/40 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <div className="font-bold text-sky-400 text-[10px] uppercase">{u.name} <span className="text-slate-600 font-mono ml-2">[{u.role}]</span></div>
                        <p className="text-[9px] italic text-slate-500">{u.special}</p>
                      </div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest whitespace-nowrap">Status: Operational</div>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </Modal>

      <Modal 
        isOpen={game.isSettingsOpen} 
        onClose={() => { game.setIsSettingsOpen(false); setActiveDocument(null); }} 
        title="INTERFACE CONFIG"
        maxWidth="max-w-xl"
      >
        {activeDocument ? (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setActiveDocument(null)} 
              className="flex items-center gap-2 text-[10px] font-black uppercase text-sky-400 mb-4 hover:text-white transition-colors"
            >
              <ChevronLeft size={14} /> Back to Interface
            </button>
            <h3 className="text-xl font-black italic uppercase text-white">{activeDocument.title}</h3>
            <div className="bg-black/40 p-6 rounded-3xl border border-slate-800 text-slate-400 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {activeDocument.content}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setActiveDocument(null)}>Return</Button>
          </div>
        ) : (
          <div className="space-y-10 mb-6">
            <div className="bg-slate-950/50 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
               <label className="text-[10px] font-mono uppercase text-slate-500 block tracking-widest flex items-center gap-2">
                  <Gift size={14} className="text-amber-500" /> Security Override Keys
               </label>
               <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                     type="text" 
                     value={promoCode} 
                     onChange={(e) => setPromoCode(e.target.value)} 
                     placeholder="ENTER_KEY"
                     className="flex-1 bg-black/60 border border-slate-800 p-3 rounded-2xl text-xs text-white font-mono uppercase focus:border-sky-500 outline-none"
                  />
                  <Button variant="primary" size="sm" onClick={handlePromo} disabled={!promoCode} className="w-full sm:w-auto">Inject</Button>
               </div>
               {promoMessage && (
                 <div className="text-[9px] font-mono text-sky-400 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                    {promoMessage}
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 block mb-3 tracking-widest">Audio Feedback</label>
                  <div className="space-y-3">
                    <button 
                      onClick={() => { game.setSfxEnabled(!game.sfxEnabled); playSfx('beep'); }}
                      className={`w-full flex justify-between items-center p-3 sm:p-4 rounded-2xl border transition-all ${game.sfxEnabled ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                    >
                      <div className="flex items-center gap-3">
                        {game.sfxEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        <span className="font-black uppercase text-[10px] tracking-widest">Effects</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${game.sfxEnabled ? 'bg-sky-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${game.sfxEnabled ? 'left-6' : 'left-1'}`}></div>
                      </div>
                    </button>

                    <button 
                      onClick={() => { game.setBgmEnabled(!game.bgmEnabled); playSfx('beep'); }}
                      className={`w-full flex justify-between items-center p-3 sm:p-4 rounded-2xl border transition-all ${game.bgmEnabled ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                    >
                      <div className="flex items-center gap-3">
                        {game.bgmEnabled ? <Music size={20} /> : <Music size={20} className="opacity-40" />}
                        <span className="font-black uppercase text-[10px] tracking-widest">Music</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${game.bgmEnabled ? 'bg-sky-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${game.bgmEnabled ? 'left-6' : 'left-1'}`}></div>
                      </div>
                    </button>

                    {game.bgmEnabled && (
                      <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                          <span>BGM Volume</span>
                          <span className="text-sky-400">{Math.round(game.bgmVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.05" 
                          value={game.bgmVolume} 
                          onChange={(e) => game.setBgmVolume(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 block mb-3 tracking-widest">Visual Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[VisualLevel.LOW, VisualLevel.MID, VisualLevel.HIGH].map((level) => (
                      <button
                        key={level}
                        onClick={() => { game.setVisualLevel(level); playSfx('confirm'); }}
                        className={`py-2 rounded-xl border font-black text-[8px] uppercase transition-all ${game.visualLevel === level ? 'bg-sky-500 border-sky-400 text-black' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-mono uppercase text-slate-500 block mb-3 tracking-widest">System Info</label>
                 <div className="space-y-2">
                    <button onClick={handleShare} className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-300 transition-colors">
                       <Share2 size={16} /> Share Protocol
                    </button>
                    <button onClick={showFeedback} className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-300 transition-colors">
                       <MessageSquare size={16} /> Send Feedback
                    </button>
                    <button onClick={showAbout} className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-300 transition-colors">
                       <Info size={16} /> About Creator
                    </button>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button onClick={showPrivacy} className="flex items-center justify-center gap-2 p-3 text-[9px] font-bold uppercase text-slate-500 hover:text-sky-400 transition-colors bg-black/30 rounded-xl">
                  <Shield size={12}/> Privacy
               </button>
               <button onClick={showTerms} className="flex items-center justify-center gap-2 p-3 text-[9px] font-bold uppercase text-slate-500 hover:text-sky-400 transition-colors bg-black/30 rounded-xl">
                  <FileText size={12}/> Terms
               </button>
            </div>

            <div className="flex justify-between items-center text-[8px] font-mono text-slate-600 uppercase tracking-[0.4em] border-t border-slate-800 pt-6">
               <span>Protocol Build v2.5.2-STABLE</span>
               <span>© 2025 CyberNexus</span>
            </div>
            <Button variant="primary" className="w-full mt-4" onClick={() => game.setIsSettingsOpen(false)}>Close Terminal</Button>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={game.isExitConfirming} 
        onClose={() => game.setIsExitConfirming(false)} 
        title="ABORT_MISSION?"
        zIndex="z-[110]"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
             <AlertTriangle size={32} />
          </div>
          <p className="text-slate-400 font-mono text-[10px] uppercase mb-8">Current session progress will be lost.</p>
          <div className="flex gap-4">
             <Button variant="ghost" className="flex-1" onClick={() => game.setIsExitConfirming(false)}>Resume</Button>
             <Button variant="danger" className="flex-1" onClick={game.resetToMain}>Abort</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default App;
