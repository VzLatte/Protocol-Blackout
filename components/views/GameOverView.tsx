
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { Button } from '../ui/Button';
import { Trophy, Zap, AlertTriangle, Cpu, Terminal, TrendingUp, ChevronRight, Star } from 'lucide-react';
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
  
  // Rank Calculation
  const roundsUsed = game.round;
  const maxRounds = game.maxRounds;
  const ratio = roundsUsed / maxRounds;
  let rank = "C";
  if (ratio <= 0.4) rank = "S";
  else if (ratio <= 0.6) rank = "A";
  else if (ratio <= 0.8) rank = "B";
  
  // Fail Rank
  if (!isVictory) rank = "F";

  const rankColors = {
      "S": "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]",
      "A": "text-teal-400",
      "B": "text-sky-400",
      "C": "text-slate-400",
      "F": "text-red-600"
  };

  const narrativeText = isCampaign && currentLvl
    ? (isVictory ? currentLvl.winText : currentLvl.lossText)
    : (winner ? "Simulation complete. Operative status: Viable." : "Zero-sum achieved. Tactical void detected.");

  const titleText = isCampaign 
    ? (isVictory ? "MISSION_SUCCESS" : "DATA_CORRUPTION")
    : (winner ? "SECTOR_SECURED" : "TOTAL_BLACKOUT");

  // Dynamic Subtitle based on victory type
  let subTitle = "SYSTEM_STATUS";
  if (isVictory) {
      if (game.victoryReason === "OPERATIONAL_SUCCESS" && currentLvl?.winCondition === 'CONTROL') subTitle = "OBJECTIVE_SECURED";
      else if (game.victoryReason === "OPERATIONAL_SUCCESS" && currentLvl?.winCondition === 'ELIMINATION') subTitle = "THREAT_NEUTRALIZED";
      else subTitle = "TACTICAL_DOMINANCE";
  } else {
      subTitle = "CRITICAL_FAILURE";
  }

  const nextLevelIdx = CAMPAIGN_LEVELS.findIndex(l => l.id === game.currentCampaignLevelId);
  const hasNextLevel = nextLevelIdx !== -1 && nextLevelIdx + 1 < CAMPAIGN_LEVELS.length;

  return (
    <ScreenWrapper visualLevel={game.visualLevel} className="p-8 text-center">
       <div className="z-10 animate-in zoom-in duration-1000 space-y-8 max-w-2xl w-full flex flex-col items-center py-10">
          
          {/* Main Visual Icon */}
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
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.6em] animate-pulse">
                {subTitle}
              </div>
              
              {/* RANK DISPLAY */}
              {isCampaign && isVictory && (
                  <div className="py-4">
                      <div className={`text-8xl font-black italic ${rankColors[rank as keyof typeof rankColors]} leading-none`}>{rank}</div>
                      <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-2">Tactical Efficiency Rating</div>
                  </div>
              )}

              {/* VICTORY/LOSS TITLE */}
              {!isCampaign && (
                  <div className={`text-4xl sm:text-6xl md:text-7xl font-black uppercase italic tracking-tighter glitch-text leading-none drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)] ${isVictory ? 'text-teal-400' : 'text-red-500'}`}>
                    {winner ? winner.name : "VOID"}
                  </div>
              )}
              
              <div className="max-w-md mx-auto">
                <p className="text-slate-300 font-mono text-xs sm:text-sm uppercase tracking-widest mt-4 italic leading-relaxed border-l-2 border-slate-800 pl-4 py-2">
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
                   +{game.lastEarnedCredits}
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
                   +{game.lastEarnedXp}
                </div>
             </div>
          </div>

          <div className="w-full pt-8 flex flex-col gap-4">
            {/* NEXT MISSION BUTTON */}
            {isCampaign && isVictory && hasNextLevel && (
                <Button 
                    variant="primary" size="lg" 
                    className="w-full py-6 text-xl shadow-[0_0_30px_rgba(20,184,166,0.4)] animate-pulse" 
                    onClick={() => { game.playSfx('confirm'); game.advanceCampaign(); }}
                >
                    NEXT MISSION <ChevronRight size={24} />
                </Button>
            )}

            <Button 
              variant={isCampaign && isVictory ? 'secondary' : 'primary'} size="lg" 
              className="w-full py-6 text-xl" 
              onClick={game.resetToMain}
            >
              Return to Command
            </Button>
          </div>
       </div>
    </ScreenWrapper>
  );
};
