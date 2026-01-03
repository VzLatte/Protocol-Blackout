import React, { useState, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Skull, Shield, Zap, Activity, Target, Lock } from 'lucide-react';
import { ActionType, Phase } from '../../types';

interface ResolutionViewProps {
  game: any;
}

export const ResolutionView: React.FC<ResolutionViewProps> = ({ game }) => {
  const { resolutionLogs, round, nextTurn, scrollRef, visualLevel, credits } = game;
  const [visibleCount, setVisibleCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Decryption sequence logic
  useEffect(() => {
    if (visibleCount < resolutionLogs.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
        game.playSfx('beep');
      }, 800); // Slightly faster for better UX
      return () => clearTimeout(timer);
    } else if (resolutionLogs.length > 0) {
      setIsDone(true);
    } else {
      setIsDone(true); // Handle empty log state
    }
  }, [visibleCount, resolutionLogs, game]);

  // Auto-scroll to latest decrypted log
  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, scrollRef]);

  const getPlayerName = (id?: string) => game.players.find((p: any) => p.id === id)?.name || "Unknown";

  return (
    <ScreenWrapper visualLevel={visualLevel} noScroll centerContent={false}>
      <GlobalHeader 
        phase={Phase.RESOLUTION} 
        onHelp={() => game.setIsHelpOpen(true)} 
        onSettings={() => game.setIsSettingsOpen(true)} 
        onExit={() => game.setIsExitConfirming(true)} 
        credits={credits} 
      />
      
      <div className="flex-1 p-6 flex flex-col items-center max-w-4xl mx-auto w-full overflow-hidden animate-in fade-in duration-500 pb-28 pt-10">
         <div className="text-center mb-8 shrink-0">
            <div className="text-teal-500 font-mono text-[9px] uppercase tracking-[0.6em] mb-2 italic opacity-60 underline underline-offset-4">ESTABLISHMENT_LOG_v2.5</div>
            <h2 className="text-4xl font-black uppercase text-white italic tracking-tighter">ROUND_{round - 1}</h2>
         </div>
         
         <div ref={scrollRef} className="flex-1 w-full space-y-6 mb-6 overflow-y-auto pr-2 custom-scrollbar">
            {/* FIX: Properly contained map within the parent div */}
            {resolutionLogs.slice(0, visibleCount).map((log: any, i: number) => {
              const attacker = getPlayerName(log.attackerId);
              const isElim = log.isElimination;

              return (
                <div 
                  key={i} 
                  className={`bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-bottom duration-500 relative overflow-hidden group shadow-xl transition-all
                    ${log.damage && log.damage > 0 ? 'damage-shake border-red-900/50' : ''} 
                    ${isElim ? 'ring-4 ring-red-500 border-red-500 bg-red-950/40 scale-[1.05] shadow-[0_0_50px_rgba(239,68,68,0.5)] z-20' : ''}`} 
                >
                   {isElim && (
                     <div className="absolute top-0 right-0 bg-red-500 text-white font-black text-[10px] px-6 py-1 italic uppercase tracking-widest -rotate-45 translate-x-4 translate-y-2">
                       Neutralized
                     </div>
                   )}

                   <div className={`h-16 w-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg border transition-transform 
                      ${isElim ? 'bg-red-500 text-white animate-pulse' : 
                        log.type === ActionType.ATTACK ? 'bg-red-500/20 text-red-500 border-red-500/20' : 
                        log.type === ActionType.BLOCK || log.type === ActionType.PHASE ? 'bg-teal-500/20 text-teal-400 border-teal-500/20' : 
                        'bg-amber-500/10 text-amber-500 border-amber-500/10'}`}>
                      {isElim ? <Target size={32} /> : 
                       log.type === ActionType.ATTACK ? <Skull size={32} /> : 
                       log.type === ActionType.BLOCK || log.type === ActionType.PHASE ? <Shield size={32} /> : 
                       <Zap size={32} />}
                   </div>

                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className={`font-black text-[14px] uppercase tracking-tighter ${isElim ? 'text-red-400 italic' : 'text-slate-200'}`}>
                           {isElim ? 'CRITICAL_ELIMINATION' : log.type}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest italic">
                           Operative: {attacker}
                        </div>
                      </div>
                      <div className={`font-mono text-[11px] uppercase leading-relaxed tracking-tight ${isElim ? 'text-white font-bold' : 'text-slate-400'}`}>
                         {log.resultMessage}
                      </div>
                      
                      {log.type === ActionType.ATTACK && (log.damage !== undefined) && (
                         <div className="mt-4 flex gap-6 items-center border-t border-slate-800/50 pt-4">
                            <div className="flex flex-col">
                               <span className="text-[8px] text-slate-600 uppercase font-black">Threat Level</span>
                               <span className="text-sm font-black text-slate-400">{log.damage + (log.blocked || 0)}</span>
                            </div>
                            <div className="text-slate-700">|</div>
                            <div className="flex flex-col">
                               <span className="text-[8px] text-teal-600 uppercase font-black">Mitigation</span>
                               <span className="text-sm font-black text-teal-500">-{log.blocked || 0}</span>
                            </div>
                            <div className="text-slate-700">|</div>
                            <div className={`flex flex-col ${isElim ? 'animate-bounce' : ''}`}>
                               <span className="text-[8px] text-red-600 uppercase font-black">Net Impact</span>
                               <span className="text-lg font-black text-red-500">{log.damage} HP</span>
                            </div>
                         </div>
                      )}

                      {log.reflected !== undefined && (
                        <div className="mt-2 flex gap-4 items-center border-t border-slate-800/50 pt-2 bg-red-500/5 p-2 rounded-lg">
                          <div className="flex flex-col">
                             <span className="text-[7px] text-red-600 uppercase font-bold">Feedback Backlash</span>
                             <span className="text-xs font-black text-red-400">-{log.reflected} DMG REBOUND</span>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              );
            })}

            {/* Decrypting State UI */}
            {!isDone && resolutionLogs.length > visibleCount && (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-900 rounded-[3rem] opacity-30 animate-pulse">
                 <Lock size={32} className="text-slate-800 mb-2" />
                 <div className="text-[8px] font-mono uppercase tracking-[0.5em]">Decrypting Next Entry...</div>
              </div>
            )}

            {/* Empty State UI */}
            {resolutionLogs.length === 0 && (
              <div className="flex flex-col items-center justify-center p-20 text-slate-700 border-2 border-dashed border-slate-900 rounded-[3rem] opacity-50">
                 <Activity size={40} className="mb-4" />
                 <p className="font-mono text-[9px] uppercase tracking-[0.5em] italic text-center">Stable operational round.</p>
              </div>
            )}
         </div>

         {/* Finalize Cycle Button */}
         {isDone && (
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-slate-800 z-30 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <Button 
                variant="primary" size="lg" className="w-full max-w-4xl mx-auto py-6 text-xl"
                onClick={() => { game.playSfx('success'); nextTurn(); }}
              >
                PROCEED TO ROUND_{round}
              </Button>
           </div>
         )}
      </div>
    </ScreenWrapper>
  );
};