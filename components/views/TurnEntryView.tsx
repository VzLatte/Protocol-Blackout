
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Timer } from '../shared/Timer';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Shield, Skull, ShieldAlert, ChevronDown, ChevronUp, Cpu, Lock, Activity, Zap, Info, AlertTriangle, Move, Crosshair, Brain, Flame, Droplet, ZapOff, Target as TargetIcon } from 'lucide-react';
import { BASE_ATTACK_DMG, ACTION_COSTS, DEFENSE_CONFIG, RANGE_NAMES } from '../../constants';
import { Phase, VisualLevel, ActionType, UnitType, MoveIntent } from '../../types';

interface TurnEntryViewProps {
  game: any;
}

export const TurnEntryView: React.FC<TurnEntryViewProps> = ({ game }) => {
  const { playSfx, credits, currentCampaignLevel, tutorial, setTutorial, activeChaosEvent, round, maxRounds, distanceMatrix } = game;
  const p = game.players[game.currentPlayerIdx];
  const otherPlayers = game.players.filter((x: any) => x.id !== p.id && !x.isEliminated);
  
  const moveCost = ACTION_COSTS[ActionType.MOVE] + (p.fatigue || 0);
  const totalSpent = (game.localBlockAp * ACTION_COSTS[ActionType.BLOCK]) + 
                     (game.localAttackAp * ACTION_COSTS[ActionType.ATTACK]) +
                     (game.localMoveAp * moveCost);

  const remainingAp = p.ap - totalSpent;
  const isCriticalTime = game.timeLeft !== null && game.timeLeft <= 10;
  const isAI = p.isAI;
  const isBlackoutPhase = round >= 5;

  const getStatusIcons = (player: any) => {
    return player.statuses.map((s: any, i: number) => {
       if (s.type === 'BURN') return <Flame key={i} size={12} className="text-orange-500 animate-pulse" />;
       if (s.type === 'POISON') return <Droplet key={i} size={12} className="text-green-500 animate-pulse" />;
       if (s.type === 'PARALYZE') return <ZapOff key={i} size={12} className="text-yellow-500 animate-pulse" />;
       return null;
    });
  };

  const getRangeToTarget = (tid: string) => {
    const key = [p.id, tid].sort().join('-');
    const val = distanceMatrix.get(key) ?? 1;
    // @ts-ignore
    return { name: RANGE_NAMES[val], val };
  };

  const getDmgMultiplier = (rangeVal: number) => {
    if (rangeVal === 0) return 1.2;
    if (rangeVal === 2) return (0.75 + (p.unit?.focus || 0) / 100);
    return 1.0;
  };

  const getDefenseDetails = (tier: number) => {
    if (tier === 0) return { mitigation: "0%", threshold: "0" };
    // @ts-ignore
    const cfg = DEFENSE_CONFIG[tier];
    return { 
      mitigation: `${Math.round(cfg.mitigation * 100)}%`, 
      threshold: cfg.threshold,
      desc: cfg.name
    };
  };

  const currentDef = getDefenseDetails(game.localBlockAp);

  return (
    <ScreenWrapper 
      visualLevel={game.visualLevel} 
      className={`transition-colors duration-500 ${isCriticalTime && game.visualLevel !== VisualLevel.LOW ? 'red-alert-pulse' : 'bg-[#020617]'}`}
      noScroll
      centerContent={false}
    >
      <GlobalHeader phase={Phase.TURN_ENTRY} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={credits} />
      
      <div className="flex-1 p-4 sm:p-6 flex flex-col max-w-4xl mx-auto w-full overflow-hidden animate-in fade-in duration-500 pb-36 pt-6">
         
         <div className="flex justify-between items-center mb-2 px-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.2em]">Round {round} / {maxRounds}</div>
            <div className="flex gap-2">{getStatusIcons(p)}</div>
         </div>

         {/* Status Bar */}
         <div className="flex flex-col gap-4 mb-6 border-b border-slate-800 pb-6 shrink-0">
            <div className="flex justify-between items-end gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                 <div className="min-w-0 flex-1">
                    <div className="text-teal-500 font-mono text-[7px] sm:text-[8px] uppercase mb-1 tracking-widest opacity-60">OPERATIVE_ID</div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase italic text-white tracking-tighter truncate leading-none glitch-text">{p.name}</h2>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-teal-950/30 border border-teal-900 px-2 py-[1px] rounded-[4px] text-[6px] sm:text-[7px] text-teal-400 font-bold uppercase tracking-[0.2em] inline-block">{p.unit?.name}</span>
                      <span className="bg-amber-950/30 border border-amber-900 px-2 py-[1px] rounded-[4px] text-[6px] sm:text-[7px] text-amber-400 font-bold uppercase tracking-[0.2em] inline-block">INITIATIVE: {p.unit?.speed}</span>
                    </div>
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
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-6 pr-1 relative pb-10">
            
            {/* ABILITY BUTTON */}
            <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all ${game.localAbilityActive ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-slate-900/30 border-slate-800'}`}>
               <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                     <h3 className="text-xs sm:text-sm font-black uppercase italic text-white flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" /> {p.unit?.passiveDesc}
                     </h3>
                     <p className="text-[8px] sm:text-[9px] text-slate-500 font-mono mt-1 uppercase leading-tight">{p.unit?.activeDesc}</p>
                  </div>
                  <Button 
                    variant={game.localAbilityActive ? 'amber' : 'secondary'} 
                    size="sm" 
                    onClick={() => { if(!p.activeUsed) game.setLocalAbilityActive(!game.localAbilityActive); playSfx('confirm'); }}
                    disabled={p.activeUsed || p.cooldown > 0}
                    className="shrink-0"
                  >
                    {p.activeUsed ? 'CONSUMED' : p.cooldown > 0 ? `CD: ${p.cooldown}` : game.localAbilityActive ? 'ARMED' : 'ACTIVATE'}
                  </Button>
               </div>
            </div>

            {/* Defense Allocation */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem]">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm font-black uppercase italic text-white flex items-center gap-2">
                       <Shield size={16} className="text-teal-500" /> DEFENSE (1 AP/Tier)
                    </h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-[8px] font-mono">
                        <span className={game.localBlockAp >= 1 ? 'text-teal-400 font-bold' : 'text-slate-600'}>T1: 30% / 200 Crack</span>
                      </div>
                      <div className="flex items-center gap-2 text-[8px] font-mono">
                        <span className={game.localBlockAp >= 2 ? 'text-teal-400 font-bold' : 'text-slate-600'}>T2: 55% / 400 Crack</span>
                      </div>
                      <div className="flex items-center gap-2 text-[8px] font-mono">
                        <span className={game.localBlockAp >= 3 ? 'text-teal-400 font-bold' : 'text-slate-600'}>T3: 75% / 600 Crack {isBlackoutPhase ? '(BLACKOUT ACTIVE)' : '(LOCKED)'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 bg-black/40 p-1.5 rounded-xl border border-slate-800">
                     <button onClick={() => { if (game.localBlockAp > 0) game.setLocalBlockAp(game.localBlockAp - 1); playSfx('beep'); }} className="p-1.5 bg-slate-800 rounded-lg disabled:opacity-20" disabled={game.localBlockAp === 0}><ChevronDown size={16} /></button>
                     <span className="font-black text-xl italic text-teal-400">{game.localBlockAp}</span>
                     <button 
                       onClick={() => { if (remainingAp >= 1 && game.localBlockAp < 3) game.setLocalBlockAp(game.localBlockAp + 1); playSfx('confirm'); }} 
                       className="p-1.5 bg-slate-800 rounded-lg disabled:opacity-20" 
                       disabled={remainingAp < 1 || game.localBlockAp >= 3 || (game.localBlockAp === 2 && !isBlackoutPhase)}
                     ><ChevronUp size={16} /></button>
                  </div>
               </div>
               {game.localBlockAp > 0 && (
                 <div className="mt-2 text-[10px] font-black italic uppercase text-teal-500/80 animate-in fade-in">
                   {currentDef.desc} ARMED // {currentDef.mitigation} Reduction // {currentDef.threshold} DMG Crack Limit
                 </div>
               )}
            </div>

            {/* Maneuver Allocation */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem]">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase italic text-white flex items-center gap-2">
                     <Move size={16} className="text-amber-500" /> MANEUVER ({moveCost} AP)
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-4 bg-black/40 p-1.5 rounded-xl border border-slate-800">
                     <button onClick={() => { if (game.localMoveAp > 0) game.setLocalMoveAp(0); playSfx('beep'); }} className="p-1.5 bg-slate-800 rounded-lg disabled:opacity-20" disabled={game.localMoveAp === 0}><ChevronDown size={16} /></button>
                     <span className="font-black text-xl italic text-amber-500">{game.localMoveAp}</span>
                     <button onClick={() => { if (remainingAp >= moveCost) game.setLocalMoveAp(1); playSfx('confirm'); }} className="p-1.5 bg-slate-800 rounded-lg disabled:opacity-20" disabled={remainingAp < moveCost || game.localMoveAp === 1}><ChevronUp size={16} /></button>
                  </div>
               </div>
               {game.localMoveAp > 0 && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                       <button onClick={() => game.setLocalMoveIntent(MoveIntent.CLOSE)} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${game.localMoveIntent === MoveIntent.CLOSE ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                          <span className="text-[10px] font-black uppercase">CLOSE DISTANCE</span>
                          <span className="text-[7px] font-mono">Approach Target</span>
                       </button>
                       <button onClick={() => game.setLocalMoveIntent(MoveIntent.OPEN)} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${game.localMoveIntent === MoveIntent.OPEN ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                          <span className="text-[10px] font-black uppercase">OPEN DISTANCE</span>
                          <span className="text-[7px] font-mono">Retreat from Target</span>
                       </button>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-3 text-center italic">Designate Movement Pivot</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {otherPlayers.map((t: any) => {
                          const { name: rangeName } = getRangeToTarget(t.id);
                          return (
                            <button key={t.id} onClick={() => { game.setLocalTargetId(t.id); playSfx('beep'); }} className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${game.localTargetId === t.id ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700'}`}>
                               <div className="flex-1 min-w-0">
                                  <div className="text-[10px] font-black uppercase text-white truncate">{t.name}</div>
                                  <div className="text-[7px] font-mono text-slate-500">Range: {rangeName}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-[10px] font-black text-slate-300">{t.hp} / {t.maxHp} HP</div>
                                  <div className="text-[7px] font-mono text-slate-600 uppercase">Integrity</div>
                               </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
               )}
            </div>

            {/* Offense Allocation */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem]">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase italic text-white flex items-center gap-2">
                     <Skull size={16} className="text-red-500" /> OFFENSE (2 AP)
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-4 bg-black/40 p-1.5 rounded-xl border border-slate-800">
                     <button onClick={() => { if (game.localAttackAp > 0) game.setLocalAttackAp(game.localAttackAp - 1); playSfx('beep'); }} className="p-1.5 bg-slate-800 rounded-lg disabled:opacity-20" disabled={game.localAttackAp === 0}><ChevronDown size={16} /></button>
                     <span className="font-black text-xl italic text-red-500">{game.localAttackAp}</span>
                     <button onClick={() => { if (remainingAp >= 2) game.setLocalAttackAp(game.localAttackAp + 1); playSfx('confirm'); }} className="p-1.5 bg-slate-800 rounded-lg disabled:opacity-20" disabled={remainingAp < 2}><ChevronUp size={16} /></button>
                  </div>
               </div>
               {(game.localAttackAp > 0 || (game.localAbilityActive && p.unit?.type !== UnitType.GHOST)) && (
                  <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
                     <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest text-center italic">Designate Attack Target</div>
                     <div className="grid grid-cols-1 gap-2">
                        {otherPlayers.map((t: any) => {
                           const { val: rangeVal } = getRangeToTarget(t.id);
                           const mult = getDmgMultiplier(rangeVal);
                           const multPercent = Math.round(mult * 100);
                           const projectedDmg = Math.floor(BASE_ATTACK_DMG * game.localAttackAp * mult * (p.unit?.type === UnitType.KILLSHOT ? 1.1 : 1.0));

                           return (
                             <button key={t.id} onClick={() => { game.setLocalTargetId(t.id); playSfx('confirm'); }} className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${game.localTargetId === t.id ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-slate-800 border-slate-700'}`}>
                                <div className="flex-1 min-w-0">
                                   <div className="text-[10px] font-black uppercase text-white truncate">{t.name}</div>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[8px] font-mono ${mult >= 1 ? 'text-teal-400' : 'text-red-400'}`}>Efficiency: {multPercent}%</span>
                                      {game.localAttackAp > 0 && <span className="text-[8px] font-mono text-white/40">Yield: ~{projectedDmg} HP</span>}
                                   </div>
                                </div>
                                <div className="text-right shrink-0">
                                   <div className="text-[12px] font-black text-red-500 font-mono tracking-tighter">{t.hp} <span className="text-[8px] text-slate-600">/ {t.maxHp}</span></div>
                                   <div className="text-[7px] font-mono text-slate-600 uppercase">Current Integrity</div>
                                </div>
                             </button>
                           );
                        })}
                     </div>
                  </div>
               )}
            </div>
         </div>

         <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-slate-800 z-30 shadow-2xl">
            <Button 
               variant={totalSpent === 0 ? 'amber' : 'primary'} size="lg" className="w-full py-5 text-lg"
               onClick={() => game.submitAction({ 
                  blockAp: game.localBlockAp, 
                  attackAp: game.localAttackAp, 
                  moveAp: game.localMoveAp,
                  abilityActive: game.localAbilityActive,
                  targetId: game.localTargetId,
                  moveIntent: game.localMoveIntent
               })}
               disabled={
                 (game.localAttackAp > 0 && !game.localTargetId) || 
                 (game.localMoveAp > 0 && (!game.localTargetId || !game.localMoveIntent)) ||
                 (game.localAbilityActive && (p.unit?.type === UnitType.PYRUS || p.unit?.type === UnitType.KILLSHOT || p.unit?.type === UnitType.HUNTER || p.unit?.type === UnitType.PYTHON) && !game.localTargetId)
               }
            >
               {totalSpent === 0 ? `RESERVE` : `LOCK_PROTOCOL`}
            </Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};
