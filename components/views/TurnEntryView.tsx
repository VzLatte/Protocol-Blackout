
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Timer } from '../shared/Timer';
import { Button } from '../ui/Button';
import { Shield, Skull, ShieldAlert, ChevronDown, ChevronUp, Cpu, Lock } from 'lucide-react';
import { BASE_ATTACK_DMG, BASE_BLOCK_SHIELD } from '../../constants';
import { Phase, VisualLevel } from '../../types';

interface TurnEntryViewProps {
  game: any;
}

export const TurnEntryView: React.FC<TurnEntryViewProps> = ({ game }) => {
  const { playSfx, credits, currentCampaignLevel } = game;
  const p = game.players[game.currentPlayerIdx];
  const otherPlayers = game.players.filter((x: any) => x.id !== p.id && !x.isEliminated);
  const totalSpent = game.localBlockAp + game.localAttackAp;
  const remainingAp = p.ap - totalSpent;

  const isCriticalTime = game.timeLeft !== null && game.timeLeft <= 10;
  const isAI = p.isAI;
  const isCampaign = currentCampaignLevel !== null;

  return (
    <ScreenWrapper 
      visualLevel={game.visualLevel} 
      className={`transition-colors duration-500 ${isCriticalTime && game.visualLevel !== VisualLevel.LOW ? 'red-alert-pulse' : 'bg-[#020617]'}`}
      noScroll
      centerContent={false}
    >
      <GlobalHeader phase={Phase.TURN_ENTRY} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={credits} />
      {!isAI && !isCampaign && <Timer timeLeft={game.timeLeft} timeLimit={game.timeLimit} isCritical={isCriticalTime} />}

      <div className="flex-1 p-4 sm:p-6 flex flex-col max-w-4xl mx-auto w-full overflow-hidden animate-in fade-in duration-500 pb-28 pt-6">
         <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4 shrink-0 gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
               {isAI && <div className="p-2 sm:p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl text-amber-500 shrink-0"><Cpu size={20}/></div>}
               <div className="min-w-0 flex-1">
                  <div className="text-teal-500 font-mono text-[7px] sm:text-[8px] uppercase mb-1 tracking-widest opacity-60">
                    {isAI ? 'AI_LOGIC_UNIT' : 'OPERATIVE_ID'}
                  </div>
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase italic text-white tracking-tighter truncate leading-none">
                    {p.name}
                  </h2>
                  <span className="bg-teal-950/30 border border-teal-900 px-2 py-[1px] rounded-[4px] text-[6px] sm:text-[7px] text-teal-400 font-bold uppercase tracking-[0.2em] inline-block mt-1">{p.unit?.name}</span>
               </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
               <div className="text-slate-500 font-mono text-[7px] sm:text-[8px] uppercase mb-1 tracking-widest opacity-60">ENERGY MATRIX</div>
               <div className="text-xl sm:text-3xl font-black text-white flex items-center gap-1 sm:gap-2">
                  <span className={remainingAp === 0 ? 'text-red-500' : 'text-teal-400'}>{remainingAp}</span>
                  <span className="text-slate-700 text-[9px] sm:text-xs uppercase not-italic">/ {p.ap} AP</span>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-6 pr-1 relative pb-10">
            {isAI && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020617]/60 backdrop-blur-sm p-10 rounded-[2rem] text-center border-2 border-dashed border-amber-500/20">
                 <Lock className="text-amber-500 mb-4 opacity-50" size={48} />
                 <h3 className="text-amber-500 font-black italic uppercase text-xl">AI Thinking</h3>
                 <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">Round strategy decryption...</p>
              </div>
            )}

            {game.activeChaosEvent && (
               <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-2xl flex items-center gap-4 shrink-0 shadow-lg animate-pulse">
                  <ShieldAlert className="text-red-500 shrink-0" size={20}/>
                  <div className="flex-1 min-w-0">
                     <div className="text-[9px] sm:text-[10px] font-black text-red-400 uppercase tracking-widest truncate">SYSTEM_EVENT: {game.activeChaosEvent.name}</div>
                     <div className="text-[7px] sm:text-[8px] text-white opacity-60 uppercase tracking-tighter leading-snug">{game.activeChaosEvent.description}</div>
                  </div>
               </div>
            )}

            {/* Defense Allocation */}
            <div className={`bg-slate-900/30 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] relative group shadow-inner ${isAI ? 'opacity-40 grayscale' : ''}`}>
               <div className="flex justify-between items-center mb-2 sm:mb-6">
                  <div>
                     <h3 className="text-xs sm:text-sm font-black uppercase italic text-white flex items-center gap-2">
                        <Shield size={16} className="text-teal-500" /> DEFENSE
                     </h3>
                     <p className="text-[7px] sm:text-[8px] text-slate-500 font-mono uppercase mt-1 tracking-widest">Negates: {game.localBlockAp * BASE_BLOCK_SHIELD} HP</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 bg-black/40 p-1.5 rounded-xl border border-slate-800 shrink-0">
                     <button onClick={() => { if (!isAI && game.localBlockAp > 0) game.setLocalBlockAp(game.localBlockAp - 1); playSfx('beep'); }} className="p-1.5 sm:p-2 bg-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-700 transition-colors" disabled={isAI || game.localBlockAp === 0}><ChevronDown size={16} /></button>
                     <span className="font-black text-xl sm:text-2xl min-w-[2ch] text-center italic text-teal-400">{game.localBlockAp}</span>
                     <button onClick={() => { if (!isAI && totalSpent < p.ap) game.setLocalBlockAp(game.localBlockAp + 1); playSfx('confirm'); }} className="p-1.5 sm:p-2 bg-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-700 transition-colors" disabled={isAI || totalSpent >= p.ap}><ChevronUp size={16} /></button>
                  </div>
               </div>
            </div>

            {/* Offense Allocation */}
            <div className={`bg-slate-900/30 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] relative group shadow-inner ${isAI ? 'opacity-40 grayscale' : ''}`}>
               <div className="flex justify-between items-center mb-2 sm:mb-6">
                  <div>
                     <h3 className="text-xs sm:text-sm font-black uppercase italic text-white flex items-center gap-2">
                        <Skull size={16} className="text-red-500" /> OFFENSE
                     </h3>
                     <p className="text-[7px] sm:text-[8px] text-slate-500 font-mono uppercase mt-1 tracking-widest">Yield: {game.localAttackAp * BASE_ATTACK_DMG} DMG</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 bg-black/40 p-1.5 rounded-xl border border-slate-800 shrink-0">
                     <button onClick={() => { if (!isAI && game.localAttackAp > 0) game.setLocalAttackAp(game.localAttackAp - 1); playSfx('beep'); }} className="p-1.5 sm:p-2 bg-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-700 transition-colors" disabled={isAI || game.localAttackAp === 0}><ChevronDown size={16} /></button>
                     <span className="font-black text-xl sm:text-2xl min-w-[2ch] text-center italic text-red-500">{game.localAttackAp}</span>
                     <button onClick={() => { if (!isAI && totalSpent < p.ap) game.setLocalAttackAp(game.localAttackAp + 1); playSfx('confirm'); }} className="p-1.5 sm:p-2 bg-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-700 transition-colors" disabled={isAI || totalSpent >= p.ap}><ChevronUp size={16} /></button>
                  </div>
               </div>

               {game.localAttackAp > 0 && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                     <div className="text-[7px] sm:text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-3 text-center italic opacity-60">Designate Target</div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {otherPlayers.map((t: any) => (
                           <button key={t.id} onClick={() => { if (!isAI) game.setLocalTargetId(t.id); playSfx('confirm'); }} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left flex justify-between items-center transition-all ${game.localTargetId === t.id ? 'bg-red-500/15 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-[0.98]' : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'}`} disabled={isAI}>
                              <div className="text-[9px] sm:text-[10px] font-black italic uppercase text-white truncate min-w-0 flex-1">{t.name}</div>
                              <div className="text-right shrink-0">
                                 <div className="text-[10px] sm:text-[11px] font-black font-mono text-slate-300 ml-2">{game.fogOfWarActive === 0 ? `${t.hp} HP` : 'REDACTED'}</div>
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         </div>

         <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-slate-800 z-30 shadow-2xl">
            <div className="flex items-center gap-3 w-full max-w-4xl mx-auto">
               {!isAI && !isCampaign && game.timeLimit > 0 && (
                  <div className="bg-slate-900 border border-slate-800 px-3 sm:px-5 py-2 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center shrink-0 min-w-[50px] sm:min-w-[70px]">
                     <div className="text-[6px] sm:text-[7px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">TIME</div>
                     <span className={`text-sm sm:text-lg font-black font-mono leading-none ${isCriticalTime ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {game.timeLeft ?? '--'}
                     </span>
                  </div>
               )}
               <Button 
                 variant={totalSpent === 0 ? 'amber' : 'primary'} size="lg" className="flex-1 py-4 sm:py-5 text-sm sm:text-base h-full"
                 onClick={() => !isAI && game.submitAction({ blockAp: game.localBlockAp, attackAp: game.localAttackAp, targetId: game.localTargetId })}
                 disabled={isAI || (game.localAttackAp > 0 && !game.localTargetId)}
               >
                  {isAI ? 'SYSTEM CALCULATING...' : game.localAttackAp > 0 && !game.localTargetId ? 'SELECT TARGET' : totalSpent === 0 ? `RESERVE` : `LOCK_PROTOCOL`}
               </Button>
            </div>
         </div>
      </div>
    </ScreenWrapper>
  );
};
