
import React, { useState, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Play, Pause, RotateCcw, ChevronRight, Zap, Target, Shield, Skull, Crosshair, Map as MapIcon, Footprints, Wind } from 'lucide-react';
import { Phase, ActionType, DamageType, TileType } from '../../types';
import { GRID_SIZE } from '../../constants';
import { TacticalGrid } from '../tactical/TacticalGrid';

interface ResolutionViewProps {
  game: any;
}

export const ResolutionView: React.FC<ResolutionViewProps> = ({ game }) => {
  const { resolutionLogs, round, nextTurn, visualLevel, credits, prevPlayers, players, activeMap, tutorial } = game;
  const [step, setStep] = useState(0); // 0: Init, 1: Move, 2: Action (Seq), 3: End
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLogIndex, setActiveLogIndex] = useState(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(800);
  
  // 1. Track visual HP per player
  const [visualHps, setVisualHps] = useState<Record<string, number>>({});

  // Filter logs for combat phase (Attack/Intercept)
  const combatLogs = resolutionLogs.filter((l: any) => 
    l.type === ActionType.ATTACK || 
    l.type === ActionType.INTERCEPT
  );

  // Filter logs for end phase (Venting, Hazards)
  const endLogs = resolutionLogs.filter((l: any) => 
    l.type === ActionType.VENT || 
    l.type === ActionType.BOUNTY
  );

  // 2. Initialize visual HPs when playback starts or restarts
  useEffect(() => {
    const initialHps: Record<string, number> = {};
    prevPlayers.forEach((p: any) => initialHps[p.id] = p.hp);
    setVisualHps(initialHps);
  }, [prevPlayers]);

  // 3. Update HP only when a log hits
  useEffect(() => {
    if (step === 2 && activeLogIndex >= 0) {
      const log = combatLogs[activeLogIndex];
      if (log.damage > 0 && log.targetId) {
        setVisualHps(prev => ({
          ...prev,
          [log.targetId!]: Math.max(0, (prev[log.targetId!] || 0) - log.damage)
        }));
      }
    } else if (step === 0) {
       // Reset visual HP on step 0
       const initialHps: Record<string, number> = {};
       prevPlayers.forEach((p: any) => initialHps[p.id] = p.hp);
       setVisualHps(initialHps);
    }
  }, [activeLogIndex, step, combatLogs, prevPlayers]);

  // Playback Loop
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
        if (step === 0) {
            // Init -> Move
            timer = setTimeout(() => setStep(1), 500);
        } else if (step === 1) {
            // Move -> Combat
            timer = setTimeout(() => {
                setStep(2);
                setActiveLogIndex(-1);
            }, 1500); 
        } else if (step === 2) {
            // Combat Sequence
            if (activeLogIndex < combatLogs.length - 1) {
                timer = setTimeout(() => {
                    setActiveLogIndex(prev => prev + 1);
                }, playbackSpeed);
            } else {
                // Combat Done -> End
                timer = setTimeout(() => setStep(3), 1000);
            }
        } else if (step === 3) {
            // Stop
            setIsPlaying(false);
        }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, step, activeLogIndex, playbackSpeed, combatLogs.length]);

  // Auto-start
  useEffect(() => {
    const t = setTimeout(() => setIsPlaying(true), 500);
    return () => clearTimeout(t);
  }, []);

  const getPlayerState = (playerId: string) => {
    const start = prevPlayers.find((p: any) => p.id === playerId);
    const end = players.find((p: any) => p.id === playerId);
    return { start, end };
  };

  const renderPlaybackGrid = () => {
    return (
      <div className="relative w-full h-full select-none">
        {/* Base Grid */}
        <div 
          className="grid gap-1 w-full h-full absolute inset-0"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        >
          {activeMap.tiles.map((row: any[], y: number) => 
            row.map((type: TileType, x: number) => {
              let bgClass = 'bg-slate-900/40 border-slate-800/30';
              if (type === TileType.OBSTACLE) bgClass = 'bg-slate-950 border-slate-900';
              if (type === TileType.HIGH_GROUND) bgClass = 'bg-sky-900/10 border-sky-900/20';
              if (type === TileType.TOXIC) bgClass = 'bg-lime-900/10 border-lime-900/20';
              if (type === TileType.DEBRIS) bgClass = 'bg-amber-950/40 border-amber-900/40';
              
              return (
                <div key={`${x}-${y}`} className={`border rounded-sm ${bgClass} flex items-center justify-center relative`}>
                   {type === TileType.OBSTACLE && <div className="w-2 h-2 bg-slate-800 rounded-full"></div>}
                   {type === TileType.DEBRIS && <div className="w-full h-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjY2MyYjViIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]"></div>}
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
           <defs>
              <marker id="arrowHeadRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                 <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
              </marker>
              <marker id="arrowHeadAmber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                 <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
              </marker>
           </defs>

           {/* Active Shot Line (Only during specific log index in Step 2) */}
           {step === 2 && activeLogIndex >= 0 && combatLogs[activeLogIndex] && (() => {
              const log = combatLogs[activeLogIndex];
              if (log.originPoint && log.impactPoint && !log.resultMessage.includes("NEUTRALIZED")) {
                 const x1 = (log.originPoint.x * (100 / GRID_SIZE)) + (50 / GRID_SIZE);
                 const y1 = (log.originPoint.y * (100 / GRID_SIZE)) + (50 / GRID_SIZE);
                 const x2 = (log.impactPoint.x * (100 / GRID_SIZE)) + (50 / GRID_SIZE);
                 const y2 = (log.impactPoint.y * (100 / GRID_SIZE)) + (50 / GRID_SIZE);
                 
                 const color = log.type === ActionType.INTERCEPT ? '#f59e0b' : '#ef4444'; 
                 const marker = log.type === ActionType.INTERCEPT ? 'url(#arrowHeadAmber)' : 'url(#arrowHeadRed)';

                 return (
                    <g key={`shot-${activeLogIndex}`}>
                       <line 
                          x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} 
                          stroke={color} strokeWidth="3" markerEnd={marker} strokeDasharray="4,2"
                          className="animate-draw-line"
                       />
                       <circle cx={`${x1}%`} cy={`${y1}%`} r="2" fill="white" className="animate-ping" />
                       <circle cx={`${x2}%`} cy={`${y2}%`} r="4" fill={color} className="animate-ping [animation-duration:0.5s]" />
                    </g>
                 );
              }
              return null;
           })()}
        </svg>

        {/* Players */}
        {players.map((p: any) => {
           const { start, end } = getPlayerState(p.id);
           if (!start) return null;

           // Visual State Calculation
           const currentPos = step === 0 ? start.position : end.position;
           const isEliminated = end.isEliminated; // Check final state
           
           // Is currently involved in active log?
           const activeLog = (step === 2 && activeLogIndex >= 0) ? combatLogs[activeLogIndex] : null;
           const isTargetOfActive = activeLog?.targetId === p.id;
           const isAttackerOfActive = activeLog?.attackerId === p.id;
           const isNeutralized = activeLog?.resultMessage.includes("NEUTRALIZED") && isAttackerOfActive;
           const damageTaken = isTargetOfActive ? (activeLog.damage || 0) : 0;
           
           // Venting in Step 3
           const ventLog = endLogs.find((l: any) => l.type === ActionType.VENT && l.attackerId === p.id);
           
           // Only show elimination grayscale in step 3 or if they are dead and NOT active
           const showDead = isEliminated && step === 3;

           const xPct = (currentPos.x * (100 / GRID_SIZE));
           const yPct = (currentPos.y * (100 / GRID_SIZE));
           
           const isAI = p.isAI;
           const colorClass = isAI ? 'bg-red-500 border-red-400' : 'bg-teal-500 border-teal-400';
           
           // Determine HP for Bar
           const currentHp = visualHps[p.id] !== undefined ? visualHps[p.id] : start.hp;

           return (
              <div 
                 key={p.id}
                 className={`absolute w-[12%] h-[12%] transition-all duration-700 ease-in-out flex flex-col items-center justify-center z-20 ${showDead ? 'opacity-40 grayscale' : ''}`}
                 style={{ left: `${xPct}%`, top: `${yPct}%`, width: `${100/GRID_SIZE}%`, height: `${100/GRID_SIZE}%` }}
              >
                 {/* Neutralized Text */}
                 {step === 2 && isNeutralized && (
                    <div className="absolute -top-8 bg-black/80 text-slate-400 text-[6px] font-black uppercase px-2 py-1 rounded border border-slate-700 animate-bounce">
                       NEUTRALIZED
                    </div>
                 )}

                 {/* Unit Icon */}
                 <div className={`w-8 h-8 rounded-full border-2 ${colorClass} flex items-center justify-center shadow-lg relative ${damageTaken > 0 ? 'animate-shake-hit' : ''}`}>
                    <span className="text-[8px] font-black text-black">{p.name.slice(0, 2)}</span>
                    
                    {/* Active Action Indicator */}
                    {isAttackerOfActive && !isNeutralized && (
                       <div className="absolute -inset-2 border-2 border-white rounded-full animate-ping opacity-50"></div>
                    )}

                    {/* Damage Popup */}
                    {step === 2 && damageTaken > 0 && (
                       <div className="absolute -top-6 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded animate-bounce z-50 shadow-lg">
                          -{damageTaken}
                       </div>
                    )}
                    
                    {/* Shield Popup */}
                    {step === 2 && isTargetOfActive && activeLog.shield > 0 && (
                       <div className="absolute -bottom-2 -right-2 bg-sky-500 text-black p-1 rounded-full animate-in zoom-in z-50 border border-white">
                          <Shield size={10} />
                       </div>
                    )}

                    {/* Venting Visual */}
                    {step === 3 && ventLog && (
                       <div className="absolute -top-8 flex flex-col items-center animate-float">
                          <Wind size={14} className="text-amber-500 mb-1"/>
                          <div className="text-[8px] font-mono text-amber-500 bg-black/80 px-1 rounded border border-amber-500/30">VENT</div>
                       </div>
                    )}
                 </div>
                 
                 {/* Health Bar (Smoothed via visualHps) */}
                 <div className="w-10 h-1 bg-slate-800 mt-1 rounded-full overflow-hidden border border-black/50">
                    <div 
                       className={`h-full transition-all duration-300 ${p.isAI ? 'bg-red-500' : 'bg-teal-500'}`} 
                       style={{ width: `${(currentHp / p.maxHp) * 100}%` }} 
                    />
                 </div>
              </div>
           );
        })}
      </div>
    );
  };

  const renderLogList = () => (
     <div className="space-y-2 mt-4 relative">
        {resolutionLogs.map((log: any, i: number) => {
           const isIntercept = log.type === ActionType.INTERCEPT;
           const isAttack = log.type === ActionType.ATTACK;
           const isCrit = log.resultMessage.includes('CRIT') || log.damage > 300;
           const isVent = log.type === ActionType.VENT;
           const isActive = i === activeLogIndex && step === 2; // Highlight active log
           
           if (!isAttack && !isIntercept && log.type !== ActionType.BLOCK && log.type !== ActionType.COLLISION && !isVent) return null;

           return (
              <div 
                key={i} 
                className={`p-2 rounded-lg border flex items-center justify-between text-[9px] font-mono transition-all duration-300
                  ${isActive ? 'scale-105 border-white shadow-lg z-10' : 'opacity-80'}
                  ${isIntercept ? 'bg-amber-950/30 border-amber-900/50' : 
                    isCrit ? 'bg-red-950/30 border-red-900/50' : 
                    isVent ? 'bg-amber-900/10 border-amber-800/30 text-amber-500' :
                    'bg-slate-900 border-slate-800'}`}
              >
                 <div className="flex items-center gap-2">
                    {isIntercept ? <Footprints size={12} className="text-amber-500"/> : 
                     isAttack ? <Crosshair size={12} className="text-red-500"/> : 
                     isVent ? <Wind size={12} className="text-amber-500"/> :
                     <Shield size={12} className="text-sky-500"/>}
                    <span className="text-slate-300">{log.resultMessage}</span>
                 </div>
                 {log.damage > 0 && <span className="text-red-400 font-bold">-{log.damage}</span>}
              </div>
           );
        })}
        {resolutionLogs.length === 0 && <div className="text-center text-slate-600 text-[10px] italic py-4">No significant combat events.</div>}
     </div>
  );

  return (
    <ScreenWrapper visualLevel={visualLevel} noScroll centerContent={false}>
      <GlobalHeader phase={Phase.RESOLUTION} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={credits} />
      
      <div className="flex-1 flex flex-col p-4 w-full max-w-lg mx-auto">
         {/* Phase Indicator */}
         <div className="flex justify-between items-center mb-4 px-2">
            <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">TACTICAL REPLAY // CYCLE {round-1}</div>
            <div className="flex gap-1">
               {[0, 1, 2, 3].map(s => (
                  <div key={s} className={`w-8 h-1 rounded-full transition-colors ${step >= s ? 'bg-teal-500' : 'bg-slate-800'}`}></div>
               ))}
            </div>
         </div>

         {/* The Map */}
         <div className={`aspect-square w-full bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden shadow-2xl mb-4 transition-all ${step === 2 && activeLogIndex >= 0 && combatLogs[activeLogIndex]?.damage > 300 ? 'animate-shake-hit ring-2 ring-red-500/50' : ''}`}>
            {renderPlaybackGrid()}
            
            {/* Overlay Text for Phase */}
            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[8px] font-mono text-white backdrop-blur-sm border border-white/10">
               {step === 0 ? "INIT_STATE" : step === 1 ? "MOVEMENT_PHASE" : step === 2 ? `ACTION_PHASE [${activeLogIndex + 1}/${combatLogs.length}]` : "IMPACT_RESOLVED"}
            </div>
         </div>

         {/* Controls */}
         <div className="flex gap-2 mb-4">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setStep(0); setIsPlaying(true); }}>
               <RotateCcw size={14} /> REPLAY
            </Button>
            <Button variant={isPlaying ? 'secondary' : 'primary'} size="sm" className="flex-1" onClick={() => setIsPlaying(!isPlaying)}>
               {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? 'PAUSE' : 'PLAY'}
            </Button>
         </div>

         {/* Logs Scroll */}
         <div className="flex-1 bg-black/20 rounded-xl border border-slate-800/50 p-2 overflow-y-auto custom-scrollbar min-h-0">
            {renderLogList()}
         </div>

         {/* Continue Button */}
         <div className="mt-4 pt-4 border-t border-slate-800">
            <Button variant="primary" size="lg" className="w-full py-4 shadow-xl" onClick={() => { if(tutorial.isActive && tutorial.step === 6) game.completeTutorial(); nextTurn(); }}>
               NEXT CYCLE <ChevronRight size={16} />
            </Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};
