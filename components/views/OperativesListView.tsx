
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel, UnitType } from '../../types';
import { UNITS, UNIT_PRICES } from '../../operativeRegistry';
import { Lock, ShieldCheck, Zap, Database, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface OperativesListViewProps {
  game: any;
  onHelp: () => void;
  onSettings: () => void;
}

export const OperativesListView: React.FC<OperativesListViewProps> = ({ 
  game, onHelp, onSettings
}) => {
  const { unlockedUnits, credits, purchaseUnit, visualLevel } = game;

  const renderTier = (tier: number) => {
    const unitsInTier = Object.values(UNITS).filter(u => UNIT_PRICES[u.type].tier === tier);
    
    return (
      <div key={tier} className="space-y-6 w-full">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-2 px-2">
           <Zap size={14} className="text-teal-500" />
           <h3 className="text-[10px] sm:text-xs font-black uppercase text-slate-400 tracking-widest italic">Tier {tier} Protocols</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {unitsInTier.map((u) => {
            const isUnlocked = unlockedUnits.includes(u.type);
            const price = UNIT_PRICES[u.type].cost;
            const canAfford = credits >= price;

            return (
              <div 
                key={u.type} 
                className={`bg-slate-900/60 backdrop-blur-xl border p-8 rounded-[3rem] transition-all relative overflow-hidden group
                  ${isUnlocked ? 'border-slate-800' : 'border-slate-900 shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]'}`}
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="text-teal-500 font-mono text-[8px] uppercase tracking-widest mb-1">{u.role}</div>
                    <h3 className={`text-3xl font-black italic uppercase transition-colors glitch-text ${isUnlocked ? 'text-white group-hover:text-teal-400' : 'text-slate-600'}`}>
                      {u.name}
                    </h3>
                  </div>
                  {isUnlocked ? (
                    <ShieldCheck size={24} className="text-teal-500/50" />
                  ) : (
                    <div className="bg-slate-800/80 p-2 rounded-xl text-slate-500">
                      <Lock size={18} />
                    </div>
                  )}
                </div>
                
                <p className={`text-xs italic mb-8 leading-relaxed relative z-10 ${isUnlocked ? 'text-slate-400' : 'text-slate-700'}`}>
                  {isUnlocked ? `"${u.description}"` : "ENCRYPTED_DATA_LINK: Authorization required for full capability profile."}
                </p>
                
                {isUnlocked ? (
                  <div className="bg-black/40 border border-slate-800/50 p-6 rounded-3xl space-y-4 relative z-10">
                    <div className="flex items-center gap-2 text-teal-400 mb-2">
                       <Zap size={14} />
                       <span className="text-[9px] font-black uppercase tracking-widest">Active Special</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed uppercase tracking-tight italic">
                      {u.special}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    <div className="bg-black/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Database size={14} className="text-sky-400" />
                          <span className="text-xs font-black text-slate-400 font-mono">COST:</span>
                       </div>
                       <span className={`text-xl font-black italic ${canAfford ? 'text-sky-400' : 'text-red-500'}`}>{price} CR</span>
                    </div>
                    <Button 
                      variant={canAfford ? 'primary' : 'secondary'} 
                      className="w-full py-4 rounded-2xl"
                      disabled={!canAfford}
                      onClick={() => purchaseUnit(u.type)}
                    >
                      {canAfford ? 'UNLOCK PROTOCOL' : 'INSUFFICIENT MERIT'}
                    </Button>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-800/50 relative z-10">
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-2">Establishment Truth</div>
                  <p className={`text-[10px] italic ${isUnlocked ? 'text-slate-500' : 'text-slate-800 font-bold'}`}>
                    {isUnlocked ? `"${u.truth}"` : "CLASSIFIED_INFO_RESTRICTED"}
                  </p>
                </div>

                {/* Subtle background flair for unlocked */}
                {isUnlocked && (
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/5 blur-[80px] pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.MENU} onHelp={onHelp} onSettings={onSettings} onExit={() => {}} credits={credits} />
      <div className="flex-1 p-6 flex flex-col items-center max-w-5xl mx-auto w-full pt-10 pb-32">
        <div className="w-full space-y-16">
          <div className="text-center space-y-4">
             <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter glitch-text">OPERATIVES</h2>
             <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Establish Link to combat protocol manifests</p>
          </div>

          <div className="space-y-16">
            {[1, 2, 3].map(t => renderTier(t))}
          </div>

          <div className="pt-10 flex flex-col items-center gap-4 opacity-40">
             <div className="h-[1px] w-24 bg-slate-800"></div>
             <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-slate-600 italic">End of Manifest</p>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};
