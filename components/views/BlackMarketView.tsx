
import React, { useState, useEffect, useRef } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, Mod, UnitType, Item } from '../../types';
import { Button } from '../ui/Button';
import { Briefcase, Lock, Database, ChevronLeft, Fingerprint, ShieldAlert, Cpu, HardDrive, UserPlus, Zap, ShieldCheck, AlertCircle, Trophy, Activity, Target, FileText, ShoppingCart, Plus, Check, Crosshair, Shield, Repeat } from 'lucide-react';
import { MATERIAL_LORE } from '../../constants';
import { UNITS, UNIT_PRICES } from '../../operativeRegistry';
import { Modal } from '../ui/Modal';
import { ProgressBar } from '../ui/ProgressBar';

interface BlackMarketViewProps {
  game: any;
  onBack: () => void;
  setHideNav?: (hidden: boolean) => void;
}

const CASES = [
  { id: 'COMMON', name: "Courier Satchel", cost: 250, desc: "Scuffed leather, analog locks.", color: "text-slate-400", bg: "bg-slate-800", icon: <Briefcase size={20}/>, clearance: "L-1" },
  { id: 'RARE', name: "Secure Hardcase", cost: 500, desc: "Matte black polymer.", color: "text-teal-400", bg: "bg-slate-900", icon: <HardDrive size={20}/>, clearance: "L-3" },
  { id: 'EPIC', name: "Cryo-Briefcase", cost: 1200, desc: "Brushed steel, frost edges.", color: "text-sky-400", bg: "bg-slate-950", icon: <Fingerprint size={20}/>, clearance: "L-5" },
  { id: 'LEGENDARY', name: "Classified Core", cost: 3000, desc: "Floating magnetic seals.", color: "text-amber-500", bg: "bg-black", icon: <Cpu size={20}/>, clearance: "OMNI" }
];

const CREDIT_PACKS = [
  { id: 'starter', name: "Daily Injection", amount: 250, cost: "FREE", isPromo: true },
  { id: 'small', name: "Small Bag", amount: 1000, cost: "$1.99" },
  { id: 'medium', name: "Encrypted Cache", amount: 2500, cost: "$4.99", recommended: true },
  { id: 'large', name: "Vault Access", amount: 6000, cost: "$9.99" },
];

export const BlackMarketView: React.FC<BlackMarketViewProps> = ({ game, onBack, setHideNav }) => {
  const { credits, setCredits, visualLevel, playSfx, openChest, unlockedUnits, cipheredUnits, purchaseUnit, getMastery } = game;
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'SUPPLIES' | 'RECRUITMENT'>('SUPPLIES');

  // Supplies State
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [viewState, setViewState] = useState<'BROWSE' | 'HACKING' | 'OPENING' | 'REVEAL'>('BROWSE');
  const [hackProgress, setHackProgress] = useState(0);
  const [hackNodes, setHackNodes] = useState<{id: number, x: number, y: number, active: boolean}[]>([]);
  const [openedLoot, setOpenedLoot] = useState<{ mod: Mod | null, item: Item | null, materials: any, wasDuplicate?: boolean } | null>(null);
  const [purchasedPack, setPurchasedPack] = useState<string | null>(null);
  
  // Recruitment State
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);
  const selectedUnitData = selectedUnit ? UNITS[selectedUnit] : null;

  useEffect(() => {
    if (setHideNav) {
      setHideNav(viewState !== 'BROWSE');
    }
    return () => {
      if (setHideNav) setHideNav(false);
    };
  }, [viewState, setHideNav]);

  // Hacking Game Loop
  useEffect(() => {
    if (viewState === 'HACKING') {
      const interval = setInterval(() => {
        setHackNodes(prev => {
           // Spawn new node occasionally if < 5
           if (prev.length < 5 && Math.random() > 0.3) {
              return [...prev, { id: Math.random(), x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, active: true }];
           }
           return prev;
        });
      }, 600);
      return () => clearInterval(interval);
    }
  }, [viewState]);

  const handleSelectCase = (c: any) => {
    if (credits >= c.cost) {
       setSelectedCase(c);
       // Skip hacking for Common/Rare, enforce for Epic/Legendary
       if (c.id === 'EPIC' || c.id === 'LEGENDARY') {
          setViewState('HACKING');
          setHackProgress(0);
          setHackNodes([]);
       } else {
          startOpening(c.id);
       }
       playSfx('confirm');
    } else {
       playSfx('cancel');
    }
  };

  const onNodeTap = (id: number) => {
     setHackNodes(prev => prev.filter(n => n.id !== id));
     setHackProgress(prev => {
        const next = prev + 20;
        if (next >= 100) {
           playSfx('success');
           setTimeout(() => startOpening(selectedCase.id), 500);
        } else {
           playSfx('beep');
        }
        return next;
     });
  };

  const startOpening = (tier: any) => {
     const result = openChest(tier);
     setOpenedLoot(result);
     setViewState('OPENING');
     playSfx('startup'); // Hydraulic hiss
     
     // Animation Timer
     setTimeout(() => {
        setViewState('REVEAL');
        playSfx('buy'); // Click/Open
     }, 2000);
  };

  const reset = () => {
     setViewState('BROWSE');
     setSelectedCase(null);
     setOpenedLoot(null);
  };

  const handlePurchaseCredits = (pack: any) => {
    if (purchasedPack) return;
    setPurchasedPack(pack.id);
    playSfx('success');
    
    // Simulate API delay
    setTimeout(() => {
      setCredits((prev: number) => prev + pack.amount);
      setPurchasedPack(null);
    }, 1000);
  };

  const renderRecruitmentTier = (tier: number) => {
    const unitsInTier = Object.values(UNITS).filter(u => UNIT_PRICES[u.type].tier === tier);
    
    return (
      <div key={tier} className="space-y-6 w-full animate-in slide-in-from-right duration-500">
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
                      onClick={() => { purchaseUnit(u.type); playSfx('buy'); }}
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

  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
       <GlobalHeader phase={Phase.STORE} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={onBack} credits={credits} />
       
       <div className="flex-1 p-6 flex flex-col max-w-6xl mx-auto w-full pt-10 pb-28 relative">
          
          {/* Header & Tabs */}
          <div className="flex flex-col gap-6 mb-8 border-b border-slate-800 pb-4">
             <div>
                <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">BLACK MARKET</h2>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Underground Network Access</p>
             </div>
             
             {viewState === 'BROWSE' && (
                <div className="flex bg-slate-900/80 rounded-xl p-1 border border-slate-800 backdrop-blur-md w-fit">
                   <button 
                      onClick={() => { setActiveTab('SUPPLIES'); playSfx('beep'); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'SUPPLIES' ? 'bg-teal-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                   >
                      <Briefcase size={12} /> Supplies
                   </button>
                   <button 
                      onClick={() => { setActiveTab('RECRUITMENT'); playSfx('beep'); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'RECRUITMENT' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                   >
                      <UserPlus size={12} /> Recruitment
                   </button>
                </div>
             )}
          </div>

          {/* TAB: SUPPLIES */}
          {activeTab === 'SUPPLIES' && (
             <div className="space-y-10">
               {/* BROWSE MODE */}
               {viewState === 'BROWSE' && (
                  <>
                    {/* Dark Web Exchange (Microtransactions) */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2 text-slate-400">
                            <ShoppingCart size={16} className="text-amber-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Dark Web Exchange</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {CREDIT_PACKS.map(pack => (
                                <button
                                    key={pack.id}
                                    onClick={() => handlePurchaseCredits(pack)}
                                    className={`relative bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:bg-slate-800 hover:border-slate-600 ${pack.recommended ? 'ring-1 ring-amber-500/50' : ''}`}
                                >
                                    {pack.recommended && (
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Best Value</div>
                                    )}
                                    <div className="bg-black/40 p-2 rounded-xl mb-2">
                                        <Database size={18} className="text-sky-400" />
                                    </div>
                                    <div className="text-sm font-black text-white italic mb-1">+{pack.amount}</div>
                                    <div className="text-[9px] font-mono text-slate-500 uppercase mb-3">{pack.name}</div>
                                    <div className={`text-xs font-bold px-3 py-1 rounded-lg w-full ${purchasedPack === pack.id ? 'bg-teal-500 text-black' : 'bg-slate-950 text-slate-300'}`}>
                                        {purchasedPack === pack.id ? <Check size={14} className="mx-auto"/> : pack.cost}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Supply Crates Grid */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Briefcase size={16} className="text-teal-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Supply Drops</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {CASES.map(c => {
                                const canAfford = credits >= c.cost;
                                return (
                                <button 
                                    key={c.id} 
                                    onClick={() => handleSelectCase(c)}
                                    className={`group relative p-4 rounded-[1.5rem] border transition-all text-left flex flex-col justify-between min-h-[200px]
                                        ${canAfford ? `${c.bg} border-slate-700 hover:border-slate-500 hover:scale-[1.02]` : 'bg-slate-950 border-slate-900 opacity-60 cursor-not-allowed'}`}
                                >
                                    <div className="space-y-2 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className={`p-2 rounded-xl bg-black/40 border border-slate-700 ${c.color}`}>
                                                {c.icon}
                                            </div>
                                            <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-current ${canAfford ? 'text-slate-500' : 'text-red-500'}`}>
                                                {c.clearance}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black italic text-white uppercase leading-tight mb-1">{c.name}</h3>
                                            <p className="text-[9px] text-slate-400 font-mono leading-tight">{c.desc}</p>
                                        </div>
                                    </div>

                                    {/* Visual Representation of Briefcase */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                        <Briefcase size={80} className={c.color} />
                                    </div>

                                    <div className="relative z-10 pt-3 border-t border-slate-700/50 mt-2">
                                        <div className={`text-sm font-black font-mono ${canAfford ? 'text-white' : 'text-red-500'}`}>
                                            {c.cost} CR
                                        </div>
                                        <div className="text-[7px] uppercase text-slate-500 tracking-widest mt-0.5">
                                            {canAfford ? 'INTERCEPT' : 'NO FUNDS'}
                                        </div>
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                    </div>
                  </>
               )}

               {/* HACKING MINIGAME */}
               {viewState === 'HACKING' && (
                  <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center">
                     <div className="w-full max-w-md aspect-square bg-slate-900 border border-slate-700 rounded-[2rem] relative overflow-hidden shadow-2xl p-4">
                        <div className="absolute top-4 left-4 text-teal-500 font-mono text-xs animate-pulse">BYPASSING_BIOMETRICS...</div>
                        
                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 h-2 bg-slate-800 w-full">
                           <div className="h-full bg-teal-500 transition-all duration-200" style={{width: `${hackProgress}%`}}></div>
                        </div>

                        {/* Nodes */}
                        {hackNodes.map(node => (
                           <button
                              key={node.id}
                              onClick={() => onNodeTap(node.id)}
                              className="absolute w-12 h-12 rounded-full border-2 border-teal-500 bg-teal-500/20 text-teal-400 flex items-center justify-center animate-in zoom-in duration-200 hover:bg-teal-500 hover:text-black transition-colors"
                              style={{ top: `${node.y}%`, left: `${node.x}%` }}
                           >
                              <Fingerprint size={20} />
                           </button>
                        ))}
                     </div>
                     <div className="mt-8 text-slate-500 font-mono text-xs uppercase tracking-widest">Tap nodes to decrypt signature</div>
                  </div>
               )}

               {/* OPENING ANIMATION & REVEAL */}
               {(viewState === 'OPENING' || viewState === 'REVEAL') && (
                  <div className="absolute inset-0 z-50 bg-[#0a0f1e] flex flex-col items-center justify-center p-4">
                     
                     {/* 3D Briefcase Container */}
                     <div className="relative w-full max-w-2xl h-[400px] perspective-1000">
                        
                        {/* The Case Itself */}
                        <div className="relative w-full h-full transform-style-3d transition-all duration-1000">
                           
                           {/* Lid (Top Half) */}
                           <div 
                              className={`absolute top-0 left-0 right-0 h-[50%] bg-[#1a1a1a] border-4 border-[#333] rounded-t-3xl origin-bottom transition-transform duration-1000 ease-in-out z-20 flex items-center justify-center
                              ${viewState === 'REVEAL' ? 'rotate-x-90 -translate-y-[80%]' : 'rotate-x-0'}`}
                              style={{ transformStyle: 'preserve-3d' }}
                           >
                              <div className="text-slate-600 font-black uppercase tracking-widest text-2xl opacity-20 transform rotate-180">TOP SECRET</div>
                              {/* Latch */}
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 bg-slate-400 rounded-t-lg border-t border-white/20"></div>
                           </div>

                           {/* Base (Bottom Half) */}
                           <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-[#151515] border-4 border-[#222] rounded-b-3xl z-10 overflow-hidden shadow-2xl">
                              
                              {/* Interior Foam */}
                              <div className="absolute inset-2 bg-foam rounded-2xl shadow-inner flex items-center justify-center p-8">
                                 
                                 {/* Items inside Foam */}
                                 <div className={`grid grid-cols-2 gap-8 w-full h-full transition-opacity duration-1000 delay-500 ${viewState === 'REVEAL' ? 'opacity-100' : 'opacity-0'}`}>
                                    
                                    {/* Item Slot */}
                                    <div className="bg-[#0a0a0a] rounded-xl shadow-[inset_0_0_10px_black] flex items-center justify-center relative group p-4">
                                       {openedLoot?.item ? (
                                          <div className="text-center animate-in zoom-in duration-500 delay-700 w-full">
                                             <div className={`inline-block p-4 rounded-full mb-3 ${openedLoot.wasDuplicate ? 'bg-amber-500/20 text-amber-500' : 'bg-teal-500/20 text-teal-500'}`}>
                                                {openedLoot.item.slot === 'PRIMARY' ? <Crosshair size={32} /> : 
                                                 openedLoot.item.slot === 'SHIELD' ? <Shield size={32} /> : <Activity size={32} />}
                                             </div>
                                             <div className="text-sm font-black uppercase text-white truncate max-w-[140px] mx-auto">{openedLoot.item.name}</div>
                                             
                                             {openedLoot.wasDuplicate ? (
                                                <div className="flex items-center justify-center gap-2 mt-2 text-amber-500 font-mono text-[9px] uppercase tracking-widest border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded">
                                                   <Repeat size={10} /> Duplicate Scrapped
                                                </div>
                                             ) : (
                                                <div className="text-[9px] font-mono text-teal-400 uppercase tracking-widest mt-2">New Protocol</div>
                                             )}
                                          </div>
                                       ) : (
                                          <div className="text-slate-700 font-mono text-[9px] uppercase tracking-widest opacity-50">Empty Slot</div>
                                       )}
                                    </div>

                                    {/* Materials Slot */}
                                    <div className="bg-[#0a0a0a] rounded-xl shadow-[inset_0_0_10px_black] flex flex-col gap-2 p-4 overflow-y-auto custom-scrollbar">
                                       {openedLoot?.materials && Object.entries(openedLoot.materials).map(([k, v]) => (v as number) > 0 && (
                                          <div key={k} className="flex justify-between items-center text-[8px] font-mono text-slate-400 border-b border-slate-800 pb-1 last:border-0 animate-in slide-in-from-right duration-300 delay-1000">
                                             <span>{k.replace('_', ' ')}</span>
                                             <span className="text-white font-bold">x{v as number}</span>
                                          </div>
                                       ))}
                                    </div>

                                 </div>
                              </div>
                           </div>

                        </div>
                     </div>

                     {/* Evidence Log / Text */}
                     {viewState === 'REVEAL' && (
                        <div className="mt-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                           <div className="inline-block clearance-stamp text-red-500 border-red-500">
                              EVIDENCE_SECURED
                           </div>
                           
                           {/* Only show Analyst Note for specific high-tier mats */}
                           {(openedLoot?.materials['NEURAL_GLASS'] > 0 || openedLoot?.materials['ISOTOPE_7'] > 0) && (
                              <div className="max-w-md bg-slate-900/80 border border-slate-700 p-4 rounded-xl text-left mx-auto">
                                 <div className="flex items-center gap-2 mb-2 text-amber-500 border-b border-slate-700 pb-2">
                                    <ShieldAlert size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Analyst Note</span>
                                 </div>
                                 <p className="text-[10px] font-mono text-slate-400 leading-relaxed italic">
                                    "{MATERIAL_LORE['NEURAL_GLASS']}"
                                 </p>
                              </div>
                           )}

                           <Button variant="primary" className="w-full py-4 shadow-xl" onClick={reset}>
                              LOG EVIDENCE & RETURN
                           </Button>
                        </div>
                     )}

                  </div>
               )}
             </div>
          )}

          {/* TAB: RECRUITMENT */}
          {activeTab === 'RECRUITMENT' && (
             <div className="space-y-12 pb-10">
                {[1, 2, 3].map(tier => renderRecruitmentTier(tier))}
             </div>
          )}

          {/* Footer Nav */}
          {viewState === 'BROWSE' && (
             <div className="mt-8">
                <Button variant="ghost" className="w-full py-4 rounded-3xl" onClick={onBack}>
                   <ChevronLeft size={16} /> Return to Terminal
                </Button>
             </div>
          )}
       </div>

       {/* Unit Detail Modal (Recruitment) */}
       <Modal 
        isOpen={!!selectedUnit} 
        onClose={() => setSelectedUnit(null)} 
        title={`${selectedUnitData?.name || 'UNIT'}_PROTOCOL_DATA`}
        maxWidth="max-w-3xl"
      >
        {selectedUnitData && (
          <div className="space-y-10 pb-10">
            {/* Visual Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="aspect-square bg-slate-950 border border-slate-800 rounded-[3rem] overflow-hidden relative group">
                {/* Image Display */}
                {selectedUnitData.image ? (
                   <div className="absolute inset-0 p-4">
                      <img 
                         src={selectedUnitData.image} 
                         alt={selectedUnitData.name} 
                         className="w-full h-full object-contain filter group-hover:brightness-110 transition-all duration-700"
                      />
                      {/* Scanline Overlay on Image */}
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-teal-500/5 to-transparent opacity-20 animate-scanline"></div>
                   </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 uppercase font-black text-center p-10 select-none">
                    <div className="text-4xl italic mb-2 tracking-tighter group-hover:scale-110 transition-transform">NO_UPLINK</div>
                    <div className="text-[10px] font-mono tracking-widest opacity-50">Visual Data Corrupted or Missing</div>
                  </div>
                )}
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
