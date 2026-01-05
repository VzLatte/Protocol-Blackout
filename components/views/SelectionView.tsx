
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Dna as DnaIcon, ChevronRight, Lock, Loader2, Cpu } from 'lucide-react';
import { UNITS } from '../../operativeRegistry';
import { Phase } from '../../types';

interface SelectionViewProps {
  game: any;
}

export const SelectionView: React.FC<SelectionViewProps> = ({ game }) => {
  const p = game.players[game.currentPlayerIdx];
  const { unlockedUnits, credits } = game;

  if (p?.isAI) {
    return (
      <ScreenWrapper visualLevel={game.visualLevel} className="bg-[#020617]" centerContent={true}>
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="relative">
            <Cpu size={64} className="text-amber-500 opacity-80" />
            <Loader2 size={80} className="absolute -top-2 -left-2 animate-spin text-amber-500 opacity-40" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter glitch-text">{p.name}</h2>
            <p className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.3em]">AI Establishing Combat Identity...</p>
          </div>
        </div>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper visualLevel={game.visualLevel} className="bg-[#020617]" centerContent={false}>
      <GlobalHeader phase={Phase.BLACKOUT_SELECTION} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={credits} />
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-8">
        <div key={game.currentPlayerIdx} className={`p-6 max-w-5xl mx-auto space-y-8 pb-32 animate-in slide-in-from-right duration-500 ${game.isLockedIn ? 'opacity-30 blur-sm scale-95 transition-all duration-1000 pointer-events-none' : ''}`}>
          <div className="text-center pt-4">
            <div className="text-teal-500 font-mono text-[8px] uppercase tracking-[0.6em] mb-2">IDENT_SELECTION [{game.currentPlayerIdx + 1}/{game.setupCount}]</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter mb-2 truncate px-4 glitch-text">{p.name}</h2>
            <p className="text-slate-500 font-mono text-[9px] uppercase tracking-widest">Select combat protocol.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
            {Object.values(UNITS).map((u) => {
              const isUnlocked = unlockedUnits.includes(u.type);
              
              return (
                <button 
                  key={u.type} 
                  onClick={() => isUnlocked && game.setConfirmingUnit(u.type)} 
                  className={`group bg-slate-900/40 backdrop-blur-md border p-6 rounded-[2rem] transition-all text-left flex flex-col h-full shadow-lg 
                    ${isUnlocked ? 'border-slate-800 hover:border-teal-500' : 'border-slate-900/50 opacity-50 cursor-not-allowed'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`font-black italic uppercase text-lg ${isUnlocked ? 'text-teal-500' : 'text-slate-600'}`}>{u.name}</div>
                    {isUnlocked ? (
                      <DnaIcon className="text-slate-700 group-hover:text-teal-500 transition-colors" size={20} />
                    ) : (
                      <Lock size={18} className="text-slate-800" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 italic mb-6 flex-1 leading-relaxed">
                    {isUnlocked ? `"${u.special}"` : "ENCRYPTED_DATA: Access Black Market to unlock protocol."}
                  </p>
                  <div className="text-[7px] font-mono text-slate-600 uppercase border-t border-slate-800 pt-4">
                    {isUnlocked ? "SELECT_OPERATIVE" : "LOCKED"} <ChevronRight size={8} className="inline ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {game.isLockedIn && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300 text-center px-6">
          <h1 className="text-3xl sm:text-5xl font-black italic text-teal-500 uppercase tracking-tighter">PROTOCOL_LOCKED</h1>
          <p className="text-teal-500/50 font-mono text-[10px] uppercase tracking-[0.4em] mt-4 animate-pulse">Transmitting identity data...</p>
        </div>
      )}
      {game.confirmingUnit && !game.isLockedIn && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
           <div className="bg-slate-900 border border-teal-500/50 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="text-teal-400 font-bold uppercase text-lg sm:text-xl mb-4 italic">{UNITS[game.confirmingUnit].name}</div>
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-10 leading-relaxed px-4 sm:px-6">{UNITS[game.confirmingUnit].truth}</p>
              <div className="flex gap-4">
                 <button onClick={() => game.setConfirmingUnit(null)} className="flex-1 py-4 border border-slate-700 rounded-2xl font-bold uppercase text-[9px] text-slate-400">Back</button>
                 <button onClick={() => game.selectUnit(game.confirmingUnit!)} className="flex-1 py-4 bg-teal-500 text-black rounded-2xl font-black uppercase text-[9px]">Establish</button>
              </div>
           </div>
        </div>
      )}
    </ScreenWrapper>
  );
};
