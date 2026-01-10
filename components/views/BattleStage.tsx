
import React from 'react';
import { Player, UnitType } from '../../types';
import { Shield, Skull, Zap, Ghost, AlertOctagon } from 'lucide-react';

interface BattleStageProps {
  leftPlayer: Player | null;
  rightPlayer: Player | null;
  animState: {
    left: 'idle' | 'attack' | 'hit' | 'faint';
    right: 'idle' | 'attack' | 'hit' | 'faint';
  };
  visualLevel?: string;
  className?: string;
  variant?: 'default' | 'perspective'; // Added variant prop
}

const UnitDisplay: React.FC<{ 
  player: Player; 
  isRightSide?: boolean; 
  animation: 'idle' | 'attack' | 'hit' | 'faint';
}> = ({ player, isRightSide = false, animation }) => {
  if (!player.unit) return null;

  const isCritical = player.hp < (player.maxHp * 0.15) && !player.desperationUsed;

  const getAnimClass = () => {
    switch (animation) {
      case 'attack': return isRightSide ? 'animate-lunge-left' : 'animate-lunge-right';
      case 'hit': return 'animate-shake-hit';
      case 'faint': return 'animate-faint';
      default: return 'animate-float';
    }
  };

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const hpColor = hpPercent > 50 ? 'bg-teal-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-red-500';

  // Fallback icon if image fails or isn't present
  const FallbackIcon = () => (
    <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center border-4 shadow-2xl ${isRightSide ? 'bg-red-950/50 border-red-500/50' : 'bg-teal-950/50 border-teal-500/50'}`}>
       <Ghost size={64} className={isRightSide ? 'text-red-500' : 'text-teal-500'} />
    </div>
  );

  return (
    <div className={`flex flex-col items-center gap-4 relative transition-all duration-300 ${isRightSide ? 'items-end' : 'items-start'}`}>
      {/* HP HUD */}
      <div className={`bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl min-w-[140px] sm:min-w-[180px] z-10 animate-spawn ${animation === 'faint' ? 'opacity-0 transition-opacity duration-500' : ''}`}>
        <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] font-black uppercase text-white italic truncate max-w-[100px]">{player.name}</span>
          <span className="text-[8px] font-mono text-slate-400">LVL {player.maxHp > 2000 ? '99' : '10'}</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-950">
           <div className={`h-full transition-all duration-500 ${hpColor}`} style={{ width: `${hpPercent}%` }}></div>
        </div>
        <div className="flex justify-between mt-1">
           <span className="text-[8px] font-mono text-slate-500">{player.hp}/{player.maxHp} HP</span>
           {player.statuses.length > 0 && (
             <span className="text-[8px] font-bold text-amber-500 animate-pulse">STATUS</span>
           )}
        </div>
        
        {/* Critical Warning */}
        {isCritical && (
           <div className="mt-2 bg-red-600 text-white text-[8px] font-black uppercase py-1 px-2 rounded flex items-center justify-center gap-1 animate-pulse">
              <AlertOctagon size={10} /> CRITICAL // SURGE IMMINENT
           </div>
        )}
      </div>

      {/* Sprite / Unit */}
      <div className={`relative ${getAnimClass()}`}>
         {player.unit.image ? (
            <div className="relative group">
                <img 
                  src={player.unit.image} 
                  alt={player.unit.name}
                  className={`w-48 h-48 sm:w-64 sm:h-64 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-all
                    ${isRightSide ? 'scale-x-[-1]' : ''} 
                    ${animation === 'hit' ? 'brightness-150' : ''}
                    ${isCritical ? 'animate-glitch' : ''}
                  `}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.querySelector('.fallback-icon')!.classList.remove('hidden');
                  }}
                />
                <div className="fallback-icon hidden">
                   <FallbackIcon />
                </div>
            </div>
         ) : (
            <FallbackIcon />
         )}
         
         {/* Shadow Base */}
         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/60 blur-lg rounded-[100%]"></div>
      </div>
    </div>
  );
};

export const BattleStage: React.FC<BattleStageProps> = ({ leftPlayer, rightPlayer, animState, className, variant = 'default' }) => {
  // Default height if no className provided
  const baseClasses = className || "w-full h-[35vh] sm:h-[45vh] border-b border-slate-800 shrink-0";
  
  return (
    <div className={`${baseClasses} relative overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#020617]`}>
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute top-1/4 left-10 w-48 h-48 bg-teal-500 blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-purple-500 blur-[120px] animate-pulse delay-700"></div>
         <div className="grid grid-cols-[repeat(20,1fr)] h-full opacity-10">
            {Array.from({ length: 20 }).map((_, i) => (
               <div key={i} className="border-r border-slate-500/20 h-full"></div>
            ))}
         </div>
      </div>

      <div className={`relative z-10 w-full h-full max-w-5xl mx-auto px-4 ${variant === 'default' ? 'flex justify-between items-end pb-[15vh]' : ''}`}>
         {variant === 'default' ? (
           <>
             {leftPlayer ? (
                <UnitDisplay player={leftPlayer} animation={animState.left} />
             ) : <div className="w-10"/>}

             {rightPlayer ? (
                <UnitDisplay player={rightPlayer} isRightSide animation={animState.right} />
             ) : <div className="w-10"/>}
           </>
         ) : (
           /* Perspective Variant: Diagonal Layout */
           <>
             <div className="absolute bottom-[35%] left-4 z-20 scale-110 origin-bottom-left transition-all duration-500">
               {leftPlayer && <UnitDisplay player={leftPlayer} animation={animState.left} />}
             </div>
             
             {/* Key Change: Right player container allows swapping */}
             <div className="absolute top-[15%] right-4 z-10 scale-90 origin-top-right transition-all duration-500">
               {rightPlayer && <UnitDisplay key={rightPlayer.id} player={rightPlayer} isRightSide animation={animState.right} />}
             </div>
           </>
         )}
      </div>
    </div>
  );
};
