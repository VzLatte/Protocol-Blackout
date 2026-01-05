
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase } from '../../types';
import { Button } from '../ui/Button';
import { ShoppingCart, Database, ChevronLeft, Zap, ShieldAlert, Gift, Rocket, Crown } from 'lucide-react';

interface BlackMarketViewProps {
  game: any;
  onBack: () => void;
}

export const BlackMarketView: React.FC<BlackMarketViewProps> = ({ game, onBack }) => {
  const { credits, visualLevel, playSfx } = game;

  const creditPacks = [
    { 
      id: 'pack_1', 
      name: "SQUATTER DATA CHIP", 
      amount: 500, 
      price: "$0.99", 
      icon: <Database size={24} />, 
      color: "text-slate-400",
      bonus: "Standard Uplink"
    },
    { 
      id: 'pack_2', 
      name: "CORPORATE ENCRYPTOR", 
      amount: 3000, 
      price: "$4.99", 
      icon: <Zap size={24} />, 
      color: "text-teal-400",
      bonus: "+15% Yield Bonus"
    },
    { 
      id: 'pack_3', 
      name: "GOVERNMENT BLACK-BOX", 
      amount: 7500, 
      price: "$9.99", 
      icon: <ShieldAlert size={24} />, 
      color: "text-amber-500",
      bonus: "Most Popular // Tier 3 Ready"
    },
    { 
      id: 'pack_4', 
      name: "SYNDICATE MAINFRAME", 
      amount: 20000, 
      price: "$19.99", 
      icon: <Crown size={24} />, 
      color: "text-red-500",
      bonus: "Elite Access // All Protocols"
    }
  ];

  const handlePurchase = (pack: any) => {
    playSfx('success');
    alert(`SECURITY_OVERRIDE: This is a prototype interface. In a production environment, this would initiate a secure payment for the ${pack.name}.`);
  };

  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
       <GlobalHeader phase={Phase.STORE} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={onBack} credits={credits} />
       <div className="flex-1 p-4 sm:p-6 flex flex-col items-center max-w-5xl mx-auto w-full pt-10 pb-28">
          <div className="w-full space-y-12">
             <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-6 px-2">
                <div className="space-y-2 flex-1 min-w-0">
                   <h2 className="text-4xl sm:text-5xl font-black italic uppercase text-white tracking-tighter truncate glitch-text">DATA_RECHARGE</h2>
                   <p className="text-slate-500 font-mono text-[9px] uppercase tracking-[0.4em] break-words italic">Inject Merit into your system profile via Corporate Direct-Pay</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-right w-full sm:min-w-[150px] sm:w-auto shadow-2xl shrink-0 flex flex-col items-end justify-center">
                   <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Current Merit Balance</div>
                   <div className="text-2xl font-black text-sky-400 italic tracking-tighter leading-none">{credits} CR</div>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
               {creditPacks.map((pack) => (
                 <div 
                   key={pack.id} 
                   className="bg-slate-900/60 border border-slate-800 p-8 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden flex flex-col"
                 >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                       {pack.icon}
                    </div>
                    
                    <div className="space-y-1 mb-6">
                       <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{pack.bonus}</div>
                       <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">{pack.name}</h3>
                    </div>

                    <div className="flex-1 flex items-center gap-4 mb-8">
                       <div className={`p-4 rounded-2xl bg-black/40 border border-slate-800 ${pack.color}`}>
                          <Database size={28} />
                       </div>
                       <div>
                          <div className="text-3xl font-black text-white italic tracking-tighter leading-none">{pack.amount.toLocaleString()} <span className="text-sky-400 text-sm not-italic">CR</span></div>
                          <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1">Data Credits</div>
                       </div>
                    </div>

                    <Button 
                      variant="primary" 
                      className="w-full py-5 rounded-2xl text-lg group-hover:scale-[1.02] transition-transform"
                      onClick={() => handlePurchase(pack)}
                    >
                       Purchase for {pack.price}
                    </Button>
                    
                    {/* Subtle aesthetic lines */}
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
                 </div>
               ))}
             </div>

             <div className="bg-red-950/20 border border-red-900/40 p-6 rounded-[2rem] mx-2 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                   <ShieldAlert size={24} />
                </div>
                <div className="flex-1">
                   <h4 className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1 italic">Security Advisory</h4>
                   <p className="text-[9px] font-mono text-slate-500 uppercase leading-relaxed tracking-tight">
                      All Merit transactions are encrypted via the Corporate Overlord's secure banking layer. Non-refundable. Terminal access may be revoked upon detection of fractional credit fraud.
                   </p>
                </div>
                <Button variant="ghost" className="shrink-0 text-[8px] py-2 px-6" onClick={() => playSfx('beep')}>
                   Read Bylaws
                </Button>
             </div>

             <div className="px-2 pb-10">
              <Button variant="ghost" className="w-full py-4 rounded-3xl" onClick={onBack}>
                  <ChevronLeft size={16} /> Return to Terminal
              </Button>
             </div>
          </div>
       </div>
    </ScreenWrapper>
  );
};
