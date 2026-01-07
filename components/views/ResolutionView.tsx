
import React, { useState, useEffect, useRef } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Skull, Shield, Zap, TrendingUp, Cpu, Move, Activity, Ghost, Crosshair, Droplets, Flame, ShieldAlert, Eye, EyeOff, ChevronUp, Info } from 'lucide-react';
import { ActionType, Phase, UnitType } from '../../types';
import { DefenseDisplay } from './DefenseDisplay';
import { BattleStage } from './BattleStage';

interface ResolutionViewProps {
  game: any;
}

export const ResolutionView: React.FC<ResolutionViewProps> = ({ game }) => {
  const { resolutionLogs, round, nextTurn, visualLevel, credits, phaseTransition, tutorial, setTutorial } = game;
  const [visibleCount, setVisibleCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(800); // Slower for animation clarity
  
  // Sheet State
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Animation State
  const [stageLeftId, setStageLeftId] = useState<string | null>(null);
  const [stageRightId, setStageRightId] = useState<string | null>(null);
  const [animState, setAnimState] = useState<{left: 'idle'|'attack'|'hit'|'faint', right: 'idle'|'attack'|'hit'|'faint'}>({ left: 'idle', right: 'idle' });

  // Initialize stage with main player (Human) on Left and first enemy on Right
  useEffect(() => {
    const human = game.players.find((p: any) => !p.isAI);
    const enemy = game.players.find((p: any) => p.isAI && !p.isEliminated) || game.players.find((p: any) => p.isAI);
    setStageLeftId(human?.id || game.players[0].id);
    setStageRightId(enemy?.id || game.players[1].id);
  }, []);

  // --- Logic: Automated Playback & Animation Sync ---
  useEffect(() => {
    if (visibleCount < resolutionLogs.length) {
      const timer = setTimeout(() => {
        const log = resolutionLogs[visibleCount];
        
        // 1. Determine who is on stage
        const currentLeft = stageLeftId;
        const currentRight = stageRightId;
        
        let newLeft = currentLeft;
        let newRight = currentRight;
        const actorId = log.attackerId;
        const targetId = log.targetId;

        // Ensure participants are visible
        const humanId = game.players.find((p: any) => !p.isAI)?.id;
        
        if (actorId === humanId) newLeft = humanId;
        else if (targetId === humanId) newLeft = humanId;
        else if (actorId !== currentLeft && actorId !== currentRight) {
             if (currentLeft === humanId) newRight = actorId; 
             else newLeft = actorId;
        }

        if (targetId && targetId !== newLeft && targetId !== newRight) {
             if (newLeft === actorId) newRight = targetId;
             else newLeft = targetId;
        }

        // Apply swaps
        setStageLeftId(newLeft);
        setStageRightId(newRight);

        // 2. Trigger Animations
        let nextAnim = { left: 'idle', right: 'idle' } as any;

        if (log.type === ActionType.ATTACK) {
             if (actorId === newLeft) nextAnim.left = 'attack';
             if (actorId === newRight) nextAnim.right = 'attack';
             
             if (targetId && log.damage > 0) {
                 if (targetId === newLeft) nextAnim.left = 'hit';
                 if (targetId === newRight) nextAnim.right = 'hit';
             }
        }
        
        // Fainting check
        const targetPlayer = game.players.find((p:any) => p.id === targetId);
        if (targetPlayer && targetPlayer.hp <= 0) {
            if (targetId === newLeft) nextAnim.left = 'faint';
            if (targetId === newRight) nextAnim.right = 'faint';
        }

        setAnimState(nextAnim);

        // Reset animation after short delay
        setTimeout(() => {
             setAnimState(prev => {
                const l = prev.left === 'faint' ? 'faint' : 'idle';
                const r = prev.right === 'faint' ? 'faint' : 'idle';
                return { left: l, right: r };
             });
        }, 500);

        setVisibleCount(prev => prev + 1);
        if (game.playSfx) game.playSfx('beep');
      }, playbackSpeed); 
      return () => clearTimeout(timer);
    } else {
      setIsDone(true);
      // Trigger Tutorial Step 6 if active and in C1-L1
      if (tutorial.isActive && tutorial.step === 5 && game.currentCampaignLevelId === 'C1-L1') {
         setTutorial((prev: any) => ({ ...prev, step: 6 }));
         setIsSheetExpanded(true);
      }
    }
  }, [visibleCount, resolutionLogs, playbackSpeed, stageLeftId, stageRightId, game.players, tutorial.isActive, tutorial.step, game.currentCampaignLevelId]);

  // Auto-scroll when logs update, but only if sheet is expanded or user isn't holding it
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

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

  const getPlayerName = (id?: string) => game.players.find((p: any) => p.id === id)?.name || "SYSTEM";

  // Helpers for Log Rendering
  const getOperativeFX = (unitType: string, isAbility: boolean) => {
    const base = "border-slate-800 bg-slate-900/60";
    if (!unitType) return base;
    switch (unitType) {
      case UnitType.GHOST: return "border-purple-500/50 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)] opacity-80";
      case UnitType.TROJAN: return "border-lime-500/50 bg-lime-500/5 shadow-[inset_0_0_10px_rgba(132,204,22,0.1)]";
      case UnitType.LEECH: return "border-red-600/50 bg-red-950/20 animate-pulse";
      case UnitType.AEGIS: return "border-blue-400/50 bg-blue-500/10 scale-[1.01]";
      case UnitType.PYRUS: return "border-orange-500/50 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]";
      case UnitType.KILLSHOT: return "border-amber-400/50 bg-amber-400/5";
      default: return base;
    }
  };

  const getOperativeIcon = (unitType: string, defaultIcon: React.ReactNode) => {
    switch (unitType) {
      case UnitType.GHOST: return <Ghost size={20} />;
      case UnitType.HUNTER: return <Crosshair size={20} />;
      case UnitType.LEECH: return <Droplets size={20} />;
      case UnitType.PYRUS: return <Flame size={20} />;
      case UnitType.AEGIS: return <ShieldAlert size={20} />;
      default: return defaultIcon;
    }
  };

  const leftPlayer = game.players.find((p:any) => p.id === stageLeftId) || null;
  const rightPlayer = game.players.find((p:any) => p.id === stageRightId) || null;

  return (
    <ScreenWrapper visualLevel={visualLevel} noScroll centerContent={false}>
      <GlobalHeader 
        phase={Phase.RESOLUTION} 
        onHelp={() => game.setIsHelpOpen(true)} 
        onSettings={() => game.setIsSettingsOpen(true)} 
        onExit={() => game.setIsExitConfirming(true)} 
        credits={credits} 
      />
      
      {/* Speed Controls (Floating) */}
      <div className="fixed top-24 right-6 z-30">
        {!isDone && (
          <button 
            onClick={() => setPlaybackSpeed(100)}
            className="bg-black/90 border border-teal-500/40 px-4 py-2 rounded-full text-[10px] font-mono text-teal-400 animate-pulse flex items-center gap-2 hover:bg-teal-900/20 transition-colors shadow-lg"
          >
            <Zap size={12} /> OVERCLOCK
          </button>
        )}
      </div>

      {/* Battle Visual Stage (Perspective Mode) */}
      <div className="absolute inset-0 top-0 z-0">
        <BattleStage 
          leftPlayer={leftPlayer} 
          rightPlayer={rightPlayer} 
          animState={animState}
          variant="perspective"
          className="w-full h-full"
        />
      </div>

      {/* SWIPEABLE LOG SHEET */}
      <div 
         className={`absolute bottom-0 left-0 right-0 bg-[#0a0f1e]/95 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.6)] border-t border-slate-700/50 z-40 transition-all duration-500 ease-out flex flex-col`}
         style={{ height: isSheetExpanded ? '85%' : '40%' }}
      >
         {/* Handle / Header Area */}
         <div 
            className="w-full shrink-0 pt-4 pb-2 px-6 cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#0a0f1e] to-[#0a0f1e]/90"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
         >
            <div className="w-16 h-1.5 bg-slate-700/50 rounded-full mx-auto mb-4"></div>
            
            <div className="text-center mb-2">
               <div className="text-teal-500 font-mono text-[8px] uppercase tracking-[0.5em] mb-1 opacity-60">TACTICAL_SEQUENCE_RESOLVING</div>
               <h2 className="text-2xl font-black uppercase text-white italic tracking-tighter">CYCLE {round - 1} REPORT</h2>
            </div>

            {!isSheetExpanded && (
               <div className="text-center mt-2 animate-pulse">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.3em]">Swipe Up for Details</span>
                  <ChevronUp size={16} className="mx-auto text-slate-600 mt-1" />
               </div>
            )}
         </div>

         {/* Expanded Logs (Scrollable) */}
         <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-24 space-y-3 relative">
             {phaseTransition && (
               <div className="w-full mb-4 bg-sky-500/10 border border-sky-500/30 p-3 rounded-2xl flex items-center gap-4 animate-in zoom-in duration-300">
                  <TrendingUp size={16} className="text-sky-400" />
                  <div className="text-[10px] font-mono text-white uppercase tracking-tight">{phaseTransition}</div>
               </div>
             )}
             
             <div ref={scrollRef} className="space-y-3">
                {resolutionLogs.slice(0, visibleCount).map((log: any, i: number) => {
                  const p = game.players.find((x: any) => x.id === (log.attackerId || log.playerId));
                  const unitType = p?.unit?.type;
                  const isAbility = log.type === ActionType.ABILITY;
                  const isBlock = log.type === ActionType.BLOCK || log.type === ActionType.PHASE;
                  const isAttack = log.type === ActionType.ATTACK;
                  const isMove = log.type === ActionType.MOVE;
                  
                  const operativeFX = getOperativeFX(unitType, isAbility);
                  const isCritical = log.damage > 400 || log.resultMessage?.includes("LETHAL");

                  return (
                    <div 
                      key={i} 
                      className={`border p-3 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200 relative overflow-hidden transition-all
                        ${operativeFX}
                        ${isCritical ? 'ring-2 ring-red-500/40' : ''}`}
                    >
                       <div className="flex items-center gap-3 relative z-10">
                           <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all
                              ${isBlock ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 
                                isAttack ? 'bg-red-500/10 text-red-500 border-red-500/30' : 
                                isMove ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                              {getOperativeIcon(unitType, isBlock ? <Shield size={16} /> : isAttack ? <Skull size={16} /> : <Zap size={16} />)}
                           </div>

                           <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="min-w-0">
                                 <div className="text-[10px] font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                   {getPlayerName(log.attackerId)} 
                                   {log.targetName && <span className="text-slate-500 font-mono text-[8px]">➔ {log.targetName}</span>}
                                 </div>
                                 <div className={`text-[8px] font-mono uppercase tracking-tight mt-0.5
                                    ${isCritical ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                                    {log.resultMessage}
                                 </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                 {(log.fatigueGained > 0 || isMove) && (
                                   <div className="bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded-lg flex flex-col items-center min-w-[35px]">
                                      <span className="text-[6px] font-mono text-purple-400 uppercase leading-none mb-0.5">Strain</span>
                                      <span className="text-[9px] font-black text-white leading-none">+{log.fatigueGained || 1}</span>
                                   </div>
                                 )}
                                 {isAttack && log.damage !== undefined && (
                                   <div className="bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-lg flex flex-col items-center">
                                      <span className="text-[6px] font-mono text-red-400 uppercase leading-none mb-0.5">Impact</span>
                                      <span className="text-[9px] font-black text-red-400 leading-none">{log.damage}</span>
                                   </div>
                                 )}
                                 {isAttack && log.shield > 0 && (
                                   <div className="bg-teal-500/20 border border-teal-500/40 px-2 py-0.5 rounded-lg flex flex-col items-center">
                                      <span className="text-[6px] font-mono text-teal-400 uppercase leading-none mb-0.5">Defended</span>
                                      <span className="text-[9px] font-black text-white leading-none">{log.shield}</span>
                                   </div>
                                 )}
                              </div>
                           </div>
                       </div>

                       {isBlock && log.defenseTier && (
                         <div className="mt-1 border-t border-white/5 pt-2 animate-in fade-in duration-500">
                            <DefenseDisplay 
                                defenseTier={log.defenseTier} 
                                isCracked={log.isCracked} 
                                mitigationPercent={log.mitigationPercent}
                                shieldHealth={log.shield}
                            />
                         </div>
                       )}
                    </div>
                  );
                })}

                {!isDone && (
                  <div className="p-6 border border-dashed border-slate-800 rounded-3xl opacity-30 flex flex-col items-center justify-center gap-2">
                     <Cpu size={20} className="text-teal-500 animate-spin-slow" />
                     <div className="flex gap-1">
                        <div className="w-1 h-1 bg-teal-500 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1 h-1 bg-teal-500 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-teal-500 animate-bounce"></div>
                     </div>
                  </div>
                )}
             </div>
         </div>

         {/* Sticky Footer Button in Sheet */}
         <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e] to-transparent z-50">
            {isDone ? (
              <Button 
                variant="primary" size="lg" className="w-full shadow-2xl py-5"
                onClick={() => {
                  if (tutorial.isActive && tutorial.step === 6) {
                    game.completeTutorial();
                  }
                  nextTurn();
                }}
              >
                <div className="flex items-center gap-2">
                   <span>INITIALIZE CYCLE {round}</span>
                   <Zap size={18} className="fill-current" />
                </div>
              </Button>
            ) : (
              <div className="w-full py-5 text-center">
                 <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">Calculating...</span>
              </div>
            )}
         </div>
      </div>

      {/* Tutorial Overlay for Resolution Phase */}
      {tutorial.isActive && tutorial.step === 6 && game.currentCampaignLevelId === 'C1-L1' && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-teal-500 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-teal-400">
                 <Info size={24} />
                 <h3 className="text-lg font-black uppercase italic">TUTORIAL: AFTERMATH</h3>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                 The <strong>RESOLUTION LOG</strong> shows the outcome of all secret actions. 
                 <br/><br/>
                 Review how much damage you took versus how much you mitigated. 
                 Use this data to predict your opponent's next move.
              </p>
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-[9px] font-mono text-slate-400">
                 TIP: If an enemy blocked heavily this turn, they might be low on AP next turn.
              </div>
              <Button variant="primary" onClick={() => game.completeTutorial()}>
                 COMPLETE TRAINING
              </Button>
           </div>
        </div>
      )}
    </ScreenWrapper>
  );
};
