
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Button } from '../ui/Button';
import { Edit2, Check, X, User, Cpu, Shield, Zap, Target } from 'lucide-react';
import { Phase, AIArchetype, AIDifficulty } from '../../types';

interface SetupPlayersViewProps {
  game: any;
}

export const SetupPlayersView: React.FC<SetupPlayersViewProps> = ({ game }) => {
  const { playSfx, playerConfigs, updatePlayerConfig } = game;
  
  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.SETUP_PLAYERS} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => game.setIsExitConfirming(true)} credits={game.credits} />
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-start pb-20 pt-10">
         <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl animate-in fade-in duration-500">
            <h2 className="text-lg sm:text-xl font-black uppercase text-white italic mb-8 border-b border-slate-800 pb-4 flex items-center gap-3">
              <Zap className="text-teal-400" size={20}/> Deployment Manifest
            </h2>
            
            <div className="space-y-10">
               {/* Global Settings */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                     <label className="text-[10px] uppercase font-mono text-slate-500 mb-2 block tracking-widest">Operative Count</label>
                     <div className="grid grid-cols-5 gap-1.5">
                        {[2,3,4,5,6].map(n => (
                           <button key={n} onClick={() => { playSfx('beep'); game.setSetupCount(n); }} className={`py-3 rounded-xl border font-black text-xs transition-all ${game.setupCount === n ? 'bg-teal-500 border-teal-400 text-black' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{n}</button>
                        ))}
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-mono uppercase text-slate-500 block mb-3 tracking-widest">Round Timer</label>
                     <div className="flex items-center gap-4">
                        <input 
                          type="range" min="0" max="120" step="15"
                          value={game.timeLimit} 
                          onChange={(e) => { game.setTimeLimit(parseInt(e.target.value)); playSfx('beep'); }}
                          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                        <div className="bg-black/60 px-3 py-1.5 border border-slate-800 rounded-lg font-mono text-xs text-teal-400 min-w-[60px] text-center">
                            {game.timeLimit === 0 ? 'INF' : `${game.timeLimit}s`}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Operative Config List */}
               <div className="space-y-4">
                  <label className="text-[10px] uppercase font-mono text-slate-500 block tracking-widest">Assigned Operatives</label>
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                      {playerConfigs.slice(0, game.setupCount).map((cfg: any, i: number) => (
                         <div key={i} className="bg-black/40 border border-slate-800 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] space-y-4 transition-all hover:border-slate-700">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                               <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {game.editingNameIdx === i ? (
                                    <div className="flex gap-2 w-full animate-in slide-in-from-left duration-200">
                                       <input autoFocus value={game.tempName} onChange={(e) => game.setTempName(e.target.value)} className="flex-1 min-w-0 bg-teal-500/10 border border-teal-500 p-2 rounded-xl text-xs text-teal-400 outline-none font-bold uppercase" />
                                       <button onClick={game.saveEditName} className="p-2 bg-teal-500 text-black rounded-xl shrink-0"><Check size={16} /></button>
                                       <button onClick={game.cancelEditName} className="p-2 bg-red-500 text-white rounded-xl shrink-0"><X size={16} /></button>
                                    </div>
                                  ) : (
                                    <>
                                       <span className="text-sm font-black italic uppercase text-white truncate glitch-text">{cfg.name}</span>
                                       <button onClick={() => game.startEditName(i)} className="text-slate-600 hover:text-teal-500 p-1 shrink-0"><Edit2 size={12} /></button>
                                    </>
                                  )}
                               </div>
                               <div className="flex bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto">
                                  <button onClick={() => updatePlayerConfig(i, { isAI: false })} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${!cfg.isAI ? 'bg-teal-500 text-black' : 'text-slate-500'}`}><User size={12}/> Human</button>
                                  <button onClick={() => updatePlayerConfig(i, { isAI: true })} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${cfg.isAI ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-slate-500'}`}><Cpu size={12}/> AI</button>
                               </div>
                            </div>

                            {cfg.isAI && (
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-300">
                                  <div>
                                     <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2">Protocol Archetype</div>
                                     <div className="flex flex-wrap gap-1">
                                        {[AIArchetype.TURTLE, AIArchetype.AGGRO, AIArchetype.STRATEGIST].map(arch => (
                                           <button 
                                              key={arch}
                                              onClick={() => updatePlayerConfig(i, { archetype: arch })}
                                              className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${cfg.archetype === arch ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-transparent border-slate-800 text-slate-600'}`}
                                           >
                                              {arch}
                                           </button>
                                        ))}
                                     </div>
                                  </div>
                                  <div>
                                     <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2">System Potency</div>
                                     <div className="flex gap-1">
                                        {[AIDifficulty.EASY, AIDifficulty.NORMAL, AIDifficulty.HARD].map(diff => (
                                           <button 
                                              key={diff}
                                              onClick={() => updatePlayerConfig(i, { difficulty: diff })}
                                              className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${cfg.difficulty === diff ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-transparent border-slate-800 text-slate-600'}`}
                                           >
                                              {diff}
                                           </button>
                                        ))}
                                     </div>
                                  </div>
                               </div>
                            )}
                         </div>
                      ))}
                  </div>
               </div>

               <Button 
                variant="primary" size="lg" className="w-full py-6 text-lg"
                onClick={game.finalizePlayers} 
                disabled={game.editingNameIdx !== null}
               >
                  {game.editingNameIdx !== null ? 'FINISH EDITING' : 'Establish Protocol'}
               </Button>
            </div>
         </div>
      </div>
    </ScreenWrapper>
  );
};
