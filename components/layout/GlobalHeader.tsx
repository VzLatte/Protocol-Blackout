
import React from 'react';
import { HelpCircle, Settings, Power, Database, Zap } from 'lucide-react';
import { Phase } from '../../types';

interface GlobalHeaderProps {
  phase: Phase;
  onHelp: () => void;
  onSettings: () => void;
  onExit: () => void;
  credits: number;
  xp?: number;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ phase, onHelp, onSettings, onExit, credits, xp = 0 }) => {
  const level = Math.floor(xp / 1000) + 1;
  const currentXpInLevel = xp % 1000;
  const xpPercent = (currentXpInLevel / 1000) * 100;

  return (
    <div className="w-full sticky top-0 z-40 shrink-0">
      <div className="flex justify-between items-center w-full px-6 py-4 border-b border-slate-800 bg-[#0a1628] backdrop-blur-xl h-20 shadow-lg">
         <div className="flex items-center gap-4">
            {/* Level Indicator */}
            <div className="flex flex-col items-center justify-center bg-teal-500/10 border border-teal-500/30 w-10 h-10 rounded-xl">
               <span className="text-[7px] font-mono text-teal-500 uppercase leading-none mb-1">LVL</span>
               <span className="text-sm font-black text-white italic leading-none">{level}</span>
            </div>

            {/* Resources Bar */}
            <div className="flex flex-col gap-1.5">
               <div className="flex items-center gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-2 shadow-inner group">
                     <Database size={12} className="text-sky-400 fill-sky-400/10 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black font-mono text-sky-400 tracking-tighter">{credits} CR</span>
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                     {xp} <span className="text-teal-500">XP</span>
                  </div>
               </div>
               
               {/* Mini XP Bar */}
               <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-1000" 
                    style={{ width: `${xpPercent}%` }}
                  />
               </div>
            </div>
         </div>

         <div className="flex gap-2">
            <button onClick={onHelp} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 rounded-lg border border-slate-800/50"><HelpCircle size={18} /></button>
            <button onClick={onSettings} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 rounded-lg border border-slate-800/50"><Settings size={18} /></button>
            {phase !== Phase.MENU && phase !== Phase.SPLASH && phase !== Phase.GAME_TYPE_SELECTION && (
              <button onClick={onExit} className="p-2 text-red-400 hover:text-red-300 transition-colors bg-red-950/20 rounded-lg border border-red-900/20"><Power size={18} /></button>
            )}
         </div>
      </div>
      {/* Subtle Title Overlay */}
      <div className="w-full py-1 bg-sky-500/5 border-b border-sky-500/10 flex justify-center items-center">
         <span className="text-[7px] font-mono text-sky-500/40 uppercase tracking-[1em] font-bold">PROTOCOL - BLACKOUT // UPLINK_STABLE</span>
      </div>
    </div>
  );
};
