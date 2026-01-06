
import React, { useState } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Shield, Skull, ChevronDown, ChevronUp, Brain, Zap, Move, Activity, Heart, Target } from 'lucide-react';
import { BASE_ATTACK_DMG, ACTION_COSTS, DEFENSE_CONFIG, RANGE_NAMES } from '../../constants';
import { Phase, ActionType, UnitType, MoveIntent } from '../../types';

interface TurnEntryViewProps {
  game: any;
}

export const TurnEntryView: React.FC<TurnEntryViewProps> = ({ game }) => {
  const { playSfx, credits, round, distanceMatrix, submitAction } = game;
  const p = game.players[game.currentPlayerIdx];
  const otherPlayers = game.players.filter((x: any) => x.id !== p.id && !x.isEliminated);
  
  // Refactored: Local drafting state
  const [localBlockAp, setLocalBlockAp] = useState(0);
  const [localAttackAp, setLocalAttackAp] = useState(0);
  const [localMoveAp, setLocalMoveAp] = useState(0);
  const [localAbilityActive, setLocalAbilityActive] = useState(false);
  const [localMoveIntent, setLocalMoveIntent] = useState<MoveIntent | undefined>(undefined);
  const [localTargetId, setLocalTargetId] = useState<string | undefined>(otherPlayers[0]?.id);

  const moveCost = ACTION_COSTS[ActionType.MOVE] + (p.fatigue || 0);
  const totalSpent = (localBlockAp * ACTION_COSTS[ActionType.BLOCK]) + 
                     (localAttackAp * ACTION_COSTS[ActionType.ATTACK]) +
                     (localMoveAp * moveCost);

  const remainingAp = p.ap - totalSpent;
  const isBlackoutPhase = round >= 5;

  const getRangeData = (tid: string) => {
    const key = [p.id, tid].sort().join('-');
    const val = distanceMatrix.get(key) ?? 1;
    return { name: RANGE_NAMES[val as keyof typeof RANGE_NAMES], val };
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
    const isCurrentlyMarking = p.unit?.type === UnitType.HUNTER && localAbilityActive && localTargetId === target.id;
    if (p.targetLockId === target.id || isCurrentlyMarking) bonus *= 1.3;
    return Math.floor(BASE_ATTACK_DMG * localAttackAp * rangeMult * bonus);
  };

  if (game.isAIThinking) {
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
    <ScreenWrapper visualLevel={game.visualLevel} className="bg-[#020617]" noScroll centerContent={false}>
      <GlobalHeader phase={Phase.TURN_ENTRY} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={credits} xp={game.xp} />
      
      <div className="flex-1 p-4 sm:p-6 flex flex-col max-w-4xl mx-auto w-full overflow-hidden pb-36 pt-6">
         <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-2xl flex items-center gap-4">
               <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500"><Heart size={20} /></div>
               <div>
                  <div className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">Integrity</div>
                  <div className="flex items-baseline gap-1">
                     <span className="text-xl font-black text-white italic">{p.hp}</span>
                     <span className="text-[9px] text-slate-600 font-mono">/ {p.maxHp}</span>
                  </div>
               </div>
            </div>
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-2xl flex items-center gap-4">
               <div className="h-10 w-10 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400"><Zap size={20} /></div>
               <div className="flex-1">
                  <div className="text-[7px] font-mono text-slate-500 uppercase tracking-widest text-right">Energy</div>
                  <div className="flex items-baseline justify-end gap-1">
                     <span className={`text-xl font-black italic ${remainingAp === 0 ? 'text-amber-500' : 'text-teal-400'}`}>{remainingAp}</span>
                     <span className="text-[9px] text-slate-600 font-mono">/ {p.ap}</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-10">
            {/* Ability */}
            <div className={`p-4 rounded-[1.5rem] border transition-all ${localAbilityActive ? 'bg-amber-500/10 border-amber-500' : 'bg-slate-900/30 border-slate-800'}`}>
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <Activity size={18} className={localAbilityActive ? 'text-amber-500' : 'text-slate-500'} />
                     <div>
                        <h3 className="text-xs font-black uppercase text-white">{p.unit?.passiveDesc}</h3>
                        <p className="text-[8px] text-slate-500 font-mono uppercase">{p.unit?.activeDesc}</p>
                     </div>
                  </div>
                  <Button 
                    variant={localAbilityActive ? 'amber' : 'secondary'} size="sm" 
                    onClick={() => { if(!p.activeUsed && p.cooldown <= 0) setLocalAbilityActive(!localAbilityActive); playSfx('confirm'); }}
                    disabled={p.activeUsed || p.cooldown > 0}
                  >
                    {p.activeUsed ? 'USED' : p.cooldown > 0 ? `CD: ${p.cooldown}` : 'ARM'}
                  </Button>
               </div>
            </div>

            {/* Block */}
            <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-[1.5rem]">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase italic text-white flex items-center gap-2"><Shield size={16} className="text-teal-500" /> DEFENSE (1 AP)</h3>
                  <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-slate-800">
                     <button onClick={() => setLocalBlockAp(Math.max(0, localBlockAp - 1))} className="p-1 disabled:opacity-20" disabled={localBlockAp === 0}><ChevronDown size={18} /></button>
                     <span className="font-black text-lg text-teal-400 w-4 text-center">{localBlockAp}</span>
                     <button onClick={() => setLocalBlockAp(localBlockAp + 1)} className="p-1 disabled:opacity-20" disabled={remainingAp < 1 || localBlockAp >= 3 || (localBlockAp === 2 && !isBlackoutPhase)}><ChevronUp size={18} /></button>
                  </div>
               </div>
            </div>

            {/* Attack */}
            <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-[1.5rem]">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase italic text-white flex items-center gap-2"><Skull size={16} className="text-red-500" /> OFFENSE (2 AP)</h3>
                  <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-slate-800">
                     <button onClick={() => setLocalAttackAp(Math.max(0, localAttackAp - 1))} className="p-1 disabled:opacity-20" disabled={localAttackAp === 0}><ChevronDown size={18} /></button>
                     <span className="font-black text-lg text-red-500 w-4 text-center">{localAttackAp}</span>
                     <button onClick={() => setLocalAttackAp(localAttackAp + 1)} className="p-1 disabled:opacity-20" disabled={remainingAp < 2}><ChevronUp size={18} /></button>
                  </div>
               </div>
               {localAttackAp > 0 && (
                  <div className="space-y-2">
                     {otherPlayers.map((t: any) => (
                        <button key={t.id} onClick={() => setLocalTargetId(t.id)} className={`w-full p-4 rounded-xl border flex justify-between items-center transition-all ${localTargetId === t.id ? 'bg-red-500/20 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
                           <div className="text-left">
                              <div className="text-[11px] font-black uppercase text-white">{t.name}</div>
                              <div className="text-[8px] font-mono text-slate-500">PROJ: {calculateProjectedDmg(t)} DMG</div>
                           </div>
                           <div className="text-right">
                              <div className="text-[12px] font-black text-red-500 font-mono">{t.hp} HP</div>
                           </div>
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>

         <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0f1e]/95 border-t border-slate-800 z-40">
            <Button 
               variant={totalSpent === 0 ? 'amber' : 'primary'} size="lg" className="w-full py-5"
               onClick={() => submitAction({ 
                  blockAp: localBlockAp, 
                  attackAp: localAttackAp, 
                  moveAp: localMoveAp,
                  abilityActive: localAbilityActive,
                  targetId: localTargetId,
                  moveIntent: localMoveIntent
               })}
               disabled={(localAttackAp > 0 || localMoveAp > 0) && !localTargetId}
            >
               {totalSpent === 0 ? 'COMMAND_RESERVE' : 'EXECUTE_STRIKE'}
            </Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};
