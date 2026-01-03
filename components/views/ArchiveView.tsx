
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel } from '../../types';
import { Button } from '../ui/Button';
import { Terminal, Shield, Crosshair, Cpu, Award, Lock, Activity, Trophy, Zap, History, BarChart3, Database } from 'lucide-react';

interface ArchiveViewProps {
  game: any;
  onBack: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ game, onBack }) => {
  const highest = game.highestLevelReached;
  const { stats } = game;
  
  const completionPercent = Math.round(((highest - 1) / 5) * 100);
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.CAMPAIGN_MAP} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={onBack} credits={game.credits} />
      
      <div className="flex-1 p-6 flex flex-col items-center max-w-4xl mx-auto w-full pt-10 pb-32">
         <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="text-center space-y-4">
               <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">ARCHIVE</h2>
               <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Historical Analysis & Merit Records</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-[#0a1628] border border-slate-800 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center group hover:border-teal-500/50 transition-colors">
                  <Activity size={24} className="text-teal-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Combat Efficiency</div>
                  <div className="text-3xl font-black text-white italic">{winRate}%</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase mt-1">{stats.wins} Wins // {stats.losses} Defeats</div>
               </div>
               <div className="bg-[#0a1628] border border-slate-800 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center group hover:border-amber-500/50 transition-colors">
                  <Trophy size={24} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Node Progression</div>
                  <div className="text-3xl font-black text-white italic">{completionPercent}%</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase mt-1">{highest - 1} / 5 Training Nodes Deployed</div>
               </div>
               <div className="bg-[#0a1628] border border-slate-800 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center group hover:border-sky-500/50 transition-colors">
                  <BarChart3 size={24} className="text-sky-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">System Load</div>
                  <div className="text-3xl font-black text-white italic">{stats.totalGames}</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase mt-1">Simulations Logged</div>
               </div>
            </div>

            {/* Campaign Summary Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-[3rem] space-y-8">
               <div className="flex items-center gap-3">
                  <History size={18} className="text-teal-500" />
                  <h3 className="text-sm font-black uppercase text-white italic">Operational History Summary</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span className="uppercase">Highest Clearance Node</span>
                        <span className="text-white">NODE_{highest-1 || "NONE"}</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{width: `${completionPercent}%`}}></div>
                     </div>
                     <p className="text-[9px] text-slate-500 leading-relaxed italic">
                        The current clearance reflects your mastery over the tactical AI archetypes. Reach Node 5 to challenge 'The Architect'.
                     </p>
                  </div>

                  <div className="bg-black/30 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Database size={20} className="text-sky-400" />
                        <div>
                           <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Total Merit Accrued</div>
                           <div className="text-lg font-black text-white italic">{game.credits} CR</div>
                        </div>
                     </div>
                     <BarChart3 size={20} className="text-slate-800" />
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-center gap-4 py-8">
               <div className="flex items-center gap-4 opacity-20">
                  <div className="h-[1px] w-24 bg-slate-500"></div>
                  <History size={14} className="text-slate-500" />
                  <div className="h-[1px] w-24 bg-slate-500"></div>
               </div>
               <p className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.4em]">End of Historical Log</p>
            </div>

            <Button variant="ghost" className="w-full py-4 rounded-3xl" onClick={onBack}>Return to Terminal</Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};
