
import React, { useState, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel, HazardType, DifficultyLevel } from '../../types';
import { Button } from '../ui/Button';
import { Lock, ChevronLeft, Zap, Flame, Radio, AlertTriangle, Cpu, Target, Info, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { CAMPAIGN_LEVELS } from '../../campaignRegistry';

interface NodeSelectorViewProps {
  game: any;
  onSelectLevel: (lvlId: string) => void;
  onBack: () => void;
}

export const NodeSelectorView: React.FC<NodeSelectorViewProps> = ({ game, onSelectLevel, onBack }) => {
  const { currentChapter, highestLevelReached, campaignDifficulty, setCampaignDifficulty, highestDifficultyReached, playSfx } = game;
  const [showLore, setShowLore] = useState(false);
  const [showDiffInfo, setShowDiffInfo] = useState(false);
  const [selectedLvl, setSelectedLvl] = useState<any>(null);
  
  useEffect(() => {
    if (!game.hasSeenIntro) setShowLore(true);
  }, [game.hasSeenIntro]);

  const levelsInChapter = CAMPAIGN_LEVELS.filter(l => l.chapter === currentChapter);
  const chapterTitles = ["NEON_PURGATORY", "SILICON_ABYSS", "ZENITH_SINGULARITY"];
  const chapterColors = ["text-teal-400", "text-lime-400", "text-red-500"];

  const getDiffIdx = (d: DifficultyLevel) => {
    if (d === DifficultyLevel.NORMAL) return 0;
    if (d === DifficultyLevel.OVERCLOCK) return 1;
    return 2;
  };

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.CAMPAIGN_MAP} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={onBack} credits={game.credits} />
      
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center max-w-5xl mx-auto w-full pt-6 pb-32 animate-in fade-in duration-700">
         <div className="w-full space-y-10">
            <div className="text-center space-y-2">
               <h2 className={`text-4xl sm:text-6xl font-black italic uppercase tracking-tighter ${chapterColors[currentChapter-1]}`}>
                  {chapterTitles[currentChapter-1]}
               </h2>
               <p className="text-slate-500 font-mono text-[8px] uppercase tracking-[0.4em]">CHAPTER_{currentChapter} // NETWORK_UPLINK_STABLE</p>
            </div>

            {/* Difficulty Bar */}
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-3xl space-y-3">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Radio size={12} className="text-teal-400" />
                     <span className="text-[9px] font-black uppercase text-slate-500">POTENCY_SELECT</span>
                  </div>
                  <button onClick={() => setShowDiffInfo(true)} className="text-slate-500 hover:text-white transition-colors">
                     <Info size={14} />
                  </button>
               </div>
               <div className="flex gap-2 w-full">
                  {[DifficultyLevel.NORMAL, DifficultyLevel.OVERCLOCK, DifficultyLevel.BLACKOUT].map((d) => {
                     const isLocked = getDiffIdx(d) > highestDifficultyReached;
                     const active = campaignDifficulty === d;
                     return (
                        <button 
                           key={d}
                           disabled={isLocked}
                           onClick={() => { setCampaignDifficulty(d); playSfx('beep'); }}
                           className={`flex-1 py-3 rounded-xl border text-[10px] font-black italic transition-all relative overflow-hidden
                              ${isLocked ? 'bg-black/80 border-slate-900 text-slate-800 cursor-not-allowed' : 
                                active ? 'bg-teal-500 border-teal-400 text-black shadow-lg scale-[1.02] z-10' : 
                                'bg-black/40 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                        >
                           {isLocked && <Lock size={10} className="absolute top-1 right-1 opacity-50" />}
                           {d}
                           {isLocked && <div className="text-[6px] font-mono opacity-40 mt-0.5">LOCKED</div>}
                        </button>
                     );
                  })}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {levelsInChapter.map((lvl, i) => {
                  const absoluteIdx = (currentChapter - 1) * 12 + i + 1;
                  const isLocked = absoluteIdx > highestLevelReached;
                  
                  return (
                    <button 
                      key={lvl.id}
                      onClick={() => !isLocked && setSelectedLvl(lvl)}
                      className={`relative bg-slate-900/60 backdrop-blur-xl border p-5 rounded-3xl flex items-center gap-5 transition-all text-left overflow-hidden group
                        ${isLocked ? 'border-slate-950 opacity-40 grayscale cursor-not-allowed' : 'border-slate-800 hover:border-teal-500 active:scale-95'}`}
                    >
                       <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${isLocked ? 'bg-black border-slate-900' : 'bg-teal-500/10 border-teal-500/30 text-teal-400'}`}>
                          {isLocked ? <Lock size={16} /> : <Zap size={16} className="group-hover:scale-125 transition-transform"/>}
                       </div>
                       <div className="min-w-0">
                          <h3 className={`text-sm font-black italic uppercase truncate ${isLocked ? 'text-slate-700' : 'text-white'}`}>
                             {currentChapter}-{lvl.sequence}: {lvl.title}
                          </h3>
                          <div className="text-[8px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                             {isLocked ? "ACCESS_RESTRICTED" : lvl.enemyUnit}
                          </div>
                       </div>
                    </button>
                  );
               })}
            </div>

            <Button variant="ghost" className="w-full py-4 rounded-3xl border-slate-800" onClick={onBack}>
               <ChevronLeft size={16} /> Return to Sector Map
            </Button>
         </div>
      </div>

      {/* Difficulty Info Modal */}
      <Modal isOpen={showDiffInfo} onClose={() => setShowDiffInfo(false)} title="MODIFIER_MATRIX" maxWidth="max-w-2xl">
         <div className="space-y-6 pb-6">
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
               <table className="w-full text-left text-[9px] font-mono">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                     <tr>
                        <th className="p-3 uppercase">Modifier</th>
                        <th className="p-3 uppercase text-teal-400">Normal</th>
                        <th className="p-3 uppercase text-amber-500">Overclock</th>
                        <th className="p-3 uppercase text-red-500">Blackout</th>
                     </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-slate-800/50">
                     <tr>
                        <td className="p-3 font-bold text-white uppercase">Enemy Stats</td>
                        <td className="p-3">100% Base</td>
                        <td className="p-3">120% HP / 110% DMG</td>
                        <td className="p-3">150% HP / 125% DMG</td>
                     </tr>
                     <tr>
                        <td className="p-3 font-bold text-white uppercase">AI Logic</td>
                        <td className="p-3">Standard</td>
                        <td className="p-3">Perfect (0% Fail)</td>
                        <td className="p-3">Cheating (Input Read)</td>
                     </tr>
                     <tr>
                        <td className="p-3 font-bold text-white uppercase">Energy Cap</td>
                        <td className="p-3">Max 10 AP</td>
                        <td className="p-3 text-amber-500">Max 8 AP</td>
                        <td className="p-3 text-red-500">Max 6 AP</td>
                     </tr>
                     <tr>
                        <td className="p-3 font-bold text-white uppercase">Strain/Fatigue</td>
                        <td className="p-3">Normal (+1)</td>
                        <td className="p-3 text-amber-500">Heavy (+2)</td>
                        <td className="p-3 text-red-500 font-bold underline">Permanent</td>
                     </tr>
                     <tr>
                        <td className="p-3 font-bold text-white uppercase">Intel</td>
                        <td className="p-3">Full Visibility</td>
                        <td className="p-3">Hidden Intent</td>
                        <td className="p-3 text-red-500">Fog of War</td>
                     </tr>
                  </tbody>
               </table>
            </div>
            
            <div className="flex gap-4">
               <div className="flex-1 space-y-2">
                  <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                     <Lock size={12} /> Overclock Unlock
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed uppercase">Clear Chapter 1 (Gatekeeper) to authorize Overclock access.</p>
               </div>
               <div className="flex-1 space-y-2">
                  <div className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                     <Lock size={12} /> Blackout Unlock
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed uppercase">Clear Chapter 3 (Source) to unlock ultimate simulation lethal mode.</p>
               </div>
            </div>
            
            <Button variant="primary" className="w-full mt-4" onClick={() => setShowDiffInfo(false)}>Acknowledge Data</Button>
         </div>
      </Modal>

      {/* Mission Briefing Modal */}
      <Modal isOpen={!!selectedLvl} onClose={() => setSelectedLvl(null)} title="MISSION_BRIEFING" maxWidth="max-w-xl">
        {selectedLvl && (
          <div className="space-y-8 pb-4">
             <div className="flex justify-between items-start">
                <div>
                   <h2 className="text-3xl font-black italic text-white uppercase">{selectedLvl.title}</h2>
                   <div className="text-[10px] font-mono text-teal-400 mt-1 uppercase tracking-widest">Enemy: {selectedLvl.enemyName || selectedLvl.enemyUnit}</div>
                </div>
                <div className="bg-black/60 p-3 border border-slate-800 rounded-2xl flex flex-col items-center">
                   <Target size={16} className="text-red-500 mb-1"/>
                   <span className="text-[8px] font-black text-slate-500 uppercase">HP_MOD</span>
                   <span className="text-sm font-black text-white italic">x{selectedLvl.enemyHpMult}</span>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                   <div className="text-[8px] font-mono text-slate-600 uppercase mb-2 tracking-widest">Tactical Assessment</div>
                   <p className="text-xs text-slate-400 font-mono leading-relaxed">{selectedLvl.description}</p>
                </div>
                {selectedLvl.hazard !== HazardType.NONE && (
                  <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-900/40 flex items-center gap-4">
                     <AlertTriangle size={24} className="text-amber-500" />
                     <div>
                        <div className="text-[9px] font-black text-amber-500 uppercase">ENVIRONMENT_HAZARD</div>
                        <div className="text-[10px] font-mono text-slate-300 uppercase">{selectedLvl.hazard} DETECTED</div>
                     </div>
                  </div>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-slate-800 text-center">
                   <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Merit Bonus</div>
                   <div className="text-lg font-black text-sky-400">{selectedLvl.creditReward} CR</div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-slate-800 text-center">
                   <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Potential Unlock</div>
                   <div className="text-[10px] font-black text-teal-500 uppercase truncate px-2">{selectedLvl.unlockUnit || "NONE"}</div>
                </div>
             </div>

             <Button 
               variant="primary" 
               className="w-full py-5 text-lg" 
               onClick={() => { playSfx('startup'); onSelectLevel(selectedLvl.id); setSelectedLvl(null); }}
             >
                INITIALIZE LINK
             </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showLore} onClose={() => {setShowLore(false); game.setHasSeenIntro(true)}} title="ESTABLISHMENT_UPLINK" zIndex="z-[150]">
        <div className="space-y-6">
           <p className="text-xs text-slate-400 font-mono leading-relaxed italic border-l-2 border-red-500/30 pl-4">
              "Operative. You've entered the Neon Purgatory. This is where unverified data streams are processed for deletion. The network doesn't want you here."
           </p>
           <Button variant="primary" className="w-full mt-4" onClick={() => {setShowLore(false); game.setHasSeenIntro(true)}}>Acknowledge Mission</Button>
        </div>
      </Modal>
    </ScreenWrapper>
  );
};
