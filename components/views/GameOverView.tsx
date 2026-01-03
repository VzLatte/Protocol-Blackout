
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { Button } from '../ui/Button';
import { Trophy, Zap } from 'lucide-react';
import { VisualLevel } from '../../types';

interface GameOverViewProps {
  game: any;
}

export const GameOverView: React.FC<GameOverViewProps> = ({ game }) => {
  const winner = game.players.find((p: any) => !p.isEliminated);
  const isHighDetail = game.visualLevel === VisualLevel.HIGH;

  return (
    <ScreenWrapper visualLevel={game.visualLevel} className="p-8 text-center">
       <div className="z-10 animate-in zoom-in duration-1000 space-y-12 max-w-2xl w-full flex flex-col items-center py-20">
          <div className="relative">
            <Trophy size={140} className="text-teal-500 mx-auto drop-shadow-[0_0_40px_rgba(20,184,166,0.8)] relative z-20" />
            <div className="absolute inset-0 bg-teal-500/30 blur-[100px] rounded-full scale-150 z-10 animate-pulse"></div>
            {isHighDetail && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-400/5 rounded-full z-0 animate-ping"></div>
            )}
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-black uppercase italic text-white tracking-[0.3em] opacity-60">MISSION_SUCCESS</h1>
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-teal-500 uppercase tracking-[0.6em]">Standing Operative</div>
              <div className="text-7xl sm:text-8xl font-black text-teal-400 uppercase italic tracking-tighter glitch-text leading-none drop-shadow-[0_10px_30px_rgba(20,184,166,0.4)]">
                {winner?.name || "REDACTED"}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] w-full max-w-md animate-in slide-in-from-top duration-700 delay-500">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-500/20 text-red-500 rounded-lg"><Zap size={16}/></div>
                   <div className="text-left">
                      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Merit Rewards</div>
                      <div className="text-sm font-black text-white italic uppercase tracking-tighter">DATA_CREDITS ACCRUED</div>
                   </div>
                </div>
                <div className="text-3xl font-black text-red-500 italic">+{game.lastEarnedCredits}</div>
             </div>
          </div>

          <div className="w-full pt-8">
            <Button 
              variant="ghost" size="lg" 
              className="px-20 py-6 text-xl border-teal-500/20 hover:border-teal-500/60 transition-all duration-500" 
              onClick={game.resetToMain}
            >
              Return to Interface
            </Button>
          </div>
       </div>
    </ScreenWrapper>
  );
};
