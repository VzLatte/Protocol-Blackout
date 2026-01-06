
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { Button } from '../ui/Button';
import { Trophy, Zap, AlertTriangle, Cpu, Terminal, TrendingUp } from 'lucide-react';
import { VisualLevel } from '../../types';
import { CAMPAIGN_LEVELS } from '../../campaignRegistry';

interface GameOverViewProps {
  game: any;
}

export const GameOverView: React.FC<GameOverViewProps> = ({ game }) => {
  const winner = game.players.find((p: any) => !p.isEliminated);
  const isCampaign = !!game.currentCampaignLevelId;
  const currentLvl = isCampaign ? CAMPAIGN_LEVELS.find(l => l.id === game.currentCampaignLevelId) : null;
  const isVictory = game.victoryReason === "OPERATIONAL_SUCCESS" || (!isCampaign && !!winner && !winner.isAI);
  
  const narrativeText = isCampaign && currentLvl
    ? (isVictory ? currentLvl.winText : currentLvl.lossText)
    : (winner ? "Simulation complete. Operative status: Viable." : "Zero-sum achieved. Tactical void detected.");

  const titleText = isCampaign 
    ? (isVictory ? "MISSION_SUCCESS" : "DATA_CORRUPTION")
    : (winner ? "SECTOR_SECURED" : "TOTAL_BLACKOUT");

  return (
    <ScreenWrapper visualLevel={game.visualLevel} className="p-8 text-center">
       <div className="z-10 animate-in zoom-in duration-1000 space-y-12 max-w-2xl w-full flex flex-col items-center py-20">
          <div className="relative">
            {isVictory ? (
              <>
                <Trophy size={140} className="text-teal-500 mx-auto drop-shadow-[0_0_40px_rgba(20,184,166,0.8)] relative z-20" />
                <div className="absolute inset-0 bg-teal-500/30 blur-[100px] rounded-full scale-150 z-10 animate-pulse"></div>
              </>
            ) : (
              <>
                <AlertTriangle size={140} className="text-red-500 mx-auto drop-shadow-[0_0_40px_rgba(239,68,68,0.8)] relative z-20" />
                <div className="absolute inset-0 bg-red-500/30 blur-[100px] rounded-full scale-150 z-10 animate-pulse"></div>
              </>
            )}
          </div>
          
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-black uppercase italic text-white tracking-[0.3em] opacity-60">
              {titleText}
            </h1>
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.6em]">
                {isCampaign ? "Establishment Feed" : (winner ? "Standing Operative" : "System Status")}
              </div>
              <div className={`text-4xl sm:text-6xl md:text-7xl font-black uppercase italic tracking-tighter glitch-text leading-none drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)] ${isVictory ? 'text-teal-400' : 'text-red-500'}`}>
                {isCampaign ? (isVictory ? "LINK_STABLE" : "SIGNAL_LOST") : (winner ? winner.name : "VOID_DETECTED")}
              </div>
              
              <div className="max-w-md mx-auto">
                <p className="text-slate-300 font-mono text-xs sm:text-sm uppercase tracking-widest mt-8 italic leading-relaxed border-l-2 border-slate-800 pl-4 py-2">
                  "{narrativeText}"
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md animate-in slide-in-from-top duration-700 delay-500">
             <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-4 mb-2">
                   <div className={`p-2 rounded-xl ${isVictory ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-500'}`}>
                      <Zap size={16}/>
                   </div>
                   <div className="text-left">
                      <div className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Merit Accrued</div>
                      <div className="text-xs font-black text-white italic uppercase">CREDITS</div>
                   </div>
                </div>
                <div className={`text-3xl font-black italic text-right ${isVictory ? 'text-sky-400' : 'text-slate-600'}`}>
                   +{isVictory ? (isCampaign ? currentLvl?.creditReward : 250) : 0}
                </div>
             </div>

             <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-4 mb-2">
                   <div className={`p-2 rounded-xl ${isVictory ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-500'}`}>
                      <TrendingUp size={16}/>
                   </div>
                   <div className="text-left">
                      <div className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Neural Growth</div>
                      <div className="text-xs font-black text-white italic uppercase">XP</div>
                   </div>
                </div>
                <div className={`text-3xl font-black italic text-right ${isVictory ? 'text-teal-400' : 'text-slate-600'}`}>
                   +{isVictory ? (isCampaign ? currentLvl?.xpReward : 100) : 0}
                </div>
             </div>
          </div>

          <div className="w-full pt-8 flex flex-col gap-4">
            <Button 
              variant="primary" size="lg" 
              className="w-full py-6 text-xl shadow-[0_0_30px_rgba(20,184,166,0.2)]" 
              onClick={game.resetToMain}
            >
              Return to Command
            </Button>
          </div>
       </div>
    </ScreenWrapper>
  );
};
