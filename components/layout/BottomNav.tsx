
import React from 'react';
import { Tab, Phase } from '../../types';
import { ShoppingCart, UserCheck, Terminal, Archive } from 'lucide-react';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  phase: Phase;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, phase }) => {
  // Hide bottom bar during Turn Entry and Splash phases
  const isHidden = phase === Phase.TURN_ENTRY || phase === Phase.SPLASH;
  
  if (isHidden) return null;

  const tabs = [
    { id: Tab.MARKET, label: 'Market', icon: <ShoppingCart size={20} /> },
    { id: Tab.OPERATIVES, label: 'Operatives', icon: <UserCheck size={20} /> },
    { id: Tab.TERMINAL, label: 'Terminal', icon: <Terminal size={20} /> },
    { id: Tab.ARCHIVE, label: 'Archive', icon: <Archive size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0f1e]/90 backdrop-blur-2xl border-t border-slate-800 z-[100] pb-6 pt-2 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] safe-area-bottom animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all relative overflow-hidden group
                ${isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-teal-500/5 rounded-2xl animate-in zoom-in duration-300"></div>
              )}
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'group-active:scale-90'}`}>
                {tab.icon}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="h-0.5 w-4 bg-teal-500 rounded-full mt-0.5 shadow-[0_0_8px_rgba(20,184,166,0.8)]"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
