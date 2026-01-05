
import React, { useState, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel } from '../../types';
import { Button } from '../ui/Button';
import { Terminal, Shield, Crosshair, Cpu, Award, Lock, ChevronLeft, Zap, MessageSquare } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface NodeSelectorViewProps {
  game: any;
  onSelectLevel: (lvl: number) => void;
  onBack: () => void;
}

export const NodeSelectorView: React.FC<NodeSelectorViewProps> = ({ game, onSelectLevel, onBack }) => {
  const highest = game.highestLevelReached;
  const [showLore, setShowLore] = useState(false);
  
  useEffect(() => {
    if (!game.hasSeenIntro) {
      setShowLore(true);
    }
  }, [game.hasSeenIntro]);

  const handleLoreClose = () => {
    setShowLore(false);
    game.setHasSeenIntro(true);
  };

  const levels = [
    { id: 1, name: "The Recruit", description: "Learn to break 'The Turtle'. Focus on AP efficiency.", icon: <Shield size={20}/>, difficulty: "EASY" },
    { id: 2, name: "The Wall", description: "Counter aggressive maneuvers. Perfect your blocking.", icon: <Crosshair size={20}/>, difficulty: "EASY" },
    { id: 3, name: "The Duo", description: "Face multiple threats. Manage threat priority.", icon: <Terminal size={20}/>, difficulty: "NORMAL" },
    { id: 4, name: "The Shadow", description: "Counter intelligence required. Face a Strategist unit.", icon: <Cpu size={20}/>, difficulty: "NORMAL" },
    { id: 5, name: "The Architect", description: "BOSS ENCOUNTER. Unstable logic pattern detected.", icon: <Award size={20}/>, difficulty: "HARD" },
  ];

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.CAMPAIGN_MAP} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={onBack} credits={game.credits} />
      <div className="flex-1 p-6 flex flex-col items-center max-w-4xl mx-auto w-full pt-10 pb-32 animate-in fade-in duration-700">
         <div className="w-full space-y-12">
            <div className="text-center space-y-4">
               <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">CAMPAIGN_NODES</h2>
               <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Establish Link to Operational Environment</p>
            </div>

            <div className="space-y-4">
               {levels.map((lvl) => {
                  const isLocked = lvl.id > highest;
                  return (
                    <button 
                      key={lvl.id}
                      onClick={() => !isLocked && onSelectLevel(lvl.id)}
                      disabled={isLocked}
                      className={`w-full bg-slate-900/60 backdrop-blur-xl border p-6 rounded-[2.5rem] flex items-center gap-6 group transition-all text-left shadow-xl ${isLocked ? 'border-slate-900/50 opacity-40 cursor-not-allowed' : 'border-slate-800 hover:border-teal-500 hover:scale-[1.01]'}`}
                    >
                       <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isLocked ? 'bg-slate-950 border-slate-800 text-slate-700' : lvl.id === 5 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-teal-500/10 border-teal-500/30 text-teal-400'} ${!isLocked && 'group-hover:scale-110'}`}>
                          {isLocked ? <Lock size={20} /> : lvl.icon}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                             <h3 className={`text-xl font-black italic uppercase ${isLocked ? 'text-slate-600' : 'text-white group-hover:text-teal-400 transition-colors'}`}>Node {lvl.id}: {lvl.name}</h3>
                             {!isLocked && <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${lvl.difficulty === 'HARD' ? 'bg-red-950 text-red-400 border border-red-500/30' : lvl.difficulty === 'NORMAL' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-teal-950 text-teal-400 border border-teal-500/30'}`}>{lvl.difficulty}</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{isLocked ? "ACCESS_DENIED: Master preceding nodes." : lvl.description}</p>
                       </div>
                    </button>
                  );
               })}
            </div>

            <Button variant="ghost" className="w-full py-4 rounded-3xl" onClick={onBack}>
               <ChevronLeft size={16} /> Back to Type Selection
            </Button>
         </div>
      </div>

      <Modal isOpen={showLore} onClose={handleLoreClose} title="ESTABLISHMENT_UPLINK" zIndex="z-[150]">
        <div className="space-y-6">
           <div className="flex items-center gap-3 text-sky-400 mb-2">
              <MessageSquare size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">Incoming Transmission: The Handler</span>
           </div>
           <p className="text-xs text-slate-400 font-mono leading-relaxed italic border-l-2 border-sky-500/30 pl-4">
              "Operative. You've entered the archive. Every node here is a lesson written in code and spilled data. The Establishment doesn't care about your style, only your survival."
           </p>
           <p className="text-xs text-slate-400 font-mono leading-relaxed italic border-l-2 border-sky-500/30 pl-4">
              "Master the AP matrix. Learn the rhythm of escalation. If you fail, you're just another line of deleted logic. If you win... well, maybe you'll see Node 5."
           </p>
           <Button variant="primary" className="w-full mt-4" onClick={handleLoreClose}>Acknowledge</Button>
        </div>
      </Modal>
    </ScreenWrapper>
  );
};
