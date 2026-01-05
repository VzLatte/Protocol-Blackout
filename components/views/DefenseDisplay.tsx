
import React from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { DEFENSE_CONFIG } from '../../constants';

interface DefenseDisplayProps {
  defenseTier: number;
  isCracked: boolean;
  mitigationPercent: number;
  shieldHealth: number;
}

export const DefenseDisplay: React.FC<DefenseDisplayProps> = ({ defenseTier, isCracked, mitigationPercent, shieldHealth }) => {
  if (defenseTier === 0) return null;

  // @ts-ignore
  const config = DEFENSE_CONFIG[defenseTier];
  const colorClass = defenseTier === 3 ? 'text-amber-400' : defenseTier === 2 ? 'text-teal-400' : 'text-sky-400';
  const borderClass = defenseTier === 3 ? 'border-amber-500/30' : defenseTier === 2 ? 'border-teal-500/30' : 'border-sky-500/30';
  const bgClass = defenseTier === 3 ? 'bg-amber-500/10' : defenseTier === 2 ? 'bg-teal-500/10' : 'bg-sky-500/10';

  if (isCracked) {
    return (
      <div className="w-full mt-2 animate-in zoom-in duration-300">
        <div className="bg-red-950/40 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
          <ShieldAlert className="text-red-500 shrink-0 relative z-10" size={24} />
          <div className="relative z-10 flex-1">
             <div className="text-[9px] font-black uppercase text-red-500 tracking-widest italic">CRITICAL FAILURE</div>
             <div className="text-[8px] font-mono text-red-400 uppercase">Barrier Shattered ({Math.round(mitigationPercent * 100)}% Integrity Left)</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-2 animate-in fade-in slide-in-from-left duration-300">
      <div className={`${bgClass} border ${borderClass} p-2 rounded-xl flex items-center gap-3`}>
         <ShieldCheck className={`${colorClass} shrink-0`} size={20} />
         <div className="flex-1">
            <div className={`text-[9px] font-black uppercase ${colorClass} tracking-widest`}>
               {config?.name || "SHIELD"} ACTIVE
            </div>
            <div className="flex justify-between items-center w-full">
               <span className="text-[8px] font-mono text-slate-400 uppercase">{Math.round(mitigationPercent * 100)}% Mitigation</span>
               <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tight">HOLDING ({shieldHealth} Max)</span>
            </div>
            {/* Visual Integrity Bar */}
            <div className="w-full h-1 bg-black/40 rounded-full mt-1 overflow-hidden">
               <div className={`h-full w-full ${defenseTier === 3 ? 'bg-amber-500' : defenseTier === 2 ? 'bg-teal-500' : 'bg-sky-500'} animate-pulse`}></div>
            </div>
         </div>
      </div>
    </div>
  );
};
