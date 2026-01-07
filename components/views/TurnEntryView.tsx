
import React, { useState, useRef } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Shield, Skull, ChevronDown, ChevronUp, Brain, Zap, Activity, Heart, ChevronRight, Minus, Plus, Move, AlertTriangle, Info, ArrowUp } from 'lucide-react';
import { BASE_ATTACK_DMG, ATTACK_CONFIG, BLOCK_CONFIG, RANGE_NAMES } from '../../constants';
import { Phase, ActionType, UnitType, MoveIntent } from '../../types';
import { BattleStage } from './BattleStage';

interface TurnEntryViewProps {
  game: any;
}

export const TurnEntryView: React.FC<TurnEntryViewProps> = ({ game }) => {
  const { playSfx, credits, round, distanceMatrix, submitAction, tutorial, setTutorial } = game;
  const p = game.players[game.currentPlayerIdx];
  const otherPlayers = game.players.filter((x: any) => x.id !== p.id && !x.isEliminated);
  
  // Local drafting state
  const [localBlockTier, setLocalBlockTier] = useState(0); // 0, 1, 2, 3
  const [localAttackTier, setLocalAttackTier] = useState(0); // 0, 1, 2, 3
  const [localMoveActive, setLocalMoveActive] = useState(false);
  const [localMoveIntent, setLocalMoveIntent] = useState<MoveIntent>(MoveIntent.CLOSE);
  const [localAbilityActive, setLocalAbilityActive] = useState(false);
  const [localTargetId, setLocalTargetId] = useState<string | undefined>(otherPlayers[0]?.id);
  
  // Sheet State
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const touchStartY = useRef(0);

  // Dynamic Costs (Triangular Logic: 1, 3, 6)
  const moveCost = localMoveActive ? (1 + (p.moveFatigue || 0)) : 0;
  // @ts-ignore
  const attackCost = localAttackTier > 0 ? ATTACK_CONFIG[localAttackTier].ap : 0;
  // @ts-ignore
  const blockCost = localBlockTier > 0 ? BLOCK_CONFIG[localBlockTier].ap : 0;
  
  const totalSpent = blockCost + attackCost + moveCost;
  const remainingAp = p.ap - totalSpent;
  
  const targetPlayer = localTargetId ? game.players.find((pl: any) => pl.id === localTargetId) : otherPlayers[0];

  // Helper Logic
  const getRangeData = (tid: string) => {
    const key = [p.id, tid].sort().join('-');
    const val = distanceMatrix.get(key) ?? 1;
    return { name: RANGE_NAMES[val as keyof typeof RANGE_NAMES], val };
  };

  const calculateProjectedDmg = (target: any) => {
    if (localAttackTier === 0) return 0;
    const { val: rangeVal } = getRangeData(target.id);
    const rangeMult = rangeVal === 0 ? 1.2 : rangeVal === 2 ? (0.75 + (p.unit?.focus || 0)) : 1.0;
    
    // @ts-ignore
    const atkConfig = ATTACK_CONFIG[localAttackTier];
    const base = BASE_ATTACK_DMG * atkConfig.mult * (p.unit?.atkStat || 1.0);
    
    let bonus = 1.0;
    if (p.unit?.type === UnitType.KILLSHOT) bonus *= 1.1;
    if (p.targetLockId === target.id) bonus *= 1.3;
    
    return Math.floor(base * rangeMult * bonus);
  };

  const calculateShield = () => {
    if (localBlockTier === 0) return 0;
    // @ts-ignore
    const base = BLOCK_CONFIG[localBlockTier].base * (p.unit?.defStat || 1.0);
    const currentOverheat = p.blockFatigue || 0;
    const penalty = Math.min(0.9, currentOverheat * 0.15);
    return Math.floor(base * (1 - penalty));
  };

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) setIsSheetExpanded(true); // Swipe Up
      else setIsSheetExpanded(false); // Swipe Down
    }
  };

  // Tutorial Render Helper
  const renderTutorialOverlay = () => {
    const isTutorialLevel = game.currentCampaignLevelId === 'C1-L1';
    if (!tutorial.isActive || tutorial.step > 4 || !isTutorialLevel) return null;

    const stepContent = [
      {
        title: "OBJECTIVE: SURVIVE",
        text: "Welcome, Operative. Your primary goal is to eliminate the enemy unit by reducing their HP to 0. You must balance aggression with defense to survive.",
        action: () => game.advanceTutorial()
      },
      {
        title: "KNOW YOUR TOOLS",
        text: (
          <div className="space-y-2">
            <p>Every unit has distinct abilities.</p>
            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
              <span className="text-[10px] text-teal-400 font-bold uppercase block">Passive (Always On)</span>
              <span className="text-[9px] text-slate-300">{p.unit?.passiveDesc}</span>
            </div>
            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
              <span className="text-[10px] text-amber-500 font-bold uppercase block">Active (Requires Activation)</span>
              <span className="text-[9px] text-slate-300">{p.unit?.activeDesc}</span>
            </div>
          </div>
        ),
        action: () => game.advanceTutorial()
      },
      {
        title: "SYSTEM FATIGUE",
        text: (
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>MOVEMENT:</strong> Consumes 1 AP but generates <span className="text-purple-400">FATIGUE</span>. Consecutive moves cost more AP.</li>
            <li><strong>BLOCKING:</strong> Using defense generates <span className="text-amber-500">OVERHEAT</span>. Consecutive blocking reduces shield efficiency by 15% per stack.</li>
          </ul>
        ),
        action: () => game.advanceTutorial()
      },
      {
        title: "ALLOCATE ENERGY",
        text: "You have Action Points (AP). Costs follow a triangular curve: Level 1 = 1 AP, Level 2 = 3 AP, Level 3 = 6 AP.\n\nTry allocating your points now. Unused AP is reserved for the next turn.",
        action: () => {
           setIsSheetExpanded(true); // Open sheet for them
           game.setTutorial((prev: any) => ({ ...prev, step: 5 })); // Advance to hidden state
        }
      }
    ];

    const content = stepContent[tutorial.step - 1];
    if (!content) return null;

    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-300">
         <div className="bg-slate-900 border border-teal-500 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-6 relative">
            <div className="flex items-center gap-3 text-teal-400 border-b border-slate-800 pb-4">
               <Info size={24} />
               <h3 className="text-lg font-black uppercase italic tracking-wider">{content.title}</h3>
            </div>
            <div className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
               {content.text}
            </div>
            
            {tutorial.step === 4 ? (
               <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-[10px] text-teal-300 font-mono text-center animate-pulse">
                  Dismiss this overlay to begin allocation.
               </div>
            ) : null}

            <Button variant="primary" onClick={content.action} className="w-full">
               {tutorial.step === 4 ? "ACCESS TERMINAL" : "NEXT PROTOCOL"}
            </Button>
            
            <div className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 text-[8px] font-bold px-2 py-1 rounded-full border border-slate-600">
               STEP {tutorial.step} / 4
            </div>
         </div>
      </div>
    );
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
      
      {/* BACKGROUND BATTLE STAGE */}
      <div className="absolute inset-0 top-0 z-0">
         <BattleStage 
            leftPlayer={p} 
            rightPlayer={targetPlayer || null} 
            animState={{ 
               left: localAttackTier > 0 ? 'attack' : 'idle', 
               right: 'idle' 
            }} 
            className="w-full h-full pb-[35vh]" 
         />
      </div>

      {/* SWIPEABLE ALLOCATION CARD */}
      <div 
         className={`absolute bottom-0 left-0 right-0 bg-[#0a0f1e]/95 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.6)] border-t border-slate-700/50 z-20 transition-all duration-500 ease-out flex flex-col`}
         style={{ height: isSheetExpanded ? '85%' : '40%' }}
      >
         {/* Handle / Header Area */}
         <div 
            className="w-full shrink-0 pt-4 pb-2 px-6 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
         >
            <div className="w-16 h-1.5 bg-slate-700/50 rounded-full mx-auto mb-6"></div>
            
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                      <Heart size={20} />
                   </div>
                   <div>
                      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Integrity</div>
                      <div className="text-xl font-black text-white italic">{p.hp} <span className="text-sm not-italic text-slate-600 font-normal">/ {p.maxHp}</span></div>
                   </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                   <div className="text-right">
                      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Energy</div>
                      <div className={`text-xl font-black italic ${remainingAp < 0 ? 'text-red-500 animate-pulse' : remainingAp === 0 ? 'text-amber-500' : 'text-teal-400'}`}>
                         {remainingAp} <span className="text-sm not-italic text-slate-600 font-normal">/ {p.ap}</span>
                      </div>
                   </div>
                   <div className="h-10 w-10 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-400 shrink-0">
                      <Zap size={20} />
                   </div>
                </div>
            </div>
            
            {!isSheetExpanded && (
               <div className="text-center mt-4 animate-pulse">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.3em]">Swipe Up to Command</span>
                  <ChevronUp size={16} className="mx-auto text-slate-600 mt-1" />
               </div>
            )}
         </div>

         {/* Expanded Controls */}
         <div className={`flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 space-y-4 transition-opacity duration-300 ${isSheetExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            
            {/* Ability Card */}
            <div className={`p-5 rounded-[2rem] border transition-all ${localAbilityActive ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-900/40 border-slate-800'}`}>
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className={`p-2 rounded-xl ${localAbilityActive ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                        <Activity size={20} />
                     </div>
                     <div>
                        <h3 className="text-xs font-black uppercase text-white tracking-wide">{p.unit?.passiveDesc.split(':')[0]}</h3>
                        <p className="text-[9px] text-slate-500 font-mono uppercase">{p.unit?.activeDesc}</p>
                     </div>
                  </div>
                  <button 
                     onClick={() => { if(!p.activeUsed && p.cooldown <= 0) setLocalAbilityActive(!localAbilityActive); playSfx('confirm'); }}
                     disabled={p.activeUsed || p.cooldown > 0}
                     className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${localAbilityActive ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-500'}`}
                  >
                     {p.activeUsed ? 'OFFLINE' : p.cooldown > 0 ? `CD: ${p.cooldown}` : localAbilityActive ? 'ACTIVE' : 'ACTIVATE'}
                  </button>
               </div>
            </div>

            {/* Move Card */}
            <div className={`p-5 rounded-[2rem] border transition-all ${localMoveActive ? 'bg-sky-500/10 border-sky-500/50' : 'bg-slate-900/40 border-slate-800'}`}>
               <div className="flex justify-between items-center mb-3">
                   <h3 className="text-xs font-black uppercase italic text-white flex items-center gap-2">
                     <Move size={16} className="text-sky-400" /> Relocate
                   </h3>
                   <div className="flex items-center gap-2">
                       {p.moveFatigue > 0 && (
                          <div className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded-lg border border-red-500/30">
                            Fatigue +{p.moveFatigue}
                          </div>
                       )}
                       <div className="text-[9px] font-mono text-slate-400 uppercase">Cost: {1 + (p.moveFatigue || 0)} AP</div>
                   </div>
               </div>
               
               <div className="flex gap-2">
                  <button 
                    onClick={() => { setLocalMoveActive(!localMoveActive); playSfx('confirm'); }}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] transition-all border ${localMoveActive ? 'bg-sky-500 text-black border-sky-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                  >
                     {localMoveActive ? 'Moving' : 'Stationary'}
                  </button>
                  
                  {localMoveActive && (
                     <div className="flex gap-2 flex-1 animate-in slide-in-from-right duration-200">
                        <button 
                           onClick={() => setLocalMoveIntent(MoveIntent.CLOSE)}
                           className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] transition-all border ${localMoveIntent === MoveIntent.CLOSE ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                        >
                           Close In
                        </button>
                        <button 
                           onClick={() => setLocalMoveIntent(MoveIntent.OPEN)}
                           className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] transition-all border ${localMoveIntent === MoveIntent.OPEN ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                        >
                           Retreat
                        </button>
                     </div>
                  )}
               </div>
            </div>

            {/* Defense Card */}
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-[2rem]">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-black uppercase italic text-white flex items-center gap-2">
                     <Shield size={16} className="text-teal-500" /> Defense Matrix
                  </h3>
                  {p.blockFatigue > 0 && (
                     <div className="flex items-center gap-1 text-amber-500 animate-pulse">
                        <AlertTriangle size={12} />
                        <span className="text-[8px] font-black uppercase">Overheat: -{Math.min(90, p.blockFatigue * 15)}% Eff</span>
                     </div>
                  )}
               </div>
               
               <div className="flex items-center gap-4">
                  <button 
                     onClick={() => setLocalBlockTier(Math.max(0, localBlockTier - 1))} 
                     disabled={localBlockTier === 0}
                     className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 disabled:opacity-30 active:scale-95 transition-all"
                  >
                     <Minus size={16} />
                  </button>
                  <div className="flex-1 text-center">
                     <span className={`text-xl font-black ${localBlockTier > 0 ? 'text-teal-400' : 'text-slate-600'}`}>LVL {localBlockTier}</span>
                     <div className="text-[8px] font-mono text-slate-500 uppercase mt-1">
                        {localBlockTier === 0 ? 'No Block' : `${calculateShield()} Shield (${blockCost} AP)`}
                     </div>
                  </div>
                  <button 
                     onClick={() => setLocalBlockTier(localBlockTier + 1)} 
                     disabled={remainingAp < 1 || localBlockTier >= 3}
                     className="h-10 w-10 rounded-xl bg-teal-500 flex items-center justify-center text-black hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 active:scale-95 transition-all"
                  >
                     <Plus size={16} />
                  </button>
               </div>
            </div>

            {/* Offense Card */}
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-[2rem] space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase italic text-white flex items-center gap-2">
                     <Skull size={16} className="text-red-500" /> Weapon Systems
                  </h3>
               </div>
               
               <div className="flex items-center gap-4">
                  <button 
                     onClick={() => setLocalAttackTier(Math.max(0, localAttackTier - 1))} 
                     disabled={localAttackTier === 0}
                     className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 disabled:opacity-30 active:scale-95 transition-all"
                  >
                     <Minus size={16} />
                  </button>
                  <div className="flex-1 text-center">
                     <span className={`text-xl font-black ${localAttackTier > 0 ? 'text-red-500' : 'text-slate-600'}`}>LVL {localAttackTier}</span>
                     <div className="text-[8px] font-mono text-slate-500 uppercase mt-1">
                        {localAttackTier === 0 ? 'No Attack' : `${attackCost} AP cost`}
                     </div>
                  </div>
                  <button 
                     onClick={() => setLocalAttackTier(localAttackTier + 1)} 
                     disabled={remainingAp < 1 || localAttackTier >= 3}
                     className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center text-white hover:bg-red-400 disabled:bg-slate-800 disabled:text-slate-500 active:scale-95 transition-all"
                  >
                     <Plus size={16} />
                  </button>
               </div>
               
               {/* Target Selector */}
               {localAttackTier > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/50">
                     <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2">Select Primary Target</div>
                     {otherPlayers.map((t: any) => (
                        <button key={t.id} onClick={() => setLocalTargetId(t.id)} className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all ${localTargetId === t.id ? 'bg-red-500/10 border-red-500/50' : 'bg-black/20 border-slate-800'}`}>
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${localTargetId === t.id ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
                              <div className="text-left">
                                 <div className="text-[10px] font-black uppercase text-white">{t.name}</div>
                                 <div className="text-[8px] font-mono text-slate-500">PROJ: {calculateProjectedDmg(t)} DMG</div>
                              </div>
                           </div>
                           <ChevronRight size={14} className={localTargetId === t.id ? 'text-red-500' : 'text-slate-700'} />
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* Sticky Footer Button */}
         <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e] to-transparent z-30">
            <Button 
               variant={remainingAp >= 0 ? (totalSpent === 0 ? 'amber' : 'primary') : 'secondary'} 
               size="lg" className="w-full py-5 text-lg shadow-2xl"
               onClick={() => {
                 if (tutorial.isActive && tutorial.step === 4) {
                   game.setTutorial((prev: any) => ({ ...prev, step: 5 }));
                 }
                 submitAction({ 
                    blockAp: localBlockTier, 
                    attackAp: localAttackTier, 
                    moveAp: localMoveActive ? 1 : 0,
                    abilityActive: localAbilityActive,
                    targetId: localTargetId,
                    moveIntent: localMoveIntent
                 });
               }}
               disabled={remainingAp < 0 || ((localAttackTier > 0 || localMoveActive) && !localTargetId)}
            >
               {remainingAp < 0 ? 'INSUFFICIENT AP' : totalSpent === 0 ? 'COMMAND_RESERVE' : 'EXECUTE_STRIKE'}
            </Button>
         </div>
      </div>

      {renderTutorialOverlay()}
    </ScreenWrapper>
  );
};
