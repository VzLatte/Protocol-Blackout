
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, UnitType } from '../../types';
import { Button } from '../ui/Button';
import { ShoppingCart, ShieldCheck, Lock, ChevronLeft, Zap } from 'lucide-react';
import { UNITS, UNIT_PRICES } from '../../constants';

interface BlackMarketViewProps {
  game: any;
  onBack: () => void;
}

export const BlackMarketView: React.FC<BlackMarketViewProps> = ({ game, onBack }) => {
  const { credits, unlockedUnits, purchaseUnit } = game;

  const renderTier = (tier: number) => {
    const unitsInTier = Object.values(UNITS).filter(u => UNIT_PRICES[u.type].tier === tier);
    
    return (
      <div key={tier} className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
           <Zap size={14} className="text-red-500" />
           <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest italic">Tier {tier} Operations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {unitsInTier.map(u => {
              const isUnlocked = unlockedUnits.includes(u.type);
              const price = UNIT_PRICES[u.type].cost;
              const canAfford = credits >= price;

              return (
                <div 
                  key={u.type} 
                  className={`border p-6 rounded-[2.5rem] flex flex-col transition-all relative overflow-hidden
                    ${isUnlocked 
                      ? 'border-sky-500/40 bg-sky-950/30 shadow-[inset_0_0_20px_rgba(56,189,248,0.1)]' 
                      : 'border-slate-800 bg-slate-900/60'}`}
                >
                   {isUnlocked && (
                     <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -z-10 pointer-events-none"></div>
                   )}
                   
                   <div className="flex justify-between items-start mb-2 relative z-10">
                      <h4 className={`text-xl font-black italic uppercase ${isUnlocked ? 'text-sky-400' : 'text-white'}`}>{u.name}</h4>
                      {isUnlocked ? <ShieldCheck className="text-sky-400" size={18} /> : <Lock className="text-slate-700" size={18} />}
                   </div>
                   <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-6 flex-1 italic relative z-10">"{u.special}"</p>
                   
                   {isUnlocked ? (
                     <div className="py-2 text-center text-[8px] font-black text-sky-500 uppercase tracking-[0.3em] bg-sky-500/10 rounded-xl border border-sky-500/20">Protocol Unlocked</div>
                   ) : (
                     <Button 
                       variant={canAfford ? 'primary' : 'secondary'} 
                       size="sm" 
                       className="w-full relative z-10"
                       onClick={() => purchaseUnit(u.type)}
                       disabled={!canAfford}
                     >
                        Purchase: {price} CR
                     </Button>
                   )}
                </div>
              );
           })}
        </div>
      </div>
    );
  };

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
       <GlobalHeader phase={Phase.STORE} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={onBack} credits={credits} />
       <div className="flex-1 p-6 flex flex-col items-center max-w-5xl mx-auto w-full pt-10 pb-28">
          <div className="w-full space-y-12">
             <div className="flex justify-between items-end gap-6">
                <div className="space-y-2">
                   <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">BLACK_MARKET</h2>
                   <p className="text-slate-500 font-mono text-[9px] uppercase tracking-[0.4em]">Exchange Merit Data for experimental protocols</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-right min-w-[150px] shadow-2xl">
                   <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Available Merit</div>
                   <div className="text-2xl font-black text-sky-400 italic tracking-tighter">{credits} CR</div>
                </div>
             </div>

             <div className="space-y-16">
                {[1, 2, 3].map(t => renderTier(t))}
             </div>

             <Button variant="ghost" className="w-full py-4 rounded-3xl" onClick={onBack}>
                <ChevronLeft size={16} /> Close Connection
             </Button>
          </div>
       </div>
    </ScreenWrapper>
  );
};
