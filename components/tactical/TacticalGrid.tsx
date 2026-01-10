
import React from 'react';
import { GridMap, Player, Position, TileType, UnitType } from '../../types';
import { GRID_SIZE, TILE_COSTS } from '../../constants';
import { Ghost, Shield, Zap, Skull, Mountain, Skull as ToxicIcon, Ban, Target, Crosshair } from 'lucide-react';
import { ReachableTile, getManhattanDistance } from '../../utils/gridLogic';

interface TacticalGridProps {
  map: GridMap;
  players: Player[];
  currentPlayerId: string;
  reachableTiles: ReachableTile[];
  selectedDest?: Position;
  onTileClick: (pos: Position) => void;
  targetId?: string;
  firingLine?: { start: Position, end: Position };
}

export const TacticalGrid: React.FC<TacticalGridProps> = ({ 
  map, players, currentPlayerId, reachableTiles, selectedDest, onTileClick, targetId, firingLine
}) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const targetPlayer = players.find(p => p.id === targetId);
  
  // Calculate Attack Range Context
  const rangeOrigin = selectedDest || currentPlayer?.position;
  const attackRange = currentPlayer?.unit?.range ?? 2; // Default to 2

  const renderTileContent = (x: number, y: number, type: TileType) => {
    // Check for player
    const pOnTile = players.find(p => p.position.x === x && p.position.y === y && !p.isEliminated);
    
    if (pOnTile) {
       const isMe = pOnTile.id === currentPlayerId;
       const isTarget = pOnTile.id === targetId;
       const color = isMe ? 'text-teal-400' : isTarget ? 'text-red-500' : 'text-slate-400';
       
       return (
         <div className={`flex flex-col items-center justify-center w-full h-full relative z-10 ${isTarget ? 'animate-pulse' : ''}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-slate-900 ${isMe ? 'border-teal-500' : isTarget ? 'border-red-500' : 'border-slate-600'}`}>
               <Ghost size={16} className={color} />
            </div>
            {isMe && <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full border border-black"></div>}
         </div>
       );
    }

    switch (type) {
      case TileType.OBSTACLE: 
        return <div className="w-full h-full bg-slate-800 flex items-center justify-center border border-slate-700"><Ban size={16} className="text-slate-600"/></div>;
      case TileType.HIGH_GROUND:
        return <div className="w-full h-full bg-slate-900/80 flex items-center justify-center border border-sky-900/50"><Mountain size={14} className="text-sky-600"/></div>;
      case TileType.TOXIC:
        return <div className="w-full h-full bg-lime-950/30 flex items-center justify-center border border-lime-900/30"><ToxicIcon size={14} className="text-lime-700"/></div>;
      case TileType.THRESHOLD:
        return (
          <div className="w-full h-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 relative">
             <div className="absolute inset-2 border-2 border-amber-500/50 rounded-full animate-ping opacity-20"></div>
             <Target size={14} className="text-amber-500"/>
          </div>
        );
      default: return null;
    }
  };

  // Helper to convert grid coord to percentage for SVG line
  const getCenterPct = (val: number) => (val * (100 / GRID_SIZE)) + (100 / GRID_SIZE / 2);

  return (
    <div className="relative p-4 select-none">
      <div 
        className="grid gap-1 relative"
        style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          width: 'min(90vw, 400px)',
          height: 'min(90vw, 400px)'
        }}
      >
        {/* Firing Line Layer */}
        {firingLine && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
              </marker>
            </defs>
            <line 
              x1={`${getCenterPct(firingLine.start.x)}%`} 
              y1={`${getCenterPct(firingLine.start.y)}%`} 
              x2={`${getCenterPct(firingLine.end.x)}%`} 
              y2={`${getCenterPct(firingLine.end.y)}%`} 
              stroke="#ef4444" 
              strokeWidth="2" 
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead)"
              className="opacity-60 animate-pulse"
            />
          </svg>
        )}

        {map.tiles.map((row, y) => (
          row.map((type, x) => {
            const reachInfo = reachableTiles.find(p => p.x === x && p.y === y);
            const isReachable = !!reachInfo;
            const isSelected = selectedDest?.x === x && selectedDest?.y === y;
            const isCurrentPos = currentPlayer?.position.x === x && currentPlayer?.position.y === y;
            
            // Attack Range Calculation
            const dist = rangeOrigin ? getManhattanDistance(rangeOrigin, {x, y}) : 999;
            const inAttackRange = dist <= attackRange;

            let bgClass = 'bg-slate-900/40';
            if (type === TileType.OBSTACLE) bgClass = 'bg-slate-950';
            if (type === TileType.HIGH_GROUND) bgClass = 'bg-sky-900/10';
            if (type === TileType.TOXIC) bgClass = 'bg-lime-900/5';
            if (type === TileType.THRESHOLD) bgClass = 'bg-amber-900/20';
            
            // Movement Cost Visualization
            if (isReachable) {
                if (reachInfo.costInAp === 1) bgClass = 'bg-emerald-500/20 cursor-pointer hover:bg-emerald-500/30 border-emerald-500/30';
                else if (reachInfo.costInAp === 2) bgClass = 'bg-amber-500/20 cursor-pointer hover:bg-amber-500/30 border-amber-500/30';
                else bgClass = 'bg-orange-600/20 cursor-pointer hover:bg-orange-600/30 border-orange-500/30';
            }

            if (isSelected) bgClass = 'bg-sky-500/50 border-sky-400';

            return (
              <div 
                key={`${x}-${y}`}
                onClick={() => onTileClick({x, y})}
                className={`relative border rounded-lg overflow-hidden transition-all flex items-center justify-center ${bgClass} ${isSelected ? '' : 'border-slate-800/50'}`}
              >
                 {/* Attack Range Indicator Overlay */}
                 {inAttackRange && !isSelected && type !== TileType.OBSTACLE && (
                    <div className="absolute inset-0 pointer-events-none z-0">
                       <div className="absolute inset-0 ring-1 ring-red-500/20 ring-inset"></div>
                       {/* Optional corner markers for aesthetic */}
                       <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-red-500/40"></div>
                       <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-red-500/40"></div>
                    </div>
                 )}

                 {renderTileContent(x, y, type)}
                 
                 {/* Cost Marker */}
                 {isReachable && !isSelected && !isCurrentPos && (
                    <div className="absolute bottom-0.5 right-1 text-[8px] font-black text-white/50">{reachInfo.costInAp}</div>
                 )}

                 {/* Selection Marker */}
                 {isSelected && (
                   <div className="absolute inset-0 border-2 border-sky-400 rounded-lg animate-pulse pointer-events-none"></div>
                 )}
              </div>
            );
          })
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 text-[9px] font-mono text-slate-500 uppercase flex-wrap">
         <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500/50"></div> 1 AP</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500/50"></div> 2 AP</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 border border-red-500/40"></div> Range</div>
         <div className="flex items-center gap-1"><Target size={10} className="text-amber-500"/> Capture</div>
      </div>
    </div>
  );
};
