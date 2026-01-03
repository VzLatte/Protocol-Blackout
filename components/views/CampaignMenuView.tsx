
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel } from '../../types';
import { Button } from '../ui/Button';
import { Terminal, Shield, Crosshair, Cpu, Award, Lock, Activity, Trophy, Zap } from 'lucide-react';

interface CampaignMenuViewProps {
  game: any;
  onSelectLevel: (lvl: number) => void;
  onBack: () => void;
}

export const CampaignMenuView: React.FC<CampaignMenuViewProps> = ({ game, onSelectLevel, onBack }) => {
  const highest = game.highestLevelReached;
  const { stats } = game;
  
  const levels = [
    { id: 1, name: "The Recruit", description: "Learn to break 'The Turtle'. Focus on AP efficiency.", icon: <Shield size={20}/>, difficulty: "EASY" },
    { id: 2, name: "The Wall", description: "Counter aggressive maneuvers. Perfect your blocking.", icon: <Crosshair size={20}/>, difficulty: "EASY" },
    { id: 3, name: "The Duo", description: "Face multiple threats. Manage threat priority.", icon: <Terminal size={20}/>, difficulty: "NORMAL" },
    { id: 4, name: "The Shadow", description: "Counter intelligence required. Face a Strategist unit.", icon: <Cpu size={20}/>, difficulty: "NORMAL" },
    { id: 5, name: "The Architect", description: "BOSS ENCOUNTER. Unstable logic pattern detected.", icon: <Award size={20}/>, difficulty: "HARD" },
  ];

  const completionPercent = Math.round(((highest - 1) / 5) * 100);
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.CAMPAIGN_MAP} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={onBack} credits={game.credits} />
      
      <div className="flex-1 p-6 flex flex-col items-center max-w-4xl mx-auto w-full pt-10 pb-32">
         <div className="w-full space-y-12">
            <div className="text-center space-y-4">
               <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">ARCHIVE_PROTOCOL</h2>
               <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Review historical data and operational progress</p>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-[#0a0f1e] border border-slate-800 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center">
                  <Activity size={24} className="text-teal-500 mb-2" />
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Win Ratio</div>
                  <div className="text-3xl font-black text-white italic">{winRate}%</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase mt-1">{stats.wins}W / {stats.losses}L</div>
               </div>
               <div className="bg-[#0a0f1e] border border-slate-800 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center">
                  <Trophy size={24} className="text-amber-500 mb-2" />
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Completion</div>
                  <div className="text-3xl font-black text-white italic">{completionPercent}%</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase mt-1">{highest - 1} / 5 Nodes</div>
               </div>
               <div className="bg-[#0a0f1e] border border-slate-800 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center">
                  <Zap size={24} className="text-red-500 mb-2" />
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Total Rounds</div>
                  <div className="text-3xl font-black text-white italic">{stats.totalGames}</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase mt-1">Simulations Run</div>
               </div>
            </div>

            {/* Levels List */}
            <div className="space-y-4">
               <div className="flex items-center gap-3 px-2">
                  <Terminal size={14} className="text-teal-500" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Available Nodes</span>
               </div>
               {levels.map((lvl) => {
                  const isLocked = lvl.id > highest;
                  return (
                    <button 
                      key={lvl.id}
                      onClick={() => !isLocked && onSelectLevel(lvl.id)}
                      disabled={isLocked}
                      className={`w-full bg-slate-900/60 backdrop-blur-xl border p-6 rounded-[2.5rem] flex items-center gap-6 group transition-all text-left shadow-xl ${isLocked ? 'border-slate-900/50 opacity-40 cursor-not-allowed' : 'border-slate-800 hover:border-teal-500'}`}
                    >
                       <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isLocked ? 'bg-slate-950 border-slate-800 text-slate-700' : lvl.id === 5 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-teal-500/10 border-teal-500/30 text-teal-400'} ${!isLocked && 'group-hover:scale-110'}`}>
                          {isLocked ? <Lock size={20} /> : lvl.icon}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                             <h3 className={`text-xl font-black italic uppercase ${isLocked ? 'text-slate-600' : 'text-white group-hover:text-teal-400 transition-colors'}`}>Node {lvl.id}: {lvl.name}</h3>
                             {!isLocked && <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${lvl.difficulty === 'HARD' ? 'bg-red-950 text-red-400 border border-red-500/30' : lvl.difficulty === 'NORMAL' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-teal-950 text-teal-400 border border-teal-500/30'}`}>{lvl.difficulty}</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{isLocked ? "ACCESS_DENIED: Decrypt previous node." : lvl.description}</p>
                       </div>
                    </button>
                  );
               })}
            </div>

            <Button variant="ghost" className="w-full py-4 rounded-3xl" onClick={onBack}>Close Archive</Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};
