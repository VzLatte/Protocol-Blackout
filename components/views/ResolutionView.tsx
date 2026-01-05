import React, { useState, useEffect, useRef } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Skull, Shield, Zap, TrendingUp, Cpu, Move, Activity, Ghost, Crosshair, Droplets, Flame, ShieldAlert } from 'lucide-react';
import { ActionType, Phase, UnitType } from '../../types';
import { DefenseDisplay } from './DefenseDisplay';

interface ResolutionViewProps {
  game: any;
}

export const ResolutionView: React.FC<ResolutionViewProps> = ({ game }) => {
  const { resolutionLogs, round, nextTurn, visualLevel, credits, phaseTransition } = game;
  const [visibleCount, setVisibleCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(600);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Logic: Automated Playback ---
  useEffect(() => {
    if (visibleCount < resolutionLogs.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
        if (game.playSfx) game.playSfx('beep');
      }, playbackSpeed); 
      return () => clearTimeout(timer);
    } else {
      setIsDone(true);
    }
  }, [visibleCount, resolutionLogs, playbackSpeed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const getPlayerName = (id?: string) => game.players.find((p: any) => p.id === id)?.name || "SYSTEM";

  // --- FX HELPER: Character Visual Identity ---
  const getOperativeFX = (unitType: string, isAbility: boolean) => {
    const base = "border-slate-800 bg-slate-900/60";
    if (!unitType) return base;

    switch (unitType) {
      case UnitType.GHOST:
        return "border-purple-500/50 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)] opacity-80";
      case UnitType.TROJAN:
        return "border-lime-500/50 bg-lime-500/5 shadow-[inset_0_0_10px_rgba(132,204,22,0.1)]";
      case UnitType.LEECH:
        return "border-red-600/50 bg-red-950/20 animate-pulse";
      case UnitType.AEGIS:
        return "border-blue-400/50 bg-blue-500/10 scale-[1.01]";
      case UnitType.PYRUS:
        return "border-orange-500/50 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]";
      case UnitType.KILLSHOT:
        return "border-amber-400/50 bg-amber-400/5";
      default:
        return base;
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

  return (
    <ScreenWrapper visualLevel={visualLevel} noScroll centerContent={false}>
      <GlobalHeader 
        phase={Phase.RESOLUTION} 
        onHelp={() => game.setIsHelpOpen(true)} 
        onSettings={() => game.setIsSettingsOpen(true)} 
        onExit={() => game.setIsExitConfirming(true)} 
        credits={credits} 
      />
      
      {/* Speed Toggle */}
      {!isDone && (
        <button 
          onClick={() => setPlaybackSpeed(100)}
          className="fixed top-24 right-6 z-50 bg-black/90 border border-teal-500/40 px-4 py-2 rounded-full text-[10px] font-mono text-teal-400 animate-pulse flex items-center gap-2"
        >
          <Zap size={12} /> OVERCLOCK PLAYBACK
        </button>
      )}

      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center max-w-4xl mx-auto w-full overflow-hidden pb-28 pt-10">
         <div className="text-center mb-8 shrink-0">
            <div className="text-teal-500 font-mono text-[8px] uppercase tracking-[0.5em] mb-2 opacity-60">TACTICAL_SEQUENCE_RESOLVING</div>
            <h2 className="text-4xl font-black uppercase text-white italic tracking-tighter">CYCLE {round - 1} FEED</h2>
         </div>

         {phaseTransition && (
           <div className="w-full mb-6 bg-sky-500/10 border border-sky-500/30 p-4 rounded-2xl flex items-center gap-4 animate-in zoom-in duration-300">
              <TrendingUp size={20} className="text-sky-400" />
              <div className="text-[10px] font-mono text-white uppercase tracking-tight">{phaseTransition}</div>
           </div>
         )}
         
         <div 
            ref={scrollRef} 
            className="flex-1 w-full space-y-4 overflow-y-auto pr-1 custom-scrollbar pb-20"
            style={{ scrollBehavior: 'auto' }}
         >
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
                  className={`border p-4 rounded-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200 relative overflow-hidden transition-all
                    ${operativeFX}
                    ${isCritical ? 'ring-2 ring-red-500/40' : ''}`}
                >
                   {/* Background Decal for Unit Identity */}
                   <div className="absolute -right-4 -top-2 opacity-[0.03] font-black italic text-6xl pointer-events-none uppercase">
                      {unitType}
                   </div>

                   <div className="flex items-center gap-4 relative z-10">
                       {/* Contextual Icon with character logic */}
                       <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-all
                          ${isBlock ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 
                            isAttack ? 'bg-red-500/10 text-red-500 border-red-500/30' : 
                            isMove ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                          {getOperativeIcon(unitType, isBlock ? <Shield size={20} /> : isAttack ? <Skull size={20} /> : <Zap size={20} />)}
                       </div>

                       {/* Log Info */}
                       <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                             <div className="text-[11px] font-black text-white uppercase tracking-tighter flex items-center gap-2">
                               {getPlayerName(log.attackerId)} 
                               {log.targetName && <span className="text-slate-500 font-mono text-[8px]">➔ {log.targetName}</span>}
                             </div>
                             <div className={`text-[9px] font-mono uppercase tracking-tight mt-1
                                ${isCritical ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                                {log.resultMessage}
                             </div>
                             {log.rangeChange && (
                               <div className="text-[8px] font-mono text-sky-400 mt-1 bg-sky-500/10 px-2 py-0.5 rounded inline-block border border-sky-500/20">
                                 POSITIONAL_SHIFT: {log.rangeChange}
                               </div>
                             )}
                          </div>

                          {/* Stat Readouts */}
                          <div className="flex items-center gap-2 shrink-0">
                             {(log.fatigueGained > 0 || isMove) && (
                               <div className="bg-purple-500/20 border border-purple-500/40 px-2 py-1 rounded-lg flex flex-col items-center min-w-[45px]">
                                  <span className="text-[6px] font-mono text-purple-400 uppercase leading-none mb-1">Strain</span>
                                  <span className="text-[10px] font-black text-white leading-none">+{log.fatigueGained || 1}</span>
                               </div>
                             )}
                             
                             {isAttack && log.damage !== undefined && (
                               <div className="bg-red-500/20 border border-red-500/40 px-3 py-1 rounded-lg flex flex-col items-center">
                                  <span className="text-[6px] font-mono text-red-400 uppercase leading-none mb-1">Impact</span>
                                  <span className="text-[10px] font-black text-red-400 leading-none">{log.damage} HP</span>
                               </div>
                             )}
                          </div>
                       </div>
                   </div>

                   {/* Defense System Visualization */}
                   {isBlock && log.defenseTier && (
                     <div className="mt-1 border-t border-white/5 pt-3 animate-in fade-in duration-500">
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

            {/* Waiting/Processing Animation */}
            {!isDone && (
              <div className="p-10 border border-dashed border-slate-800 rounded-3xl opacity-30 flex flex-col items-center justify-center gap-3">
                 <Cpu size={24} className="text-teal-500 animate-spin-slow" />
                 <div className="flex gap-1">
                    <div className="w-1 h-1 bg-teal-500 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-teal-500 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-teal-500 animate-bounce"></div>
                 </div>
                 <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-teal-500">Syncing_Neural_Data</span>
              </div>
            )}
         </div>

         {/* Navigation to next Cycle */}
         {isDone && (
           <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/95 to-transparent z-30 animate-in slide-in-from-bottom duration-700">
              <Button 
                variant="primary" size="lg" className="w-full max-w-2xl mx-auto py-6 group relative overflow-hidden"
                onClick={nextTurn}
              >
                <div className="absolute inset-0 bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors"></div>
                <span className="relative flex items-center justify-center gap-3 tracking-[0.2em] font-black italic">
                  INITIALIZE CYCLE {round} <Zap size={18} className="fill-current" />
                </span>
              </Button>
           </div>
         )}
      </div>
    </ScreenWrapper>
  );
};