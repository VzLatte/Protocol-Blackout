
import React, { useState, useRef, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Shield, Skull, ChevronUp, Brain, Zap, Activity, Heart, ChevronRight, Minus, Plus, Move, Undo, Target } from 'lucide-react';
import { BASE_ATTACK_DMG, ATTACK_CONFIG, BLOCK_CONFIG, DESPERATION_MOVES } from '../../constants';
import { Phase, ActionType, UnitType, Position, TileType } from '../../types';
import { TacticalGrid } from '../tactical/TacticalGrid';
import { getStride, getReachableTiles, getManhattanDistance, getObstaclesInLine, ReachableTile } from '../../utils/gridLogic';

interface TurnEntryViewProps {
  game: any;
}

const TutorialOverlay: React.FC<{ step: number, onNext: () => void }> = ({ step, onNext }) => {
  const content = [
    {
      title: "TACTICAL BRIEFING",
      text: "Welcome to PROTOCOL. Your goal is to eliminate the enemy operative before they eliminate you.",
      position: "top-1/4"
    },
    {
      title: "ENERGY MANAGEMENT",
      text: "This is your AP (Action Points). You gain +2 AP every round. Moving, Attacking, and Defending all cost AP. Don't run out.",
      position: "bottom-1/3" // Near the AP bar
    },
    {
      title: "MANEUVERING",
      text: "Select 'MANEUVER' to move on the grid. Spend AP to move further. Flanking your enemy increases damage.",
      position: "bottom-1/4"
    },
    {
      title: "COMBAT PROTOCOLS",
      text: "Select 'WEAPON SYSTEMS' to attack. Closer range deals more damage. Higher tiers cost more AP but deal massive damage.",
      position: "bottom-1/4"
    },
    {
      title: "DEFENSE MATRIX",
      text: "If you end your turn with unspent AP, it won't save you from a bullet. Use 'SHIELD' to block incoming damage.",
      position: "bottom-1/4"
    },
    {
      title: "EXECUTE",
      text: "Turns happen simultaneously. Plan your move, anticipate theirs, and press EXECUTE when ready.",
      position: "bottom-[10%]"
    }
  ];

  const current = content[step - 1];
  if (!current) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
       <div className={`absolute w-[90%] max-w-sm bg-slate-900 border border-teal-500 p-6 rounded-3xl shadow-2xl animate-in zoom-in duration-300 ${current.position}`}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-full bg-teal-500 text-black flex items-center justify-center font-black text-xs">{step}</div>
             <h3 className="text-sm font-black italic text-white uppercase">{current.title}</h3>
          </div>
          <p className="text-xs text-slate-300 font-mono leading-relaxed mb-6">{current.text}</p>
          <Button variant="primary" size="md" onClick={onNext} className="w-full">
             {step === content.length ? "BEGIN OPERATION" : "NEXT INTEL"}
          </Button>
       </div>
    </div>
  );
};

export const TurnEntryView: React.FC<TurnEntryViewProps> = ({ game }) => {
  const { playSfx, credits, submitAction, tutorial, advanceTutorial, distanceMatrix } = game;
  const p = game.players[game.currentPlayerIdx];
  const otherPlayers = game.players.filter((x: any) => x.id !== p.id && !x.isEliminated);
  
  // Local drafting state
  const [localBlockTier, setLocalBlockTier] = useState(0); 
  const [localAttackTier, setLocalAttackTier] = useState(0); 
  // We now track a path of positions. Start is implicitly p.position.
  const [localMovePath, setLocalMovePath] = useState<Position[]>([]);
  const [localMoveAp, setLocalMoveAp] = useState(0);
  const [localAbilityActive, setLocalAbilityActive] = useState(false);
  const [localTargetId, setLocalTargetId] = useState<string | undefined>(otherPlayers[0]?.id);
  const [moveMode, setMoveMode] = useState(false); 
  
  // Sheet State
  const [isSheetExpanded, setIsSheetExpanded] = useState(true); 
  const touchStartY = useRef(0);

  // Computed Values
  // @ts-ignore
  const attackConfig = localAttackTier > 0 ? ATTACK_CONFIG[localAttackTier] : null;
  const attackCost = attackConfig ? attackConfig.ap : 0;
  // @ts-ignore
  const blockCost = localBlockTier > 0 ? BLOCK_CONFIG[localBlockTier].ap : 0;
  
  // AP Calc
  const availableAp = p.ap - blockCost - attackCost;
  const totalSpent = blockCost + attackCost + localMoveAp;
  const remainingAp = p.ap - totalSpent;
  const availableApForNextMove = remainingAp; // If I have 1 AP left, I can add another leg.

  const targetPlayer = localTargetId ? game.players.find((pl: any) => pl.id === localTargetId) : undefined;
  const isCritical = p.hp < (p.maxHp * 0.15) && !p.desperationUsed && p.unit;
  const desperationMove = p.unit ? DESPERATION_MOVES[p.unit.type] : null;

  // Grid Data
  const stride = getStride(p.unit?.speed || 1);
  const currentStartPos = localMovePath.length > 0 ? localMovePath[localMovePath.length - 1] : p.position;
  
  // Filter occupied tiles: All players except self
  const occupied = game.players
    .filter((pl: any) => pl.id !== p.id && !pl.isEliminated)
    .map((pl: any) => pl.position);

  // Get reachable from CURRENT tip of path
  const reachableTiles = moveMode 
    ? getReachableTiles(currentStartPos, stride, availableApForNextMove, game.activeMap, occupied) 
    : [];

  const handleTileClick = (pos: Position) => {
    if (!moveMode) return;
    
    // Check if reachable
    const tile = reachableTiles.find(r => r.x === pos.x && r.y === pos.y);
    if (tile && tile.costInAp <= availableApForNextMove) {
      setLocalMovePath([...localMovePath, { x: pos.x, y: pos.y }]);
      setLocalMoveAp(prev => prev + tile.costInAp);
      playSfx('confirm');
    }
  };

  const toggleMoveMode = () => {
    if (moveMode) {
      setMoveMode(false);
    } else {
      setMoveMode(true);
    }
    playSfx('confirm');
  };

  const handleResetMove = () => {
      setLocalMovePath([]);
      setLocalMoveAp(0);
      playSfx('cancel');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) setIsSheetExpanded(true); 
      else setIsSheetExpanded(false); 
    }
  };

  // Helper for Attack Projection (Hit and Run aware)
  // NOW STRICTLY CHECKS LOS AND RANGE
  const calculateProjectedDmg = (target: any) => {
    if (localAttackTier === 0) return 0;
    
    // Check from all points in path (Hit and Run)
    const pathPoints = [p.position, ...localMovePath];
    let bestMult = 0;
    let hasValidShot = false;

    const unitRange = p.unit?.range || 2;
    const unitType = p.unit?.type;

    pathPoints.forEach(pos => {
        const dist = getManhattanDistance(pos, target.position);
        
        // 1. Strict Range Check
        if (dist > unitRange) return;

        // 2. Strict LOS Check
        const obstacles = getObstaclesInLine(pos, target.position, game.activeMap);
        let allowedObstacles = 0;
        if (unitType === UnitType.TROJAN) allowedObstacles = 1;
        if (unitType === UnitType.GHOST && localAttackTier === 3) allowedObstacles = 1;

        if (obstacles > allowedObstacles) return;

        // If here, shot is possible
        hasValidShot = true;

        let rangeMult = 1.0;
        if (dist <= 1) rangeMult = 1.25;
        
        // Bonus for being on Threshold
        const tileType = game.activeMap.tiles[pos.y][pos.x];
        const thresholdBonus = (tileType === TileType.THRESHOLD) ? 1.10 : 1.0;

        const totalMult = rangeMult * thresholdBonus;
        if (totalMult > bestMult) bestMult = totalMult;
    });

    if (!hasValidShot) return 0; // 0 Indicates Invalid/Blocked

    // @ts-ignore
    const atkConfig = ATTACK_CONFIG[localAttackTier];
    const base = BASE_ATTACK_DMG * atkConfig.mult * (p.unit?.atkStat || 1.0);
    return Math.floor(base * bestMult);
  };

  const calculateShield = () => {
    if (localBlockTier === 0) return 0;
    // @ts-ignore
    const base = BLOCK_CONFIG[localBlockTier].base * (p.unit?.defStat || 1.0);
    const currentOverheat = p.blockFatigue || 0;
    const penalty = Math.min(0.9, currentOverheat * 0.15);
    return Math.floor(base * (1 - penalty));
  };

  // Validation for Execute Button
  const currentTargetDmg = targetPlayer ? calculateProjectedDmg(targetPlayer) : 0;
  const isAttackValid = localAttackTier === 0 || (!!localTargetId && currentTargetDmg > 0);

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
      {tutorial.isActive && <TutorialOverlay step={tutorial.step} onNext={advanceTutorial} />}
      
      <GlobalHeader phase={Phase.TURN_ENTRY} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={credits} xp={game.xp} />
      
      {/* TACTICAL GRID LAYER */}
      <div className="flex-1 w-full bg-[#050b14] relative overflow-hidden flex flex-col items-center pt-4">
          <TacticalGrid 
            map={game.activeMap}
            players={game.players}
            currentPlayerId={p.id}
            reachableTiles={reachableTiles} 
            selectedDest={currentStartPos} // Highlight where we are currently 'planning' from
            onTileClick={handleTileClick}
            targetId={localAttackTier > 0 && isAttackValid ? localTargetId : undefined}
          />
          
          {/* Movement Path Visualization Overlay */}
          {localMovePath.length > 0 && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                {localMovePath.map((_, i) => (
                   <div key={i} className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                ))}
             </div>
          )}
      </div>

      {/* SWIPEABLE ALLOCATION CARD */}
      <div 
         className={`absolute bottom-0 left-0 right-0 bg-[#0a0f1e]/95 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.6)] border-t border-slate-700/50 z-20 transition-all duration-500 ease-out flex flex-col`}
         style={{ height: isSheetExpanded ? '70%' : '25%' }}
      >
         {/* Handle / Header Area */}
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
         </div>

         {/* Expanded Controls */}
         <div className={`flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 space-y-4 transition-opacity duration-300 ${isSheetExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            
            {/* Ability Card */}
            <div className={`p-4 rounded-[2rem] border transition-all ${localAbilityActive ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-900/40 border-slate-800'}`}>
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl ${localAbilityActive ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                        <Activity size={16} />
                     </div>
                     <div>
                        <h3 className="text-[10px] font-black uppercase text-white tracking-wide">{p.unit?.passiveDesc.split(':')[0]}</h3>
                        <p className="text-[8px] text-slate-500 font-mono uppercase truncate max-w-[150px]">{p.unit?.activeDesc}</p>
                     </div>
                  </div>
                  <button 
                     onClick={() => { if(!p.activeUsed && p.cooldown <= 0) setLocalAbilityActive(!localAbilityActive); playSfx('confirm'); }}
                     disabled={p.activeUsed || p.cooldown > 0}
                     className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${localAbilityActive ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-500'}`}
                  >
                     {p.activeUsed ? 'OFF' : p.cooldown > 0 ? `CD:${p.cooldown}` : localAbilityActive ? 'ON' : 'USE'}
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Move Card */}
                <button 
                  onClick={toggleMoveMode}
                  className={`p-4 rounded-[2rem] border transition-all text-left flex flex-col justify-between h-28 ${moveMode ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-900/40 border-slate-800'}`}
                >
                   <div className="flex justify-between items-start w-full">
                      <Move size={20} className={moveMode ? 'text-sky-400' : 'text-slate-600'} />
                      {localMoveAp > 0 && <div className="text-[9px] font-mono uppercase text-sky-400 font-bold">{localMoveAp} AP</div>}
                   </div>
                   <div>
                      <div className="text-xs font-black uppercase text-white italic">MANEUVER</div>
                      {localMovePath.length > 0 ? (
                         <div className="text-[8px] font-bold text-sky-400 uppercase mt-1 flex items-center gap-2">
                            {localMovePath.length} Legs Plotted
                            <span onClick={(e) => { e.stopPropagation(); handleResetMove(); }} className="p-1 bg-slate-800 rounded hover:text-white cursor-pointer"><Undo size={10}/></span>
                         </div>
                      ) : (
                         <div className="text-[8px] text-slate-600 uppercase mt-1 italic">{moveMode ? 'Select Sequence' : 'Hold Position'}</div>
                      )}
                   </div>
                </button>

                {/* Defense Card */}
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-[2rem] flex flex-col justify-between h-28">
                   <div className="flex justify-between items-start">
                      <Shield size={20} className={localBlockTier > 0 ? 'text-teal-400' : 'text-slate-600'} />
                      {localBlockTier > 0 && <div className="text-[9px] font-mono uppercase text-slate-400">{blockCost} AP</div>}
                   </div>
                   <div className="flex items-center justify-between gap-2 mt-2">
                      <button onClick={() => setLocalBlockTier(Math.max(0, localBlockTier - 1))} className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700"><Minus size={14}/></button>
                      <span className="text-xl font-black text-white">{localBlockTier}</span>
                      <button onClick={() => setLocalBlockTier(Math.min(3, localBlockTier + 1))} className="h-8 w-8 rounded-lg bg-teal-500 text-black flex items-center justify-center hover:bg-teal-400"><Plus size={14}/></button>
                   </div>
                   <div className="text-[8px] font-mono text-slate-500 uppercase text-center">{localBlockTier > 0 ? `${calculateShield()} Shield` : 'No Defense'}</div>
                </div>
            </div>

            {/* Offense Card */}
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-[2rem] space-y-3">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <Skull size={20} className={localAttackTier > 0 ? 'text-red-500' : 'text-slate-600'} />
                     <span className="text-xs font-black uppercase text-white italic">WEAPON SYSTEMS</span>
                  </div>
                  {localAttackTier > 0 && <div className="text-[9px] font-mono uppercase text-slate-400">{attackCost} AP</div>}
               </div>
               
               <div className="flex items-center gap-4">
                  <button onClick={() => setLocalAttackTier(Math.max(0, localAttackTier - 1))} className="h-10 w-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700"><Minus size={16}/></button>
                  <div className="flex-1 text-center bg-black/20 rounded-xl py-2">
                     <span className={`text-xl font-black ${localAttackTier > 0 ? 'text-red-500' : 'text-slate-600'}`}>LVL {localAttackTier}</span>
                     <div className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">{attackConfig?.mult || 0}x DMG</div>
                  </div>
                  <button onClick={() => setLocalAttackTier(Math.min(3, localAttackTier + 1))} className="h-10 w-12 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-400"><Plus size={16}/></button>
               </div>

               {/* Target Selector */}
               {localAttackTier > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                     {otherPlayers.map((t: any) => {
                        const dmg = calculateProjectedDmg(t);
                        const isValid = dmg > 0;
                        return (
                           <button 
                              key={t.id} 
                              onClick={() => {
                                 if(isValid) {
                                    setLocalTargetId(t.id);
                                    playSfx('confirm');
                                 } else {
                                    playSfx('cancel');
                                 }
                              }} 
                              className={`flex-1 min-w-[100px] p-3 rounded-xl border transition-all text-left relative overflow-hidden ${!isValid ? 'opacity-50 border-slate-900 bg-slate-950 cursor-not-allowed' : localTargetId === t.id ? 'bg-red-500/10 border-red-500/50' : 'bg-black/20 border-slate-800'}`}
                           >
                              <div className="text-[9px] font-black uppercase text-white truncate relative z-10">{t.name}</div>
                              <div className={`text-[8px] font-mono mt-1 relative z-10 ${isValid ? 'text-slate-500' : 'text-red-500 font-bold'}`}>{isValid ? `~${dmg} DMG` : 'BLOCKED'}</div>
                              {localTargetId === t.id && isValid && <div className="absolute top-1 right-1"><Target size={10} className="text-red-500 animate-pulse"/></div>}
                           </button>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>

         {/* Sticky Footer Button */}
         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e] to-transparent z-30">
            <Button 
               variant={remainingAp >= 0 ? (totalSpent === 0 ? 'amber' : isAttackValid ? 'primary' : 'secondary') : 'secondary'} 
               size="lg" className="w-full py-4 text-lg shadow-2xl"
               onClick={() => {
                 // Use the final point in the path as the destination for legacy compatibility
                 const finalMoveDest = localMovePath.length > 0 ? localMovePath[localMovePath.length - 1] : undefined;
                 
                 submitAction({ 
                    blockAp: localBlockTier, 
                    attackAp: localAttackTier, 
                    moveAp: localMoveAp,
                    movePath: localMovePath, // Submit the whole path
                    abilityActive: localAbilityActive,
                    targetId: localTargetId,
                    moveDest: finalMoveDest
                 });
               }}
               disabled={remainingAp < 0 || (moveMode && localMovePath.length === 0) || !isAttackValid}
            >
               {remainingAp < 0 ? 'OVER_BUDGET' : moveMode && localMovePath.length === 0 ? 'PLOT_COURSE' : !isAttackValid ? 'NO_VALID_TARGET' : 'EXECUTE'}
            </Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};
