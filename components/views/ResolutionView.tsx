
import React, { useState, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Skull, Shield, Zap, Activity, Target, Lock, AlertTriangle } from 'lucide-react';
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
      }, 800); 
      return () => clearTimeout(timer);
    } else if (resolutionLogs.length > 0) {
      setIsDone(true);
    } else {
      setIsDone(true); 
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
      
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center max-w-4xl mx-auto w-full overflow-hidden animate-in fade-in duration-500 pb-28 pt-10">
         <div className="text-center mb-6 sm:mb-8 shrink-0">
            <div className="text-teal-500 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.4em] sm:tracking-[0.6em] mb-2 italic opacity-60 underline underline-offset-4">SIMULTANEOUS_RESOLUTION_v3.0</div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white italic tracking-tighter">CYCLE_{round - 1}</h2>
         </div>
         
         <div ref={scrollRef} className="flex-1 w-full space-y-4 sm:space-y-6 mb-6 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
            {resolutionLogs.slice(0, visibleCount).map((log: any, i: number) => {
              const attacker = getPlayerName(log.attackerId);
              const isElim = log.isElimination;
              const isSuddenDeath = log.resultMessage.includes("SUDDEN DEATH");

              return (
                <div 
                  key={i} 
                  className={`bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center gap-4 sm:gap-6 animate-in slide-in-from-bottom duration-500 relative overflow-hidden group shadow-xl transition-all
                    ${log.damage && log.damage > 0 ? 'damage-shake border-red-900/50' : ''} 
                    ${isElim ? 'ring-4 ring-red-500 border-red-500 bg-red-950/40 scale-[1.02] sm:scale-[1.05] shadow-[0_0_50px_rgba(239,68,68,0.5)] z-20' : ''}
                    ${isSuddenDeath ? 'bg-amber-950/40 border-amber-500 ring-4 ring-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.5)]' : ''}`} 
                >
                   {isElim && (
                     <div className="absolute top-0 right-0 bg-red-500 text-white font-black text-[8px] sm:text-[10px] px-4 sm:px-6 py-1 italic uppercase tracking-widest -rotate-45 translate-x-4 translate-y-2">
                       Neutralized
                     </div>
                   )}
                   {isSuddenDeath && (
                     <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[8px] sm:text-[10px] px-4 sm:px-6 py-1 italic uppercase tracking-widest -rotate-45 translate-x-4 translate-y-2">
                       Critical Reset
                     </div>
                   )}

                   <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0 shadow-lg border transition-transform 
                      ${isElim ? 'bg-red-500 text-white animate-pulse' : 
                        isSuddenDeath ? 'bg-amber-500 text-black animate-bounce' :
                        log.type === ActionType.ATTACK ? 'bg-red-500/20 text-red-500 border-red-500/20' : 
                        log.type === ActionType.BLOCK || log.type === ActionType.PHASE ? 'bg-teal-500/20 text-teal-400 border-teal-500/20' : 
                        'bg-amber-500/10 text-amber-500 border-amber-500/10'}`}>
                      {isElim ? <Target size={24} className="sm:size-32" /> : 
                       isSuddenDeath ? <AlertTriangle size={24} className="sm:size-32" /> :
                       log.type === ActionType.ATTACK ? <Skull size={24} className="sm:size-32" /> : 
                       log.type === ActionType.BLOCK || log.type === ActionType.PHASE ? <Shield size={24} className="sm:size-32" /> : 
                       <Zap size={24} className="sm:size-32" />}
                   </div>

                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 sm:mb-2 gap-2">
                        <div className={`font-black text-[12px] sm:text-[14px] uppercase tracking-tighter truncate ${isElim ? 'text-red-400 italic' : isSuddenDeath ? 'text-amber-400' : 'text-slate-200'}`}>
                           {isSuddenDeath ? 'OVERTIME_PROTOCOL' : isElim ? 'ELIMINATION' : log.type}
                        </div>
                        <div className="text-[8px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest italic truncate max-w-[80px] sm:max-w-none">
                           {isSuddenDeath ? 'SYS_ADMIN' : attacker}
                        </div>
                      </div>
                      <div className={`font-mono text-[9px] sm:text-[11px] uppercase leading-relaxed tracking-tight break-words ${isElim || isSuddenDeath ? 'text-white font-bold' : 'text-slate-400'}`}>
                         {log.resultMessage}
                      </div>
                      
                      {log.type === ActionType.ATTACK && (log.damage !== undefined) && (
                         <div className="mt-3 sm:mt-4 flex flex-wrap gap-x-4 sm:gap-6 gap-y-2 items-center border-t border-slate-800/50 pt-3 sm:pt-4">
                            <div className="flex flex-col">
                               <span className="text-[7px] sm:text-[8px] text-slate-600 uppercase font-black">Threat</span>
                               <span className="text-xs sm:text-sm font-black text-slate-400">{log.damage + (log.blocked || 0)}</span>
                            </div>
                            <div className="hidden sm:block text-slate-700">|</div>
                            <div className="flex flex-col">
                               <span className="text-[7px] sm:text-[8px] text-teal-600 uppercase font-black">Mitigated</span>
                               <span className="text-xs sm:text-sm font-black text-teal-500">-{log.blocked || 0}</span>
                            </div>
                            <div className="hidden sm:block text-slate-700">|</div>
                            <div className={`flex flex-col ${isElim ? 'animate-bounce' : ''}`}>
                               <span className="text-[7px] sm:text-[8px] text-red-600 uppercase font-black">Impact</span>
                               <span className="text-base sm:text-lg font-black text-red-500">{log.damage} HP</span>
                            </div>
                         </div>
                      )}

                      {log.reflected !== undefined && (
                        <div className="mt-2 flex gap-4 items-center border-t border-slate-800/50 pt-2 bg-red-500/5 p-2 rounded-lg">
                          <div className="flex flex-col">
                             <span className="text-[7px] text-red-600 uppercase font-bold">Backlash</span>
                             <span className="text-[10px] sm:text-xs font-black text-red-400">-{log.reflected} DMG REBOUND</span>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              );
            })}

            {/* Decrypting State UI */}
            {!isDone && resolutionLogs.length > visibleCount && (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-slate-900 rounded-[2rem] sm:rounded-[3rem] opacity-30 animate-pulse">
                 <Lock size={24} className="text-slate-800 mb-2 sm:size-32" />
                 <div className="text-[7px] sm:text-[8px] font-mono uppercase tracking-[0.4em] sm:tracking-[0.5em]">Syncing Matrix...</div>
              </div>
            )}
         </div>

         {/* Finalize Cycle Button */}
         {isDone && (
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-slate-800 z-30 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <Button 
                variant="primary" size="lg" className="w-full max-w-4xl mx-auto py-5 sm:py-6 text-lg sm:text-xl"
                onClick={() => { game.playSfx('success'); nextTurn(); }}
              >
                PROCEED TO CYCLE_{round}
              </Button>
           </div>
         )}
      </div>
    </ScreenWrapper>
  );
};
