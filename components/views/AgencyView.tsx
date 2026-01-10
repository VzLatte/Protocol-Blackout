
import React, { useState } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, MaterialType } from '../../types';
import { Button } from '../ui/Button';
import { Briefcase, Trophy, Star, CheckCircle, Lock, Gift, Shield } from 'lucide-react';
import { BATTLE_PASS_REWARDS } from '../../constants';
import { ProgressBar } from '../ui/ProgressBar';

interface AgencyViewProps {
  game: any;
  onBack: () => void;
}

export const AgencyView: React.FC<AgencyViewProps> = ({ game, onBack }) => {
  const { standing, contracts, claimContract, battlePassXp, claimedBpRewards, setClaimedBpRewards, materials, setMaterials, setCredits, addMod } = game;
  const [subTab, setSubTab] = useState<'CONTRACTS' | 'BATTLEPASS' | 'STANDING'>('CONTRACTS');

  const currentLevel = Math.floor(battlePassXp / 1000) + 1;
  const xpInLevel = battlePassXp % 1000;

  const handleClaimBp = (reward: any) => {
     if (claimedBpRewards.includes(reward.level)) return;
     if (currentLevel < reward.level) return;

     const newClaimed = [...claimedBpRewards, reward.level];
     setClaimedBpRewards(newClaimed);
     
     // Grant Reward
     if (reward.type === 'CURRENCY') setCredits((p: number) => p + reward.value);
     if (reward.type === 'MATERIAL') setMaterials((p: any) => ({...p, [reward.material]: p[reward.material] + reward.value}));
     if (reward.type === 'ITEM') addMod(reward.itemId);
     
     game.playSfx('success');
  };

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.MENU} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => {}} credits={game.credits} xp={game.xp} />
      
      <div className="flex-1 flex flex-col p-4 sm:p-6 pb-32 max-w-5xl mx-auto w-full">
         <div className="flex flex-col gap-6 mb-8">
            <div>
               <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">THE AGENCY</h2>
               <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} className="text-teal-500"/> Operative Standing: <span className="text-white">{standing}</span>
               </div>
            </div>
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 w-fit">
               {['CONTRACTS', 'BATTLEPASS', 'STANDING'].map(t => (
                  <button 
                    key={t}
                    onClick={() => { setSubTab(t as any); game.playSfx('beep'); }}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${subTab === t ? 'bg-teal-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                     {t}
                  </button>
               ))}
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {/* CONTRACTS TAB */}
            {subTab === 'CONTRACTS' && (
               <div className="space-y-4">
                  {contracts.map((c: any) => (
                     <div key={c.id} className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${c.completed ? (c.claimed ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-teal-900/20 border-teal-500') : 'bg-slate-900/60 border-slate-800'}`}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                           <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-2xl ${c.completed ? 'bg-teal-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                 <Briefcase size={24} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black uppercase italic text-white">{c.title}</h3>
                                 <p className="text-xs text-slate-400 font-mono mt-1 max-w-md">{c.description}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Reward</div>
                              <div className="text-lg font-black text-amber-500 italic">{c.rewardStanding} STANDING</div>
                              {c.rewardMaterial && <div className="text-[9px] font-mono text-sky-400 uppercase">+{c.rewardMaterial.amount} {c.rewardMaterial.type.replace('_', ' ')}</div>}
                           </div>
                        </div>
                        
                        <div className="relative z-10">
                           <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase mb-1">
                              <span>Progress</span>
                              <span>{Math.min(c.currentValue, c.targetValue)} / {c.targetValue}</span>
                           </div>
                           <ProgressBar value={c.currentValue} max={c.targetValue} color={c.completed ? 'bg-teal-500' : 'bg-sky-600'} height="h-2" />
                        </div>

                        {c.completed && !c.claimed && (
                           <div className="mt-4 relative z-10">
                              <Button variant="primary" className="w-full" onClick={() => { claimContract(c.id); game.playSfx('success'); }}>CLAIM BOUNTY</Button>
                           </div>
                        )}
                        
                        {c.claimed && (
                           <div className="absolute top-4 right-4 opacity-20 -rotate-12 pointer-events-none">
                              <div className="border-4 border-teal-500 rounded-full p-4">
                                 <div className="text-4xl font-black text-teal-500 uppercase">PAID</div>
                              </div>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            )}

            {/* BATTLE PASS TAB */}
            {subTab === 'BATTLEPASS' && (
               <div className="space-y-8">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-8 rounded-[3rem] border border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
                     <div className="relative z-10">
                        <div className="text-[10px] font-mono text-teal-500 uppercase tracking-widest mb-2">Current Tier</div>
                        <div className="text-6xl font-black text-white italic">{currentLevel}</div>
                        <div className="w-64 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden mx-auto">
                           <div className="h-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.6)]" style={{ width: `${(xpInLevel / 1000) * 100}%` }}></div>
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 mt-2">{xpInLevel} / 1000 XP</div>
                     </div>
                     
                     <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/40 via-transparent to-transparent"></div>
                  </div>

                  <div className="space-y-2">
                     {BATTLE_PASS_REWARDS.map((r, i) => {
                        const isUnlocked = currentLevel >= r.level;
                        const isClaimed = claimedBpRewards.includes(r.level);
                        const isNext = !isUnlocked && currentLevel === r.level - 1;

                        return (
                           <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isUnlocked ? 'bg-slate-900/80 border-slate-700' : 'bg-black/40 border-slate-800 opacity-60'}`}>
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${isUnlocked ? 'bg-teal-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                 {r.level}
                              </div>
                              <div className="flex-1">
                                 <div className={`text-sm font-bold uppercase ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{r.label}</div>
                                 <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{isUnlocked ? (isClaimed ? "CLAIMED" : "AVAILABLE") : "LOCKED"}</div>
                              </div>
                              <div>
                                 {isUnlocked && !isClaimed ? (
                                    <Button variant="amber" size="sm" onClick={() => handleClaimBp(r)}>CLAIM</Button>
                                 ) : isClaimed ? (
                                    <CheckCircle size={24} className="text-teal-500 opacity-50" />
                                 ) : (
                                    <Lock size={20} className="text-slate-700" />
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}

            {/* STANDING TAB */}
            {subTab === 'STANDING' && (
               <div className="text-center py-20">
                  <Trophy size={64} className="text-slate-800 mx-auto mb-4" />
                  <h3 className="text-2xl font-black uppercase text-slate-700 italic">Coming Soon</h3>
                  <p className="text-xs text-slate-600 font-mono mt-2">Global Leaderboards and Elite Operations are under construction.</p>
               </div>
            )}
         </div>
      </div>
    </ScreenWrapper>
  );
};
