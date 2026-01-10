
import React, { useState } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel, UnitType, MaterialType } from '../../types';
import { UNITS, UNIT_PRICES } from '../../operativeRegistry';
import { MASTERY_TREES } from '../../masteryRegistry';
import { Lock, ShieldCheck, Zap, Database, ChevronRight, AlertCircle, Heart, Activity, Target, Trophy, Info, FileText, Cpu, GitBranch, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProgressBar } from '../ui/ProgressBar';

interface OperativesListViewProps {
  game: any;
  onHelp: () => void;
  onSettings: () => void;
}

export const OperativesListView: React.FC<OperativesListViewProps> = ({ 
  game, onHelp, onSettings
}) => {
  const { unlockedUnits, cipheredUnits, credits, purchaseUnit, visualLevel, getMastery, unitMastery, unlockMasteryNode, materials } = game;
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);
  const [detailTab, setDetailTab] = useState<'DATA' | 'MASTERY'>('DATA');

  const selectedUnitData = selectedUnit ? UNITS[selectedUnit] : null;
  const selectedTree = selectedUnit ? MASTERY_TREES[selectedUnit] : [];
  const currentCyberCores = materials[MaterialType.CYBER_CORE] || 0;

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
            const isCiphered = cipheredUnits.includes(u.type);
            const price = UNIT_PRICES[u.type].cost;
            const canAfford = credits >= price;

            return (
              <div 
                key={u.type} 
                className={`bg-slate-900/60 backdrop-blur-xl border p-8 rounded-[3rem] transition-all relative overflow-hidden group
                  ${isUnlocked ? 'border-slate-800' : isCiphered ? 'border-slate-700' : 'border-slate-900 shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]'}`}
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="text-teal-500 font-mono text-[8px] uppercase tracking-widest mb-1">{u.role}</div>
                    <h3 className={`text-3xl font-black italic uppercase transition-colors glitch-text ${isUnlocked ? 'text-white group-hover:text-teal-400' : isCiphered ? 'text-slate-300' : 'text-slate-600'}`}>
                      {u.name}
                    </h3>
                  </div>
                  {isUnlocked ? (
                    <ShieldCheck size={24} className="text-teal-500/50" />
                  ) : !isCiphered ? (
                    <div className="bg-red-500/10 p-2 rounded-xl text-red-500 animate-pulse">
                      <Lock size={18} />
                    </div>
                  ) : (
                    <div className="bg-teal-500/10 p-2 rounded-xl text-teal-500">
                      <Zap size={18} />
                    </div>
                  )}
                </div>

                {/* Thumbnail Preview */}
                {isUnlocked && u.image && (
                   <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none -mr-8 -mt-4 grayscale group-hover:grayscale-0">
                      <img src={u.image} alt={u.name} className="w-full h-full object-contain rotate-12" />
                   </div>
                )}
                
                <p className={`text-xs italic mb-8 leading-relaxed relative z-10 ${isUnlocked ? 'text-slate-400' : isCiphered ? 'text-slate-500' : 'text-slate-700'}`}>
                  {isUnlocked ? `"${u.description}"` : isCiphered ? "NEURAL_CIPHER_FOUND: Encryption broken. Establish link via merit injection." : "ENCRYPTED_DATA_LINK: Mission defeat of this Cipher required for decryption."}
                </p>
                
                {isUnlocked ? (
                  <div className="space-y-3 relative z-10">
                    <div className="bg-black/40 border border-slate-800/50 p-6 rounded-3xl">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-teal-400">
                          <Trophy size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Mastery Level {getMastery(u.type)}</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-mono text-slate-300 leading-relaxed uppercase tracking-tight italic line-clamp-2">
                        {u.special}
                      </p>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full py-4 rounded-2xl"
                      onClick={() => { setSelectedUnit(u.type); setDetailTab('DATA'); }}
                    >
                      View Protocol Details
                    </Button>
                  </div>
                ) : !isCiphered ? (
                  <div className="bg-red-950/20 border border-red-900/40 p-5 rounded-3xl flex items-center gap-4 relative z-10">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <div className="text-[9px] font-mono text-red-400 uppercase tracking-tighter italic">DECRYPTION_REQUIRED // FIND UNIT IN CAMPAIGN NODES</div>
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
                      {canAfford ? 'INJECT MERIT // UNLOCK' : 'INSUFFICIENT MERIT'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMasteryNode = (node: any) => {
      if (!selectedUnit) return null;
      const isUnlocked = unitMastery[selectedUnit].includes(node.id);
      const parentUnlocked = !node.parentId || unitMastery[selectedUnit].includes(node.parentId);
      const isConflict = node.conflictId && unitMastery[selectedUnit].includes(node.conflictId);
      
      const isAffordable = currentCyberCores >= node.cost;
      const canUnlock = !isUnlocked && parentUnlocked && !isConflict && isAffordable;

      const isGate = node.type === 'GATE';
      
      // Node Style
      let bg = 'bg-slate-900';
      let border = 'border-slate-700';
      let text = 'text-slate-500';
      
      if (isUnlocked) {
          bg = isGate ? 'bg-amber-500/20' : 'bg-teal-500/20';
          border = isGate ? 'border-amber-500' : 'border-teal-500';
          text = 'text-white';
      } else if (canUnlock) {
          bg = 'bg-slate-800 hover:bg-slate-700';
          border = 'border-white animate-pulse';
          text = 'text-white';
      } else if (isConflict) {
          bg = 'bg-red-950/20';
          border = 'border-red-900/50';
          text = 'text-red-900';
      }

      return (
          <div key={node.id} className="flex-shrink-0 flex flex-col items-center gap-2 relative group w-48">
              {/* Connector Line (Left) */}
              {node.parentId && (
                  <div className={`absolute top-8 -left-8 w-8 h-0.5 z-0 ${isUnlocked ? (isGate ? 'bg-amber-500' : 'bg-teal-500') : 'bg-slate-800'}`}></div>
              )}

              <button 
                  disabled={!canUnlock && !isUnlocked}
                  onClick={() => {
                      if (canUnlock) {
                          unlockMasteryNode(selectedUnit, node.id);
                          game.playSfx('buy');
                      }
                  }}
                  className={`relative w-16 h-16 flex items-center justify-center transition-all z-10 
                      ${isGate ? 'rotate-45 rounded-lg' : 'rounded-full'} 
                      ${bg} border-2 ${border} shadow-lg`}
              >
                  <div className={isGate ? '-rotate-45' : ''}>
                      {isUnlocked ? (
                          isGate ? <GitBranch size={24} className="text-amber-500"/> : <Cpu size={24} className="text-teal-500"/>
                      ) : (
                          <div className="text-[10px] font-black">{node.cost} CC</div>
                      )}
                  </div>
              </button>

              <div className="text-center mt-2 px-2">
                  <div className={`text-[10px] font-black uppercase ${text}`}>{node.name}</div>
                  <div className="text-[8px] font-mono text-slate-500 leading-tight mt-1">{node.description}</div>
                  {isConflict && <div className="text-[8px] text-red-500 font-bold uppercase mt-1">LOCKED BY CHOICE</div>}
              </div>
          </div>
      );
  };

  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.SETUP_PLAYERS} onHelp={onHelp} onSettings={onSettings} onExit={() => {}} credits={credits} />
      
      <div className="flex-1 p-6 space-y-12 max-w-5xl mx-auto w-full pt-10 pb-32 overflow-y-auto custom-scrollbar">
        <div className="text-center space-y-4">
           <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">OPERATIVES_TERMINAL</h2>
           <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Review unlocked tactical protocols and system rosters</p>
        </div>
        {[1, 2, 3].map(tier => renderTier(tier))}
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!selectedUnit} 
        onClose={() => setSelectedUnit(null)} 
        title={`${selectedUnitData?.name || 'UNIT'}_PROTOCOL_DATA`}
        maxWidth="max-w-4xl"
      >
        {selectedUnitData && (
          <div className="space-y-6 pb-6">
            {/* Modal Navigation */}
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 w-fit mx-auto mb-6">
               <button 
                  onClick={() => setDetailTab('DATA')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${detailTab === 'DATA' ? 'bg-teal-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
               >
                  Protocol Data
               </button>
               <button 
                  onClick={() => setDetailTab('MASTERY')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${detailTab === 'MASTERY' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
               >
                  Mastery Path
               </button>
            </div>

            {/* CONTENT: DATA TAB */}
            {detailTab === 'DATA' && (
                <div className="space-y-10 animate-in slide-in-from-left duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="aspect-square bg-slate-950 border border-slate-800 rounded-[3rem] overflow-hidden relative group">
                        {selectedUnitData.image ? (
                        <div className="absolute inset-0 p-4">
                            <img src={selectedUnitData.image} alt={selectedUnitData.name} className="w-full h-full object-contain filter group-hover:brightness-110 transition-all duration-700"/>
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-teal-500/5 to-transparent opacity-20 animate-scanline"></div>
                        </div>
                        ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 uppercase font-black text-center p-10 select-none">
                            <div className="text-4xl italic mb-2 tracking-tighter">NO_UPLINK</div>
                        </div>
                        )}
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                        <div className="bg-teal-500/10 border border-teal-500/30 p-3 rounded-2xl backdrop-blur-md">
                            <div className="text-[7px] font-mono text-teal-500 uppercase">Mastery Rank</div>
                            <div className="text-xl font-black text-white italic">{getMastery(selectedUnit!)}</div>
                        </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                        <h3 className="text-teal-400 font-black italic text-4xl mb-1">{selectedUnitData.name}</h3>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">{selectedUnitData.role} SPECIALIST</div>
                        <p className="text-sm text-slate-400 font-mono leading-relaxed italic">"{selectedUnitData.description}"</p>
                        </div>

                        <div className="bg-black/40 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={14} className="text-teal-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Performance Metrics</span>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase"><span>Integrity</span><span className="text-white">{selectedUnitData.hp}</span></div>
                            <ProgressBar value={selectedUnitData.hp} max={1500} color="bg-red-500" height="h-1" />
                            </div>
                            <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase"><span>Speed</span><span className="text-white">{selectedUnitData.speed} / 10</span></div>
                            <ProgressBar value={selectedUnitData.speed} max={10} color="bg-teal-500" height="h-1" />
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <div className="text-[8px] font-mono text-slate-600 uppercase mb-1 tracking-widest">Active Skill</div>
                            <div className="text-xs text-white font-bold mb-1 uppercase">{selectedUnitData.activeDesc.split(':')[0]}</div>
                            <p className="text-[10px] text-slate-500 font-mono leading-relaxed">{selectedUnitData.activeDesc}</p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <div className="text-[8px] font-mono text-slate-600 uppercase mb-1 tracking-widest">Passive Logic</div>
                            <p className="text-[10px] text-slate-300 font-mono leading-relaxed">{selectedUnitData.passiveDesc}</p>
                        </div>
                    </div>
                    <div className="bg-amber-950/10 border border-amber-900/30 p-6 rounded-2xl">
                        <p className="text-xs text-amber-200/70 italic font-mono leading-relaxed">"{selectedUnitData.truth}"</p>
                    </div>
                    </div>
                </div>
            )}

            {/* CONTENT: MASTERY TAB */}
            {detailTab === 'MASTERY' && (
                <div className="space-y-8 animate-in slide-in-from-right duration-300 min-h-[400px]">
                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                        <div>
                            <h3 className="text-xl font-black italic text-amber-500 uppercase">Logic Gates</h3>
                            <p className="text-[10px] text-slate-500 font-mono">Upgrade Core Systems with Cyber Cores.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Available Cores</div>
                                <div className="text-2xl font-black text-white italic">{currentCyberCores}</div>
                            </div>
                            <Cpu size={32} className="text-amber-500 opacity-80" />
                        </div>
                    </div>

                    <div className="relative overflow-x-auto custom-scrollbar pb-8">
                        <div className="flex items-start gap-4 min-w-max px-4 pt-4">
                            <div className="flex flex-col items-center justify-center h-16 mr-4 opacity-50">
                                <div className="text-[8px] font-mono uppercase -rotate-90 tracking-widest text-slate-500 whitespace-nowrap">START SEQUENCE</div>
                            </div>
                            
                            {/* Render Logic Tree */}
                            {selectedTree.length > 0 ? (
                                selectedTree.map(node => renderMasteryNode(node))
                            ) : (
                                <div className="w-full text-center py-10 text-slate-600 font-mono text-xs uppercase">
                                    No Data Path Found.
                                </div>
                            )}
                            
                            <div className="flex flex-col items-center justify-center h-16 ml-4 opacity-50">
                                <ArrowRight size={24} className="text-slate-700"/>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-slate-800/50 text-center">
                        <p className="text-[9px] text-slate-500 font-mono italic">
                            WARNING: Logic Gates (Diamond Nodes) are mutually exclusive. Choosing one path permanently locks the other. Choose wisely.
                        </p>
                    </div>
                </div>
            )}

            <Button variant="primary" className="w-full py-5" onClick={() => setSelectedUnit(null)}>
              Exit Protocol View
            </Button>
          </div>
        )}
      </Modal>
    </ScreenWrapper>
  );
};
