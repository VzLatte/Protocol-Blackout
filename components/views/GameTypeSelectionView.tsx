
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel } from '../../types';
import { BookOpen, Users, ChevronRight } from 'lucide-react';

interface GameTypeSelectionViewProps {
  onCampaign: () => void;
  onCustom: () => void;
  visualLevel: VisualLevel;
  onHelp: () => void;
  onSettings: () => void;
  credits: number;
  xp?: number;
}

export const GameTypeSelectionView: React.FC<GameTypeSelectionViewProps> = ({ 
  onCampaign, onCustom, visualLevel, onHelp, onSettings, credits, xp = 0
}) => {
  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.GAME_TYPE_SELECTION} onHelp={onHelp} onSettings={onSettings} onExit={() => {}} credits={credits} xp={xp} />
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 pt-12 pb-24 space-y-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl font-black text-white italic uppercase tracking-tighter">PROTOCOL</h1>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.4em] opacity-80">Select Deployment Type</p>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-5xl px-4">
            <button 
              onClick={onCampaign} 
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-teal-500 p-10 rounded-[3rem] text-left group transition-all shadow-2xl hover:scale-[1.02] active:scale-95 flex flex-col items-start gap-4"
            >
               <div className="p-4 bg-teal-500/10 rounded-2xl text-teal-500 group-hover:scale-110 transition-transform">
                  <BookOpen size={28} />
               </div>
               <div>
                  <h2 className="text-3xl font-black italic uppercase text-white mb-1 group-hover:text-teal-400 transition-colors">Campaign</h2>
                  <p className="text-slate-500 text-[9px] font-mono uppercase tracking-widest leading-relaxed">
                     Single-player narrative protocol. Master the system.
                  </p>
               </div>
               <div className="mt-2 text-[8px] font-black text-teal-500 uppercase flex items-center gap-2">Initialize Training <ChevronRight size={10} /></div>
            </button>

            <button 
              onClick={onCustom} 
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-amber-500 p-10 rounded-[3rem] text-left group transition-all shadow-2xl hover:scale-[1.02] active:scale-95 flex flex-col items-start gap-4"
            >
               <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
                  <Users size={28} />
               </div>
               <div>
                  <h2 className="text-3xl font-black italic uppercase text-white mb-1 group-hover:text-amber-400 transition-colors">Sandbox</h2>
                  <p className="text-slate-500 text-[9px] font-mono uppercase tracking-widest leading-relaxed">
                     2-6 players single-device tactical combat.
                  </p>
               </div>
               <div className="mt-2 text-[8px] font-black text-amber-500 uppercase flex items-center gap-2">Execute Local Play <ChevronRight size={10} /></div>
            </button>
         </div>
         
         <div className="text-slate-600 font-mono text-[8px] uppercase tracking-[0.6em] animate-pulse">
            Awaiting Command Inputs...
         </div>
      </div>
    </ScreenWrapper>
  );
};
