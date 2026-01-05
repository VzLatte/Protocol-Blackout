
import React, { useState, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Skull, Shield, Zap, TrendingUp, Cpu } from 'lucide-react';
import { ActionType, Phase } from '../../types';
import { DefenseDisplay } from './DefenseDisplay';

interface ResolutionViewProps {
  game: any;
}

export const ResolutionView: React.FC<ResolutionViewProps> = ({ game }) => {
  const { resolutionLogs, round, nextTurn, scrollRef, visualLevel, credits, phaseTransition } = game;
  const [visibleCount, setVisibleCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (visibleCount < resolutionLogs.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
        game.playSfx('beep');
      }, 600); 
      return () => clearTimeout(timer);
    } else {
      setIsDone(true);
    }
  }, [visibleCount, resolutionLogs]);

  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const getPlayerName = (id?: string) => game.players.find((p: any) => p.id === id)?.name || "SYSTEM";

  return (
    <ScreenWrapper visualLevel={visualLevel} noScroll centerContent={false}>
      <GlobalHeader 
        phase={Phase.RESOLUTION} 
        onHelp={() => game.setIsHelpOpen(true)} 
        onSettings={() => game.setIsSettingsOpen(true)} 
        onExit={() => game.setIsExitConfirming(true)} 
        credits={credits} 
      />
      
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center max-w-4xl mx-auto w-full overflow-hidden animate-in fade-in duration-500 pb-28 pt-10">
         <div className="text-center mb-8 shrink-0">
            <div className="text-teal-500 font-mono text-[8px] uppercase tracking-[0.5em] mb-2 opacity-60">TACTICAL_PLAYBACK_INITIATED</div>
            <h2 className="text-4xl font-black uppercase text-white italic tracking-tighter">CYCLE {round - 1} RESOLUTION</h2>
         </div>

         {phaseTransition && (
           <div className="w-full mb-6 bg-sky-500/10 border border-sky-500/30 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
              <TrendingUp size={20} className="text-sky-400" />
              <div className="text-[10px] font-mono text-white uppercase tracking-tight">{phaseTransition}</div>
           </div>
         )}
         
         <div ref={scrollRef} className="flex-1 w-full space-y-3 overflow-y-auto pr-1 custom-scrollbar pb-10">
            {resolutionLogs.slice(0, visibleCount).map((log: any, i: number) => {
              const attacker = getPlayerName(log.attackerId);
              const isBlock = log.type === ActionType.BLOCK || log.type === ActionType.PHASE;
              const isAttack = log.type === ActionType.ATTACK;
              const isReserve = log.type === ActionType.RESERVE;

              return (
                <div 
                  key={i} 
                  className={`bg-slate-900/60 border p-4 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300 relative group
                    ${isBlock ? 'border-teal-900/40 bg-teal-500/5' : ''}
                    ${isAttack ? 'border-red-900/40 bg-red-500/5' : ''}
                    ${isReserve ? 'border-amber-900/40 bg-amber-500/5' : ''}`}
                >
                   <div className="flex items-center gap-4">
                       {/* Icon Section */}
                       <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border
                          ${isBlock ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 
                            isAttack ? 'bg-red-500/10 text-red-500 border-red-500/30' : 
                            'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                          {isBlock ? <Shield size={20} /> : isAttack ? <Skull size={20} /> : <Zap size={20} />}
                       </div>

                       {/* Data Section */}
                       <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                             <div className="text-[10px] font-black text-white uppercase tracking-tighter truncate">
                               {attacker} 
                               {isAttack && log.targetName && <span className="text-slate-500 mx-2 font-mono text-[8px]">➔ {log.targetName}</span>}
                             </div>
                             <div className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">
                                {log.resultMessage}
                             </div>
                          </div>

                          {/* Tactical Badges */}
                          <div className="flex items-center gap-2 shrink-0">
                             <div className="bg-black/40 border border-slate-800 px-2 py-1 rounded-lg flex flex-col items-center min-w-[40px]">
                                <span className="text-[6px] font-mono text-slate-500">SPENT</span>
                                <span className="text-[10px] font-black text-white">{log.apSpent} AP</span>
                             </div>
                             {isAttack && (
                               <div className="bg-red-500/20 border border-red-500/40 px-3 py-1 rounded-lg flex flex-col items-center">
                                  <span className="text-[6px] font-mono text-red-400">IMPACT</span>
                                  <span className="text-[10px] font-black text-red-400">{log.damage} HP</span>
                               </div>
                             )}
                          </div>
                       </div>
                   </div>

                   {/* Defense Visualization Overlay */}
                   {isBlock && log.defenseTier && (
                     <DefenseDisplay 
                        defenseTier={log.defenseTier} 
                        isCracked={log.isCracked} 
                        mitigationPercent={log.mitigationPercent}
                        shieldHealth={log.shield}
                     />
                   )}
                </div>
              );
            })}

            {!isDone && (
              <div className="p-8 border-2 border-dashed border-slate-900 rounded-3xl opacity-20 animate-pulse flex flex-col items-center">
                 <Cpu size={24} className="text-slate-700 mb-2" />
                 <span className="text-[8px] font-mono uppercase tracking-widest">Processing Data...</span>
              </div>
            )}
         </div>

         {isDone && (
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-slate-800 z-30 animate-in slide-in-from-bottom duration-500">
              <Button 
                variant="primary" size="lg" className="w-full max-w-4xl mx-auto py-5"
                onClick={nextTurn}
              >
                PROCEED TO CYCLE {round}
              </Button>
           </div>
         )}
      </div>
    </ScreenWrapper>
  );
};
