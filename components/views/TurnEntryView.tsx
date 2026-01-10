
import React, { useState, useRef, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Shield, Skull, ChevronUp, Brain, Zap, Activity, Heart, Move, CornerUpLeft, Trash2, Target, Ban, AlertTriangle, Minus, Plus } from 'lucide-react';
import { BASE_ATTACK_DMG, ATTACK_CONFIG, BLOCK_CONFIG, BASE_MOVE_COST } from '../../constants';
import { Phase, ActionType, UnitType, Position, TileType, DamageType } from '../../types';
import { TacticalGrid } from '../tactical/TacticalGrid';
import { getReachableTiles, getManhattanDistance, getObstaclesInLine, ReachableTile } from '../../utils/gridLogic';
import { calculateIncome, ROLLOVER_CAP } from '../../apManager';

interface TurnEntryViewProps {
  game: any;
}

interface PathNode extends Position {
  cost: number;
}

export const TurnEntryView: React.FC<TurnEntryViewProps> = ({ game }) => {
  const { playSfx, credits, submitAction, tutorial, advanceTutorial, distanceMatrix } = game;
  const p = game.players[game.currentPlayerIdx];
  const otherPlayers = game.players.filter((x: any) => x.id !== p.id && !x.isEliminated);
  
  const [localBlockTier, setLocalBlockTier] = useState(0); 
  const [localAttackTier, setLocalAttackTier] = useState(0); 
  
  const [localMovePath, setLocalMovePath] = useState<PathNode[]>([]);
  const [localMoveAp, setLocalMoveAp] = useState(0);
  
  const [localAbilityActive, setLocalAbilityActive] = useState(false);
  const [localTargetId, setLocalTargetId] = useState<string | undefined>(otherPlayers[0]?.id);
  const [moveMode, setMoveMode] = useState(false); 
  
  const [isSheetExpanded, setIsSheetExpanded] = useState(true); 
  const touchStartY = useRef(0);

  useEffect(() => {
    if (moveMode) setIsSheetExpanded(false);
  }, [moveMode]);

  // Loadout Stats
  const primary = p.loadout?.primary;
  const unitRange = primary?.range ?? (p.unit?.range || 2);
  const damageType = primary?.damageType ?? DamageType.KINETIC;
  const weightMod = (primary?.weight || 0);
  const baseSpeed = p.unit?.speed || 1.0;
  const finalSpeed = baseSpeed + (weightMod * 0.1);

  // @ts-ignore
  const attackConfig = localAttackTier > 0 ? ATTACK_CONFIG[localAttackTier] : null;
  const attackCost = attackConfig ? attackConfig.ap : 0;
  // @ts-ignore
  const blockConfig = localBlockTier > 0 ? BLOCK_CONFIG[localBlockTier] : null;
  const blockCost = blockConfig ? blockConfig.ap : 0;
  
  const availableAp = p.ap - blockCost - attackCost;
  const totalSpent = blockCost + attackCost + localMoveAp;
  const remainingAp = p.ap - totalSpent;
  const availableApForNextMove = remainingAp;

  // Predict Venting
  const { vented } = calculateIncome(remainingAp, game.round + 1);

  const targetPlayer = localTargetId ? game.players.find((pl: any) => pl.id === localTargetId) : undefined;
  
  const currentStartPos = localMovePath.length > 0 ? localMovePath[localMovePath.length - 1] : p.position;
  
  const occupied = game.players
    .filter((pl: any) => pl.id !== p.id && !pl.isEliminated)
    .map((pl: any) => pl.position);

  // STRIDE REMOVED: Now passes direct params
  const reachableTiles = moveMode 
    ? getReachableTiles(currentStartPos, availableApForNextMove, game.activeMap, occupied, finalSpeed) 
    : [];

  const handleTileClick = (pos: Position) => {
    if (!moveMode) return;
    const tile = reachableTiles.find(r => r.x === pos.x && r.y === pos.y);
    if (tile && tile.costInAp <= availableApForNextMove) {
      setLocalMovePath([...localMovePath, { x: pos.x, y: pos.y, cost: tile.costInAp }]);
      setLocalMoveAp(prev => prev + tile.costInAp);
      playSfx('confirm');
    }
  };

  const toggleMoveMode = () => {
    setMoveMode(!moveMode);
    playSfx('confirm');
  };

  const handleUndoLastMove = () => {
    if (localMovePath.length === 0) return;
    const lastNode = localMovePath[localMovePath.length - 1];
    setLocalMoveAp(prev => Math.max(0, prev - lastNode.cost));
    setLocalMovePath(prev => prev.slice(0, -1));
    playSfx('cancel');
  };

  const handleClearMove = () => {
      setLocalMovePath([]);
      setLocalMoveAp(0);
      playSfx('cancel');
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) setIsSheetExpanded(true); 
      else setIsSheetExpanded(false); 
    }
  };

  const calculateShield = () => {
    if (localBlockTier === 0) return 0;
    // @ts-ignore
    const base = BLOCK_CONFIG[localBlockTier].base * (p.unit?.defStat || 1.0);
    const currentOverheat = p.blockFatigue || 0;
    const penalty = Math.min(0.9, currentOverheat * 0.15);
    return Math.floor(base * (1 - penalty));
  };

  const dmgColor = damageType === DamageType.KINETIC ? 'text-amber-400' : damageType === DamageType.ENERGY ? 'text-teal-400' : 'text-red-500';

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

  // Helper for Segmented Bar (50 AP scale)
  const renderApBar = () => {
      const segments = 10; // 5 AP per segment
      
      return (
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 mt-1">
              {Array.from({length: segments}).map((_, i) => {
                  const segVal = (i + 1) * 5;
                  const isActive = remainingAp >= segVal;
                  const isVented = remainingAp > ROLLOVER_CAP && segVal > ROLLOVER_CAP; // Visual warning for vent
                  return (
                      <div key={i} className={`flex-1 transition-colors ${isActive ? (remainingAp < 0 ? 'bg-red-500' : 'bg-teal-500') : 'bg-transparent'}`}></div>
                  );
              })}
          </div>
      );
  };

  return (
    <ScreenWrapper visualLevel={game.visualLevel} className="bg-[#020617]" noScroll centerContent={false}>
      <GlobalHeader phase={Phase.TURN_ENTRY} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={credits} xp={game.xp} />
      
      <div className="flex-1 w-full bg-[#050b14] relative overflow-hidden flex flex-col items-center pt-4">
          <TacticalGrid 
            map={game.activeMap}
            players={game.players}
            currentPlayerId={p.id}
            reachableTiles={reachableTiles} 
            selectedDest={currentStartPos} 
            onTileClick={handleTileClick}
            targetId={localAttackTier > 0 ? localTargetId : undefined}
          />
          {localMovePath.length > 0 && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none z-30">
                {localMovePath.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>)}
             </div>
          )}
      </div>

      <div 
         className={`absolute bottom-0 left-0 right-0 bg-[#0a0f1e]/95 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.6)] border-t border-slate-700/50 z-20 transition-all duration-500 ease-out flex flex-col`}
         style={{ height: isSheetExpanded ? '70%' : '25%' }}
      >
         <div 
            className="w-full shrink-0 pt-4 pb-2 px-6 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
         >
            <div className="w-16 h-1.5 bg-slate-700/50 rounded-full mx-auto mb-2"></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                      <Heart size={20} />
                   </div>
                   <div>
                      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Integrity</div>
                      <div className="text-xl font-black text-white italic">{p.hp} <span className="text-sm not-italic text-slate-600 font-normal">/ {p.maxHp}</span></div>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-2">
                      <div className={`text-xl font-black italic ${remainingAp < 0 ? 'text-red-500 animate-pulse' : 'text-teal-400'}`}>
                         {remainingAp} AP
                      </div>
                      <Zap size={16} className="text-teal-400"/>
                   </div>
                   <div className="w-32">{renderApBar()}</div>
                   {vented > 0 && <div className="text-[8px] text-amber-500 font-mono mt-1 flex items-center gap-1"><AlertTriangle size={8}/> -{vented} VENT WARNING</div>}
                </div>
            </div>
         </div>

         <div className={`flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 space-y-4 transition-opacity duration-300 ${isSheetExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            
            {/* Action Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Move Card */}
                <button 
                  onClick={toggleMoveMode}
                  className={`p-4 rounded-[2rem] border transition-all text-left flex flex-col justify-between h-32 ${moveMode ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-900/40 border-slate-800'}`}
                >
                   <div className="flex justify-between items-start w-full">
                      <Move size={20} className={moveMode ? 'text-sky-400' : 'text-slate-600'} />
                      {localMoveAp > 0 && <div className="text-[9px] font-mono uppercase text-sky-400 font-bold">{localMoveAp} AP</div>}
                   </div>
                   <div>
                      <div className="text-xs font-black uppercase text-white italic">MANEUVER</div>
                      <div className="text-[8px] text-slate-500 mt-1">Cost: ~{Math.round(BASE_MOVE_COST / finalSpeed)} AP/Tile</div>
                      {localMovePath.length > 0 && (
                         <div className="flex items-center gap-2 mt-2">
                            <span onClick={(e) => { e.stopPropagation(); handleUndoLastMove(); }} className="h-6 w-6 flex items-center justify-center bg-slate-800 rounded hover:bg-slate-700 cursor-pointer"><CornerUpLeft size={12}/></span>
                            <span onClick={(e) => { e.stopPropagation(); handleClearMove(); }} className="h-6 w-6 flex items-center justify-center bg-red-950/30 text-red-500 rounded hover:bg-red-900/50 cursor-pointer"><Trash2 size={12}/></span>
                         </div>
                      )}
                   </div>
                </button>

                {/* Defense Card */}
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-[2rem] flex flex-col justify-between h-32">
                   <div className="flex justify-between items-start">
                      <Shield size={20} className={localBlockTier > 0 ? 'text-teal-400' : 'text-slate-600'} />
                      {localBlockTier > 0 && <div className="text-[9px] font-mono uppercase text-slate-400">{blockCost} AP</div>}
                   </div>
                   <div className="flex items-center justify-between gap-2 mt-2">
                      <button onClick={() => setLocalBlockTier(Math.max(0, localBlockTier - 1))} className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700"><Minus size={14}/></button>
                      <span className="text-xl font-black text-white">{localBlockTier}</span>
                      <button onClick={() => setLocalBlockTier(Math.min(3, localBlockTier + 1))} className="h-8 w-8 rounded-lg bg-teal-500 text-black flex items-center justify-center hover:bg-teal-400"><Plus size={14}/></button>
                   </div>
                   <div className="text-[8px] font-mono text-slate-500 uppercase text-center">{localBlockTier > 0 ? `${blockConfig?.name} (${calculateShield()} HP)` : 'No Defense'}</div>
                </div>
            </div>

            {/* Offense Card */}
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-[2rem] space-y-3">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <Skull size={20} className={localAttackTier > 0 ? dmgColor : 'text-slate-600'} />
                     <div className="flex flex-col">
                        <span className="text-xs font-black uppercase text-white italic">{primary?.name || "STD. ISSUE"}</span>
                        <span className={`text-[8px] font-mono uppercase ${dmgColor}`}>{damageType} /// RNG: {unitRange}</span>
                     </div>
                  </div>
                  {localAttackTier > 0 && <div className="text-[9px] font-mono uppercase text-slate-400">{attackCost} AP</div>}
               </div>
               
               <div className="flex items-center gap-4">
                  <button onClick={() => setLocalAttackTier(Math.max(0, localAttackTier - 1))} className="h-10 w-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700"><Minus size={16}/></button>
                  <div className="flex-1 text-center bg-black/20 rounded-xl py-2">
                     <span className={`text-xl font-black ${localAttackTier > 0 ? 'text-red-500' : 'text-slate-600'}`}>TIER {localAttackTier}</span>
                     <div className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">{attackConfig?.name || "IDLE"}</div>
                  </div>
                  <button onClick={() => setLocalAttackTier(Math.min(3, localAttackTier + 1))} className="h-10 w-12 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-400"><Plus size={16}/></button>
               </div>

               {/* Target Selector */}
               {localAttackTier > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                     {otherPlayers.map((t: any) => (
                        <button 
                           key={t.id} 
                           onClick={() => { setLocalTargetId(t.id); playSfx('confirm'); }} 
                           className={`flex-1 min-w-[100px] p-3 rounded-xl border transition-all text-left relative overflow-hidden 
                             ${localTargetId === t.id ? 'bg-red-500/10 border-red-500/50' : 'bg-black/20 border-slate-800'}`}
                        >
                           <div className="text-[9px] font-black uppercase text-white truncate relative z-10">{t.name}</div>
                           <div className="text-[8px] font-mono mt-1 relative z-10 text-slate-500">{t.hp} HP</div>
                           {localTargetId === t.id && <div className="absolute top-1 right-1"><Target size={10} className="text-red-500 animate-pulse"/></div>}
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>

         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e] to-transparent z-30">
            <Button 
               variant={remainingAp >= 0 ? (totalSpent === 0 ? 'amber' : 'primary') : 'secondary'} 
               size="lg" className="w-full py-4 text-lg shadow-2xl"
               onClick={() => {
                 const finalMoveDest = localMovePath.length > 0 ? localMovePath[localMovePath.length - 1] : undefined;
                 submitAction({ 
                    blockAp: localBlockTier, attackAp: localAttackTier, moveAp: localMoveAp,
                    movePath: localMovePath.map(p => ({ x: p.x, y: p.y })),
                    abilityActive: localAbilityActive, targetId: localTargetId, moveDest: finalMoveDest
                 });
               }}
               disabled={remainingAp < 0 || (moveMode && localMovePath.length === 0)}
            >
               {remainingAp < 0 ? 'OVER_BUDGET' : moveMode && localMovePath.length === 0 ? 'PLOT_COURSE' : 'EXECUTE'}
            </Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};
