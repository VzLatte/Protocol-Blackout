
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel } from '../../types';
import { UNITS } from '../../constants';
import { Lock, ShieldCheck, Zap } from 'lucide-react';

interface OperativesListViewProps {
  unlockedUnits: string[];
  visualLevel: VisualLevel;
  onHelp: () => void;
  onSettings: () => void;
  credits: number;
}

export const OperativesListView: React.FC<OperativesListViewProps> = ({ 
  unlockedUnits, visualLevel, onHelp, onSettings, credits 
}) => {
  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.MENU} onHelp={onHelp} onSettings={onSettings} onExit={() => {}} credits={credits} />
      <div className="flex-1 p-6 flex flex-col items-center max-w-5xl mx-auto w-full pt-10 pb-32">
        <div className="w-full space-y-12">
          <div className="text-center space-y-4">
             <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">OPERATIVES</h2>
             <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Review protocol capabilities and specializations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(UNITS).map((u) => {
              const isUnlocked = unlockedUnits.includes(u.type);
              return (
                <div 
                  key={u.type} 
                  className={`bg-slate-900/60 backdrop-blur-xl border p-8 rounded-[3rem] transition-all relative overflow-hidden group
                    ${isUnlocked ? 'border-slate-800' : 'border-slate-900/50 opacity-50 grayscale'}`}
                >
                  {!isUnlocked && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <Lock size={32} className="text-slate-500" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Protocol Encrypted</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-teal-500 font-mono text-[8px] uppercase tracking-widest mb-1">{u.role}</div>
                      <h3 className="text-3xl font-black italic uppercase text-white group-hover:text-teal-400 transition-colors">{u.name}</h3>
                    </div>
                    {isUnlocked && <ShieldCheck size={24} className="text-teal-500/50" />}
                  </div>
                  
                  <p className="text-slate-400 text-xs italic mb-8 leading-relaxed">"{u.description}"</p>
                  
                  <div className="bg-black/40 border border-slate-800/50 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 text-teal-400 mb-2">
                       <Zap size={14} />
                       <span className="text-[9px] font-black uppercase tracking-widest">Active Special</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed uppercase tracking-tight italic">
                      {u.special}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800/50">
                    <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-2">Establishment Truth</div>
                    <p className="text-[10px] text-slate-500 italic">"{u.truth}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};
