import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Shield, Skull, ChevronDown, ChevronUp, Cpu, Brain, Zap, Move, Flame, Droplet, ZapOff, Loader2, Heart, Activity, Target } from 'lucide-react';
import { BASE_ATTACK_DMG, ACTION_COSTS, DEFENSE_CONFIG, RANGE_NAMES } from '../../constants';
import { Phase, VisualLevel, ActionType, UnitType, MoveIntent } from '../../types';

interface TurnEntryViewProps {
  game: any;
}

export const TurnEntryView: React.FC<TurnEntryViewProps> = ({ game }) => {
  const { playSfx, credits, round, maxRounds, distanceMatrix } = game;
  const p = game.players[game.currentPlayerIdx];
  const otherPlayers = game.players.filter((x: any) => x.id !== p.id && !x.isEliminated);
  
  const moveCost = ACTION_COSTS[ActionType.MOVE] + (p.fatigue || 0);
  const totalSpent = (game.localBlockAp * ACTION_COSTS[ActionType.BLOCK]) + 
                     (game.localAttackAp * ACTION_COSTS[ActionType.ATTACK]) +
                     (game.localMoveAp * moveCost);

  const remainingAp = p.ap - totalSpent;
  const isCriticalTime = game.timeLeft !== null && game.timeLeft <= 10;
  const isBlackoutPhase = round >= 5;

  // --- Logic Helpers ---
  const getRangeData = (tid: string) => {
    const key = [p.id, tid].sort().join('-');
    const val = distanceMatrix.get(key) ?? 1;
    return { name: RANGE_NAMES[val], val };
  };

  const getDmgMultiplier = (rangeVal: number) => {
    if (rangeVal === 0) return 1.2;
    if (rangeVal === 2) return (0.75 + (p.unit?.focus || 0) / 100);
    return 1.0;
  };

  const calculateProjectedDmg = (target: any) => {
    const { val: rangeVal } = getRangeData(target.id);
    const rangeMult = getDmgMultiplier(rangeVal);
    let bonus = 1.0;
    
    if (p.unit?.type === UnitType.KILLSHOT) bonus *= 1.1;
    // Fix: Account for local ability arming during turn entry
    const isCurrentlyMarking = p.unit?.type === UnitType.HUNTER && game.localAbilityActive && game.localTargetId === target.id;
    if (p.targetLockId === target.id || isCurrentlyMarking) bonus *= 1.3;
    
    return Math.floor(BASE_ATTACK_DMG * game.localAttackAp * rangeMult * bonus);
  };

  // --- AI Thinking State ---
  if (p.isAI) {
    return (
      <ScreenWrapper visualLevel={game.visualLevel} centerContent={true} className="bg-black">
         <div className="z-10 flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-500 w-full px-6 text-center">
            <div className="relative bg-[#0a0f1e] border border-amber-500/40 p-12 rounded-[4rem] shadow-2xl flex flex-col items-center gap-8 w-full max-w-sm">
                <Brain size={80} className="text-amber-500 animate-pulse" />
                <h2 className="text-3xl font-black italic text-white uppercase glitch-text">{p.name}</h2>
                <div className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.4em]">CALCULATING_OPTIMAL_STRIKE</div>
            </div>
         </div>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper 
      visualLevel={game.visualLevel} 
      className={`transition-colors duration-500 ${isCriticalTime ? 'red-alert-pulse' : 'bg-[#020617]'}`}
      noScroll centerContent={false}
    >
      <GlobalHeader phase={Phase.TURN_ENTRY} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={credits} />
      
      <div className="flex-1 p-4 sm:p-6 flex flex-col max-w-4xl mx-auto w-full overflow-hidden pb-36 pt-6">
         
         {/* Top Stats: HP & AP Matrix */}
         <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
            {/* HP Module */}
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-2xl flex items-center gap-4">
               <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                  <Heart size={20} className={p.hp < 300 ? 'animate-ping' : ''} />
               </div>
               <div>
                  <div className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Integrity</div>
                  <div className="flex items-baseline gap-1">
                     <span className="text-xl font-black text-white italic">{p.hp}</span>
                     <span className="text-[9px] text-slate-600 font-mono">/ {p.maxHp}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                     <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${(p.hp / p.maxHp) * 100}%` }} />
                  </div>
               </div>
            </div>

            {/* AP Module */}
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-2xl flex items-center gap-4">
               <div className="h-10 w-10 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
                  <Zap size={20} />
               </div>
               <div className="flex-1">
                  <div className="text-[7px] font-mono text-slate-500 uppercase tracking-widest text-right">Energy</div>
                  <div className="flex items-baseline justify-end gap-1">
                     <span className={`text-xl font-black italic transition-colors ${remainingAp === 0 ? 'text-amber-500' : 'text-teal-400'}`}>{remainingAp}</span>
                     <span className="text-[9px] text-slate-600 font-mono">/ {p.ap}</span>
                  </div>
                  {remainingAp > 0 && (
                    <div className="text-[6px] font-mono text-amber-500 text-right uppercase mt-1 animate-pulse">+{remainingAp} AP TO RESERVE</div>
                  )}
               </div>
            </div>
         </div>

         {/* Selection Scroll Area */}
         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-10">
            
            {/* ABILITY */}
            <div className={`p-4 rounded-[1.5rem] border transition-all ${game.localAbilityActive ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-slate-900/30 border-slate-800'}`}>
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                     <div className={`p-2 rounded-lg border ${game.localAbilityActive ? 'border-amber-500 text-amber-500' : 'border-slate-700 text-slate-500'}`}>
                        <Activity size={18} />
                     </div>
                     <div className="min-w-0">
                        <h3 className="text-xs font-black uppercase italic text-white truncate">{p.unit?.passiveDesc}</h3>
                        <p className="text-[8px] text-slate-500 font-mono uppercase truncate">{p.unit?.activeDesc}</p>
                     </div>
                  </div>
                  <Button 
                    variant={game.localAbilityActive ? 'amber' : 'secondary'} size="sm" 
                    onClick={() => { if(!p.activeUsed) game.setLocalAbilityActive(!game.localAbilityActive); playSfx('confirm'); }}
                    disabled={p.activeUsed || p.cooldown > 0}
                  >
                    {p.activeUsed ? 'EMPTY' : p.cooldown > 0 ? `CD: ${p.cooldown}` : 'ARM'}
                  </Button>
               </div>
            </div>

            {/* DEFENSE */}
            <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-[1.5rem]">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase italic text-white flex items-center gap-2"><Shield size={16} className="text-teal-500" /> DEFENSE (1 AP)</h3>
                  <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-slate-800">
                     <button onClick={() => game.setLocalBlockAp(Math.max(0, game.localBlockAp - 1))} className="p-1 disabled:opacity-20" disabled={game.localBlockAp === 0}><ChevronDown size={18} /></button>
                     <span className="font-black text-lg text-teal-400 w-4 text-center">{game.localBlockAp}</span>
                     <button 
                        onClick={() => game.setLocalBlockAp(game.localBlockAp + 1)} 
                        className="p-1 disabled:opacity-20" 
                        disabled={remainingAp < 1 || game.localBlockAp >= 3 || (game.localBlockAp === 2 && !isBlackoutPhase)}
                     ><ChevronUp size={18} /></button>
                  </div>
               </div>
               {game.localBlockAp > 0 && <div className="text-[8px] font-mono text-teal-500 uppercase italic">Active Mit: {(DEFENSE_CONFIG as any)[game.localBlockAp].mitigation * 100}% // Cap: {(DEFENSE_CONFIG as any)[game.localBlockAp].threshold} DMG</div>}
            </div>

            {/* MANEUVER */}
            <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-[1.5rem]">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-black uppercase italic text-white flex items-center gap-2"><Move size={16} className="text-amber-500" /> MANEUVER ({moveCost} AP)</h3>
                  <Button variant={game.localMoveAp > 0 ? 'amber' : 'secondary'} size="sm" onClick={() => game.setLocalMoveAp(game.localMoveAp > 0 ? 0 : 1)} disabled={remainingAp < moveCost && game.localMoveAp === 0}>{game.localMoveAp > 0 ? 'ACTIVE' : 'READY'}</Button>
               </div>
               {game.localMoveAp > 0 && (
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                     <div className="grid grid-cols-2 gap-2">
                        {Object.values(MoveIntent).map(intent => (
                           <button key={intent} onClick={() => game.setLocalMoveIntent(intent)} className={`p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${game.localMoveIntent === intent ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                              {intent === MoveIntent.CLOSE ? 'Close Distance' : 'Open Distance'}
                           </button>
                        ))}
                     </div>
                     <div className="grid grid-cols-1 gap-2">
                        {otherPlayers.map((t: any) => (
                           <button key={t.id} onClick={() => game.setLocalTargetId(t.id)} className={`p-3 rounded-xl border flex justify-between items-center transition-all ${game.localTargetId === t.id && game.localMoveAp > 0 ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                              <span className="text-[10px] font-black uppercase">{t.name}</span>
                              <span className="text-[8px] font-mono opacity-60">RANGE: {getRangeData(t.id).name}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            {/* OFFENSE */}
            <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-[1.5rem]">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase italic text-white flex items-center gap-2"><Skull size={16} className="text-red-500" /> OFFENSE (2 AP)</h3>
                  <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-slate-800">
                     <button onClick={() => game.setLocalAttackAp(Math.max(0, game.localAttackAp - 1))} className="p-1 disabled:opacity-20" disabled={game.localAttackAp === 0}><ChevronDown size={18} /></button>
                     <span className="font-black text-lg text-red-500 w-4 text-center">{game.localAttackAp}</span>
                     <button onClick={() => game.setLocalAttackAp(game.localAttackAp + 1)} className="p-1 disabled:opacity-20" disabled={remainingAp < 2}><ChevronUp size={18} /></button>
                  </div>
               </div>
               {game.localAttackAp > 0 && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                     {otherPlayers.map((t: any) => {
                        const isSelected = game.localTargetId === t.id;
                        const projected = calculateProjectedDmg(t);
                        return (
                           <button key={t.id} onClick={() => game.setLocalTargetId(t.id)} className={`w-full p-4 rounded-xl border flex justify-between items-center transition-all ${isSelected ? 'bg-red-500/20 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
                              <div className="text-left">
                                 <div className={`text-[11px] font-black uppercase ${isSelected ? 'text-red-400' : 'text-white'}`}>{t.name}</div>
                                 <div className="text-[8px] font-mono text-slate-500">PROJECTED: {projected} DMG</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-[12px] font-black text-red-500 font-mono">{t.hp} HP</div>
                                 <div className="text-[7px] font-mono text-slate-600 uppercase">Integrity</div>
                              </div>
                           </button>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>

         {/* Execution Action Button */}
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-slate-800 z-40">
            <Button 
               variant={totalSpent === 0 ? 'amber' : 'primary'} size="lg" className="w-full py-5 text-lg font-black italic tracking-widest shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
               onClick={() => game.submitAction({ 
                  blockAp: game.localBlockAp, 
                  attackAp: game.localAttackAp, 
                  moveAp: game.localMoveAp,
                  abilityActive: game.localAbilityActive,
                  targetId: game.localTargetId,
                  moveIntent: game.localMoveIntent
               })}
               disabled={(game.localAttackAp > 0 || game.localMoveAp > 0) && !game.localTargetId}
            >
               {totalSpent === 0 ? 'COMMAND_RESERVE' : 'EXECUTE_TACTICAL_DATA'}
            </Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};