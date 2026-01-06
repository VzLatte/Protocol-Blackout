
import React, { useState } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel, UnitType } from '../../types';
import { UNITS, UNIT_PRICES } from '../../operativeRegistry';
import { Lock, ShieldCheck, Zap, Database, ChevronRight, AlertCircle, Heart, Activity, Target, Trophy, Info, FileText } from 'lucide-react';
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
  const { unlockedUnits, cipheredUnits, credits, purchaseUnit, visualLevel, masteryLevels, getMastery } = game;
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);

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
                      onClick={() => setSelectedUnit(u.type)}
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

  const selectedUnitData = selectedUnit ? UNITS[selectedUnit] : null;

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
        </div>
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!selectedUnit} 
        onClose={() => setSelectedUnit(null)} 
        title={`${selectedUnitData?.name}_PROTOCOL_DATA`}
        maxWidth="max-w-3xl"
      >
        {selectedUnitData && (
          <div className="space-y-10 pb-10">
            {/* Visual Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="aspect-square bg-slate-950 border border-slate-800 rounded-[3rem] overflow-hidden relative group">
                {/* Image Placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 uppercase font-black text-center p-10 select-none">
                  <div className="text-4xl italic mb-2 tracking-tighter group-hover:scale-110 transition-transform">NO_UPLINK</div>
                  <div className="text-[10px] font-mono tracking-widest opacity-50">Visual Data Corrupted or Missing</div>
                  <div className="mt-4 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-800 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-800 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-800 animate-pulse delay-150"></div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="bg-teal-500/10 border border-teal-500/30 p-3 rounded-2xl backdrop-blur-md">
                    <div className="text-[7px] font-mono text-teal-500 uppercase">Mastery Rank</div>
                    <div className="text-xl font-black text-white italic">{getMastery(selectedUnit!)}</div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-[9px] font-mono text-slate-400 uppercase">
                    ID: {selectedUnit}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                   <h3 className="text-teal-400 font-black italic text-4xl mb-1">{selectedUnitData.name}</h3>
                   <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">{selectedUnitData.role} SPECIALIST</div>
                   <p className="text-sm text-slate-400 font-mono leading-relaxed italic">
                     "{selectedUnitData.description}"
                   </p>
                </div>

                {/* Stats Dashboard */}
                <div className="bg-black/40 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-teal-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Performance Metrics</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase">
                        <span>Integrity (HP)</span>
                        <span className="text-white">{selectedUnitData.hp}</span>
                      </div>
                      <ProgressBar value={selectedUnitData.hp} max={1500} color="bg-red-500" height="h-1" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase">
                        <span>Speed Latency</span>
                        <span className="text-white">{selectedUnitData.speed} / 10</span>
                      </div>
                      <ProgressBar value={selectedUnitData.speed} max={10} color="bg-teal-500" height="h-1" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase">
                        <span>Focus Clarity</span>
                        <span className="text-white">{selectedUnitData.focus}%</span>
                      </div>
                      <ProgressBar value={selectedUnitData.focus} max={50} color="bg-sky-500" height="h-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical & Lore Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-teal-400 border-b border-slate-800 pb-2">
                   <Target size={16} />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Combat Protocol</h4>
                 </div>
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
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-amber-500 border-b border-slate-800 pb-2">
                   <FileText size={16} />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Archive Truth</h4>
                 </div>
                 <div className="bg-amber-950/10 border border-amber-900/30 p-6 rounded-2xl">
                    <p className="text-xs text-amber-200/70 italic font-mono leading-relaxed">
                      "{selectedUnitData.truth}"
                    </p>
                    <div className="h-[1px] w-12 bg-amber-900/50 mt-4"></div>
                    <div className="mt-2 text-[7px] font-mono text-amber-900 uppercase tracking-widest italic">Encrypted User_Data // Source_ID: UNKNOWN</div>
                 </div>
              </div>
            </div>

            <Button variant="primary" className="w-full py-5" onClick={() => setSelectedUnit(null)}>
              Exit Protocol View
            </Button>
          </div>
        )}
      </Modal>
    </ScreenWrapper>
  );
};
