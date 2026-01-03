
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { GameMode, Phase, VisualLevel } from '../../types';
import { Button } from '../ui/Button';
import { ChevronLeft } from 'lucide-react';

interface MenuViewProps {
  onStartGame: (mode: GameMode) => void;
  visualLevel: VisualLevel;
  onHelp: () => void;
  onSettings: () => void;
  onBack: () => void;
  credits: number;
}

export const MenuView: React.FC<MenuViewProps> = ({ onStartGame, visualLevel, onHelp, onSettings, onBack, credits }) => {
  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.MENU} onHelp={onHelp} onSettings={onSettings} onExit={() => {}} credits={credits} />
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 pt-12 pb-24 space-y-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="space-y-4">
            <div className="h-1 w-24 bg-teal-500 mx-auto rounded-full mb-2"></div>
            <h1 className="text-6xl sm:text-7xl font-black text-white italic uppercase tracking-tighter">COMMAND</h1>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em] opacity-80">Select Operational Environment</p>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl px-4">
            <button 
              onClick={() => onStartGame(GameMode.TACTICAL)} 
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-teal-500 p-10 rounded-[2.5rem] text-left group transition-all shadow-2xl hover:scale-[1.02] active:scale-95"
            >
               <h2 className="text-3xl font-black italic uppercase text-white mb-3 group-hover:text-teal-400 transition-colors">Tactical</h2>
               <div className="h-[1px] w-12 bg-teal-500/30 mb-4 group-hover:w-24 transition-all duration-500"></div>
               <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest leading-relaxed">Pure mind games. Standard environment protocols. No external interference.</p>
            </button>
            <button 
              onClick={() => onStartGame(GameMode.CHAOS)} 
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-red-500 p-10 rounded-[2.5rem] text-left group transition-all shadow-2xl hover:scale-[1.02] active:scale-95"
            >
               <h2 className="text-3xl font-black italic uppercase text-white mb-3 group-hover:text-red-400 transition-colors">Chaos</h2>
               <div className="h-[1px] w-12 bg-red-500/30 mb-4 group-hover:w-24 transition-all duration-500"></div>
               <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest leading-relaxed">Unstable system matrix. Random dynamic events. Expect the unexpected.</p>
            </button>
         </div>
         <div className="pt-8">
           <Button variant="ghost" size="lg" onClick={onBack} className="px-12 py-4">
              <ChevronLeft size={16} /> Return to Type Selection
           </Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};
