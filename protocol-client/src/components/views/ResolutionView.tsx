import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { 
  ChevronRight, ChevronLeft, Play, Pause, SkipBack, SkipForward, Clock, Activity
} from 'lucide-react';
import { Phase, ActionType, VisualLevel, TileType } from '../../shared/types';
import { GRID_SIZE } from '../../shared/constants';

interface ResolutionViewProps {
  players: any[];
  prevPlayers: any[];
  activeMap: any;
  resolutionLogs: any[]; // Ordered sequence of actions
  round: number;
  onResolutionComplete: () => void;
  visualLevel?: VisualLevel;
  credits?: number;
  onHelp?: () => void;
  onSettings?: () => void;
  isMultiplayer?: boolean;
  timeLimit?: number; // seconds
  isResolving?: boolean;
}

export const ResolutionView: React.FC<ResolutionViewProps> = ({ 
  players, 
  prevPlayers, 
  activeMap, 
  resolutionLogs, 
  round, 
  onResolutionComplete,
  visualLevel = VisualLevel.LOW,
  credits = 0,
  onHelp = () => {},
  onSettings = () => {},
  isMultiplayer = false,
  timeLimit = 30,
  isResolving = false
}) => {
  // Index into resolutionLogs; -1 = before any action
  const [actionIndex, setActionIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [visualHps, setVisualHps] = useState<Record<string, number>>({});

  // Multiplayer timer
  const [secondsLeft, setSecondsLeft] = useState<number>(timeLimit);
  const timerRef = useRef<number | null>(null);

  // Recompute initial HPs when prevPlayers change
  const prevPlayersSafe = (prevPlayers && prevPlayers.length > 0) ? prevPlayers : players;

  useEffect(() => {
    const initial: Record<string, number> = {};
    prevPlayersSafe?.forEach((p: any) => initial[p.id] = p.hp);
    setVisualHps(initial);
    setActionIndex(-1);
    // Autoplay the resolution when it first appears or when prevPlayers change
    setIsPlaying(resolutionLogs && resolutionLogs.length > 0);
    // Use a 15 second resolution timer for multiplayer
    setSecondsLeft(isMultiplayer ? 15 : timeLimit);
  }, [prevPlayersSafe, timeLimit, resolutionLogs, isMultiplayer]);

  // Apply actions up to current actionIndex to compute visual HPs
  useEffect(() => {
    const base: Record<string, number> = {};
    prevPlayersSafe?.forEach((p: any) => base[p.id] = p.hp);

    for (let i = 0; i <= actionIndex; i++) {
      const log = resolutionLogs[i];
      if (!log) continue;
      // Apply damage if present
      if ((log.type === ActionType.ATTACK || log.type === ActionType.INTERCEPT) && log.targetId) {
        base[log.targetId] = Math.max(0, (base[log.targetId] || 0) - (log.damage || 0));
      }
      // Other action types could modify hp/states - extend here if needed
    }

    setVisualHps(base);
  }, [actionIndex, resolutionLogs, prevPlayersSafe]);

  // Auto-play handler (manual playback through actions)
  useEffect(() => {
    if (!isPlaying) return;
    if (actionIndex >= resolutionLogs.length - 1) {
      setIsPlaying(false);
      return;
    }

    const id = window.setTimeout(() => setActionIndex(i => Math.min(i + 1, resolutionLogs.length - 1)), 700);
    return () => clearTimeout(id);
  }, [isPlaying, actionIndex, resolutionLogs.length]);

  // Multiplayer countdown (auto-advance to next round when finished)
  useEffect(() => {
    if (!isMultiplayer) return;
    // Start countdown only if resolving is true
    if (!isResolving) return;

    if (timerRef.current) window.clearInterval(timerRef.current);
    // Fixed 15s for resolution display timer
    setSecondsLeft(15);
    timerRef.current = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          // Auto-advance
          onResolutionComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isMultiplayer, isResolving, onResolutionComplete]);

  const getPlayerState = (playerId: string) => {
    const start = prevPlayersSafe.find((p: any) => p.id === playerId) || players.find((p: any) => p.id === playerId);
    const end = players.find((p: any) => p.id === playerId) || prevPlayersSafe.find((p: any) => p.id === playerId);
    return { start, end };
  };

  const renderGrid = () => {
    // Support two tile shapes: row.columns or row as array
    const rows = activeMap?.tiles || [];
    const cols = GRID_SIZE;

    // Small emoji mapping for each tile type
    const tileEmoji = (tt: number) => {
      switch (tt) {
        case TileType.OBSTACLE: return '🧱';
        case TileType.HIGH_GROUND: return '⛰️';
        case TileType.TOXIC: return '☣️';
        case TileType.THRESHOLD: return '🚩';
        case TileType.DEBRIS: return '🪨';
        default: return '▫️';
    }
    };

    return (
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-950/70">
        <div className="grid gap-[1px] sm:gap-1 w-full h-full absolute inset-0 bg-slate-800/40 p-[1px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {rows.map((row: any, y: number) => (
          (row?.columns || row).map((type: number, x: number) => {
            const t = typeof type === 'number' ? type : 0;
            const classes = ["rounded-[2px] sm:rounded-sm relative flex items-center justify-center text-[10px] sm:text-[11px] font-black"];
            // Distinguish tiles visually
            if (t === TileType.EMPTY) classes.push('bg-slate-950/30');
            else if (t === TileType.OBSTACLE) classes.push('bg-slate-700/90 shadow-inner');
            else if (t === TileType.HIGH_GROUND) classes.push('bg-yellow-700/20 ring-1 ring-yellow-700/30');
            else if (t === TileType.TOXIC) classes.push('bg-rose-900/35 ring-1 ring-rose-500/25');
            else if (t === TileType.THRESHOLD) classes.push('bg-amber-800/20 ring-1 ring-amber-500/30');
            else if (t === TileType.DEBRIS) classes.push('bg-slate-800/35 ring-1 ring-slate-500/20');

            return (
              <div key={`${x}-${y}`} className={`${classes.join(' ')} w-full h-full`}>
                <span className="opacity-80 select-none leading-none">{tileEmoji(t)}</span>
              </div>
            );
          })
        ))}
        </div>
      </div>
    );
  };

  const activeAction = resolutionLogs[actionIndex] || null;
  const totalActions = resolutionLogs.length;

  // Back button should go to action 0 first when stepping backwards
  const handlePrev = () => setActionIndex(i => (i <= 0 ? 0 : i - 1));
  const handleNext = () => setActionIndex(i => Math.min(totalActions - 1, i + 1));
  const handleJumpTo = (i: number) => setActionIndex(Math.max(-1, Math.min(totalActions - 1, i)));

  return (
    <ScreenWrapper visualLevel={visualLevel} noScroll centerContent={false}>
      <GlobalHeader 
        phase={Phase.RESOLUTION} 
        credits={credits} 
        onExit={() => {}} 
        onHelp={onHelp}
        onSettings={onSettings}
      />

      <div className="flex-1 flex flex-col p-3 sm:p-4 w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="text-[10px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest">REPLAY CYCLE {round - 1}</div>
          <div className="flex items-center gap-3">
            {isMultiplayer && (
              <div className="flex items-center gap-2 text-[12px] font-mono text-slate-300">
                <Clock size={14} /> <span>{secondsLeft}s</span>
              </div>
            )}
            <div className="text-[12px] font-mono text-slate-400 whitespace-nowrap">Action {Math.max(0, actionIndex + 1)}/{totalActions}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* MAP + Players */}
          <div className="aspect-square bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden shadow-2xl">
            {renderGrid()}

            {/* Action SVG (draw current action arrow if available) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {activeAction && activeAction.originPoint && activeAction.impactPoint && (
                (() => {
                  const log = activeAction;
                  const x1 = (log.originPoint.x * (100 / GRID_SIZE)) + (50 / GRID_SIZE);
                  const y1 = (log.originPoint.y * (100 / GRID_SIZE)) + (50 / GRID_SIZE);
                  const x2 = (log.impactPoint.x * (100 / GRID_SIZE)) + (50 / GRID_SIZE);
                  const y2 = (log.impactPoint.y * (100 / GRID_SIZE)) + (50 / GRID_SIZE);
                  return (
                    <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke={log.type === ActionType.INTERCEPT ? '#f59e0b' : '#ef4444'} strokeWidth="2" strokeDasharray="6,4" className="animate-pulse" />
                  );
                })()
              )}
            </svg>

            {/* Players Layer */}
            {players.map((p: any) => {
              const { start, end } = getPlayerState(p.id);
              if (!start || !end) return null;

              // Interpolate position if we wanted smooth movement; for now snap to end when actionIndex >= 0
              const pos = actionIndex >= 0 ? end.position : start.position;

              const isTarget = activeAction?.targetId === p.id;

              return (
                <div key={p.id} className="absolute transition-all duration-300 flex flex-col items-center justify-center z-20"
                  style={{ left: `${(pos.x * 100) / GRID_SIZE}%`, top: `${(pos.y * 100) / GRID_SIZE}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}>
                  <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center bg-slate-900/80 backdrop-blur ${isTarget ? 'ring-2 ring-red-500 scale-110' : 'border-teal-500'}`}>
                    <span className="text-[9px] sm:text-[9px] font-bold">{p.name.slice(0,2)}</span>
                  </div>
                  <div className="w-10 sm:w-12 h-2 bg-black/70 mt-1.5 sm:mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${((visualHps[p.id] || 0) / p.maxHp) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls & Logs */}
          <div className="flex flex-col gap-3">
            <div className="bg-black/40 border border-slate-800 rounded-xl p-2 sm:p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsPlaying(false); handlePrev(); }} className="p-2.5 sm:p-2 rounded-md hover:bg-slate-800 active:bg-slate-800/80">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setIsPlaying(p => !p)} className="p-2.5 sm:p-2 rounded-md hover:bg-slate-800 active:bg-slate-800/80">
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={() => { setIsPlaying(false); handleNext(); }} className="p-2.5 sm:p-2 rounded-md hover:bg-slate-800 active:bg-slate-800/80">
                  <ChevronRight size={18} />
                </button>
                <div className="ml-3 text-[12px] font-mono text-slate-300">{actionIndex < 0 ? 'Start' : `Action ${actionIndex + 1}/${totalActions}`}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => { setIsPlaying(false); handleJumpTo(0); }} className="p-2.5 sm:p-2 rounded-md hover:bg-slate-800 active:bg-slate-800/80"><SkipBack size={16} /></button>
                <button onClick={() => { setIsPlaying(false); handleJumpTo(totalActions - 1); }} className="p-2.5 sm:p-2 rounded-md hover:bg-slate-800 active:bg-slate-800/80"><SkipForward size={16} /></button>
              </div>
            </div>

            <div className="flex-1 bg-black/40 rounded-xl border border-slate-800 p-2.5 sm:p-3 overflow-y-auto custom-scrollbar space-y-2">
              {resolutionLogs.length === 0 && (
                isMultiplayer && isResolving ? (
                  <div className="text-slate-400 text-sm font-mono flex items-center gap-2"><Activity className="animate-spin text-sky-400" size={14} /> Awaiting server resolution...</div>
                ) : (
                  <div className="text-slate-400 text-sm font-mono">No actions to display.</div>
                )
              )}
              {resolutionLogs.map((log: any, i: number) => {
                const actor = players.find((pl: any) => pl.id === log.attackerId)?.name || log.attackerName || 'SYSTEM';
                const target = players.find((pl: any) => pl.id === log.targetId)?.name || log.targetName || '';
                const damage = log.damage ? ` -${log.damage} HP` : '';

                return (
                  <div key={i} onClick={() => { setIsPlaying(false); handleJumpTo(i); }}
                    className={`p-2.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${i === actionIndex ? 'bg-slate-800 border border-white/70' : 'hover:bg-slate-900/60 active:bg-slate-900/80'}`}>
                    <div className="flex justify-between items-center">
                      <div className="text-[12px] font-black uppercase text-slate-200">{log.type}</div>
                      <div className="text-[11px] font-mono text-slate-400">{i + 1}</div>
                    </div>
                    <div className="text-[12px] font-mono text-slate-300 mt-1">{actor}{target ? ` → ${target}` : ''}{damage}</div>
                    {log.resultMessage && <div className="text-[11px] text-slate-500 font-mono mt-1">{log.resultMessage}</div>}
                  </div>
                );
              })}

              {/* Legend */}
              <div className="mt-3 pt-2 border-t border-slate-800 text-[12px] text-slate-300 font-mono flex items-center gap-3">
                <div className="flex items-center gap-2"><span>▫️</span><span className="text-slate-400">Empty</span></div>
                <div className="flex items-center gap-2"><span>🧱</span><span className="text-slate-400">Obstacle</span></div>
                <div className="flex items-center gap-2"><span>⛰️</span><span className="text-slate-400">High</span></div>
                <div className="flex items-center gap-2"><span>☣️</span><span className="text-slate-400">Toxic</span></div>
                <div className="flex items-center gap-2"><span>🚩</span><span className="text-slate-400">Threshold</span></div>
                <div className="flex items-center gap-2"><span>🪨</span><span className="text-slate-400">Debris</span></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isMultiplayer && (
                <Button variant="primary" className="flex-1 py-3" onClick={() => onResolutionComplete()}>
                  NEXT ROUND <ChevronRight size={16} className="ml-2" />
                </Button>
              )}

              {isMultiplayer && (
                <div className="flex-1 text-[12px] font-mono text-slate-400">Waiting for server... Auto-advances in {secondsLeft}s</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};