import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase } from '../../types';
import { Button } from '../ui/Button';
import { ChevronLeft, Lock, Map, Radio } from 'lucide-react';

interface ChapterSelectionViewProps {
  game: any;
  onSelectChapter: (chapterId: number) => void;
  onBack: () => void;
}

export const ChapterSelectionView: React.FC<ChapterSelectionViewProps> = ({ game, onSelectChapter, onBack }) => {
  const { credits, highestLevelReached, setCurrentChapter } = game;
  
  const chapters = [
    { 
      id: 1, 
      name: "Neon Purgatory", 
      description: "Establish link to the first sector of the Blackout network.", 
      tagline: "CORE_ESTABLISHMENT",
      isLocked: false 
    },
    { 
      id: 2, 
      name: "Silicon Abyss", 
      description: "Descend into the encrypted lower levels of the Establishment.", 
      tagline: "DATA_EXTRACTION",
      isLocked: highestLevelReached <= 12
    },
    { 
      id: 3, 
      name: "Zenith Singularity", 
      description: "Total architectural reset. Challenge the system core.", 
      tagline: "PROTOCOL_FINALITY",
      isLocked: highestLevelReached <= 24
    }
  ];

  const handleChapterClick = (chId: number, isLocked: boolean) => {
    if (!isLocked) {
      setCurrentChapter(chId);
      onSelectChapter(chId);
    }
  };

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader 
        phase={Phase.CHAPTER_SELECTION} 
        onHelp={() => game.setIsHelpOpen(true)} 
        onSettings={() => game.setIsSettingsOpen(true)} 
        onExit={onBack} 
        credits={credits} 
      />
      
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center max-w-4xl mx-auto w-full pt-10 pb-32 animate-in fade-in duration-700">
         <div className="w-full space-y-12">
            <div className="text-center space-y-4">
               <h2 className="text-5xl sm:text-7xl font-black italic uppercase text-white tracking-tighter">NETWORK_DEPTH</h2>
               <p className="text-slate-500 font-mono text-[9px] uppercase tracking-[0.4em]">SELECT_SECTOR: MAP ARCHIVE ACCESS GRANTED</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
               {chapters.map((ch) => (
                  <button 
                    key={ch.id}
                    onClick={() => handleChapterClick(ch.id, ch.isLocked)}
                    disabled={ch.isLocked}
                    className={`w-full bg-slate-900/40 backdrop-blur-xl border p-8 rounded-[3rem] text-left group transition-all relative overflow-hidden flex flex-col sm:flex-row items-center gap-8
                       ${ch.isLocked 
                         ? 'border-slate-950 opacity-40 cursor-not-allowed' 
                         : 'border-slate-800 hover:border-teal-500 hover:scale-[1.01]'}`}
                  >
                     {/* FIXED ICON CONTAINER LOGIC */}
                     <div className={`h-24 w-24 rounded-3xl flex items-center justify-center shrink-0 border transition-all 
                        ${ch.isLocked 
                           ? 'bg-black border-slate-900 text-slate-800' 
                           : 'bg-teal-500/10 border-teal-500/30 text-teal-400 group-hover:scale-110'}`}
                     >
                        {ch.isLocked ? <Lock size={40} /> : <Map size={40} />}
                     </div>

                     <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 mb-3">
                           <div>
                              <div className="text-[8px] font-mono text-teal-500 uppercase tracking-[0.3em] mb-1">{ch.tagline}</div>
                              <h3 className={`text-2xl sm:text-4xl font-black italic uppercase transition-colors ${ch.isLocked ? 'text-slate-700' : 'text-white group-hover:text-teal-400'}`}>
                                 CHAPTER {ch.id}: {ch.name}
                              </h3>
                           </div>
                           {!ch.isLocked && (
                             <div className="bg-black/60 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-2">
                                <Radio size={10} className="text-teal-400 animate-pulse" />
                                <span className="text-[7px] font-black uppercase text-teal-500 tracking-widest">Sector_Active</span>
                             </div>
                           )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-relaxed max-w-lg">
                           {ch.isLocked ? "ACCESS_RESTRICTED // DECRYPT PREVIOUS SECTORS TO UNLOCK DATA" : ch.description}
                        </p>
                     </div>
                  </button>
               ))}
            </div>

            <Button variant="ghost" className="w-full py-4 rounded-3xl" onClick={onBack}>
               <ChevronLeft size={16} /> Return to Deployment Type
            </Button>
         </div>
      </div>
    </ScreenWrapper>
  );
};