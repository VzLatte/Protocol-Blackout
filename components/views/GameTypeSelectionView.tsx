
import React, { useState, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel } from '../../types';
import { Button } from '../ui/Button';
import { BookOpen, Users, ChevronRight, Globe, Loader2, X, Signal, Trophy, ChevronLeft, Shield } from 'lucide-react';

interface GameTypeSelectionViewProps {
  onCampaign: () => void;
  onCustom: () => void;
  visualLevel: VisualLevel;
  onHelp: () => void;
  onSettings: () => void;
  credits: number;
  xp?: number;
  setHideNav?: (hidden: boolean) => void;
}

const MOCK_LEADERBOARD = [
  { rank: 1, name: "NEXUS_PRIME", rating: 2890, winRate: "92%" },
  { rank: 2, name: "VORTEX_01", rating: 2750, winRate: "88%" },
  { rank: 3, name: "SHADOW_WALKER", rating: 2640, winRate: "85%" },
  { rank: 4, name: "CYBER_GHOST", rating: 2580, winRate: "81%" },
  { rank: 5, name: "IRON_AEGIS", rating: 2510, winRate: "79%" },
];

export const GameTypeSelectionView: React.FC<GameTypeSelectionViewProps> = ({ 
  onCampaign, onCustom, visualLevel, onHelp, onSettings, credits, xp = 0, setHideNav
}) => {
  const [viewMode, setViewMode] = useState<'SELECTION' | 'LOBBY'>('SELECTION');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Toggle Nav Visibility
  useEffect(() => {
    if (setHideNav) {
      setHideNav(isSearching || viewMode === 'LOBBY');
    }
    return () => {
      if (setHideNav) setHideNav(false);
    };
  }, [isSearching, viewMode, setHideNav]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLobby = () => (
    <div className="flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col pt-8 pb-20 animate-in slide-in-from-right duration-500">
       <div className="flex items-center justify-between mb-8">
          <div>
             <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">GLOBAL_NETWORK</h2>
             <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Ranked Season 4 // Connected</p>
          </div>
          <div className="bg-sky-500/10 border border-sky-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
             <Signal size={16} className="text-sky-400 animate-pulse"/>
             <span className="text-xs font-mono text-sky-400">PING: 24ms</span>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Rank Card */}
          <div className="md:col-span-1 bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] flex flex-col items-center text-center justify-center space-y-4">
             <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center relative">
                <Globe size={48} className="text-sky-500 opacity-80" />
                <div className="absolute inset-0 border-4 border-sky-500/30 rounded-full border-t-sky-500 animate-spin-slow"></div>
             </div>
             <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Current Rating</div>
                <div className="text-4xl font-black text-white italic">1,250</div>
                <div className="text-[9px] font-mono text-sky-400 uppercase mt-1">Silver Division II</div>
             </div>
          </div>

          {/* Leaderboard */}
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><Trophy size={14} className="text-amber-500"/> Top Operatives</h3>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Global Top 100</span>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {MOCK_LEADERBOARD.map((player) => (
                   <div key={player.rank} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/20 border border-transparent hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${player.rank === 1 ? 'bg-amber-500 text-black' : player.rank === 2 ? 'bg-slate-400 text-black' : player.rank === 3 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
                            {player.rank}
                         </div>
                         <span className="text-xs font-bold text-slate-300">{player.name}</span>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-mono text-sky-400">{player.rating} MMR</div>
                         <div className="text-[8px] font-mono text-slate-600">{player.winRate} Win</div>
                      </div>
                   </div>
                ))}
                {/* User Entry */}
                <div className="mt-4 border-t border-slate-800 pt-2">
                   <div className="flex items-center justify-between p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
                      <div className="flex items-center gap-4">
                         <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black bg-slate-800 text-slate-500">
                            482
                         </div>
                         <span className="text-xs font-bold text-white">YOU</span>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-mono text-teal-400">1,250 MMR</div>
                         <div className="text-[8px] font-mono text-slate-500">54% Win</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>

       <div className="mt-8 flex gap-4">
          <Button variant="ghost" className="flex-1 py-4 rounded-2xl" onClick={() => setViewMode('SELECTION')}>
             <ChevronLeft size={16} /> BACK
          </Button>
          <Button variant="primary" className="flex-[3] py-4 rounded-2xl shadow-xl" onClick={() => setIsSearching(true)}>
             FIND MATCH
          </Button>
       </div>
    </div>
  );

  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.GAME_TYPE_SELECTION} onHelp={onHelp} onSettings={onSettings} onExit={() => {}} credits={credits} xp={xp} />
      
      {viewMode === 'SELECTION' ? (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 pt-12 pb-24 space-y-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="space-y-4">
              <h1 className="text-6xl sm:text-7xl font-black text-white italic uppercase tracking-tighter">PROTOCOL</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.4em] opacity-80">Select Deployment Type</p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-6xl px-4">
              <button 
                onClick={onCampaign} 
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-teal-500 p-8 rounded-[2.5rem] text-left group transition-all shadow-2xl hover:scale-[1.02] active:scale-95 flex flex-col items-start gap-4 min-h-[280px]"
              >
                 <div className="p-4 bg-teal-500/10 rounded-2xl text-teal-500 group-hover:scale-110 transition-transform">
                    <BookOpen size={28} />
                 </div>
                 <div className="flex-1">
                    <h2 className="text-2xl font-black italic uppercase text-white mb-2 group-hover:text-teal-400 transition-colors">Campaign</h2>
                    <p className="text-slate-500 text-[9px] font-mono uppercase tracking-widest leading-relaxed">
                       Single-player narrative protocol. Master the system.
                    </p>
                 </div>
                 <div className="mt-2 text-[8px] font-black text-teal-500 uppercase flex items-center gap-2">Initialize Training <ChevronRight size={10} /></div>
              </button>

              <button 
                onClick={() => setViewMode('LOBBY')} 
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-sky-500 p-8 rounded-[2.5rem] text-left group transition-all shadow-2xl hover:scale-[1.02] active:scale-95 flex flex-col items-start gap-4 min-h-[280px]"
              >
                 <div className="p-4 bg-sky-500/10 rounded-2xl text-sky-500 group-hover:scale-110 transition-transform">
                    <Globe size={28} />
                 </div>
                 <div className="flex-1">
                    <h2 className="text-2xl font-black italic uppercase text-white mb-2 group-hover:text-sky-400 transition-colors">Multiplayer</h2>
                    <p className="text-slate-500 text-[9px] font-mono uppercase tracking-widest leading-relaxed">
                       Online ranked matchmaking. Challenge global operatives.
                    </p>
                 </div>
                 <div className="mt-2 text-[8px] font-black text-sky-500 uppercase flex items-center gap-2">Enter Lobby <ChevronRight size={10} /></div>
              </button>

              <button 
                onClick={onCustom} 
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-amber-500 p-8 rounded-[2.5rem] text-left group transition-all shadow-2xl hover:scale-[1.02] active:scale-95 flex flex-col items-start gap-4 min-h-[280px]"
              >
                 <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                 </div>
                 <div className="flex-1">
                    <h2 className="text-2xl font-black italic uppercase text-white mb-2 group-hover:text-amber-400 transition-colors">Sandbox</h2>
                    <p className="text-slate-500 text-[9px] font-mono uppercase tracking-widest leading-relaxed">
                       2-6 players single-device tactical combat.
                    </p>
                 </div>
                 <div className="mt-2 text-[8px] font-black text-amber-500 uppercase flex items-center gap-2">Execute Local Play <ChevronRight size={10} /></div>
              </button>
           </div>
           
           <div className="text-slate-600 font-mono text-[8px] uppercase tracking-[0.6em] animate-pulse">
              Awaiting Command Inputs...
           </div>
        </div>
      ) : (
        renderLobby()
      )}

      {/* MATCHMAKING OVERLAY */}
      {isSearching && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
           <div className="w-full max-w-md p-8 flex flex-col items-center text-center space-y-12">
              
              {/* Radar Animation */}
              <div className="relative">
                 <div className="w-48 h-48 border border-sky-500/30 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 border border-sky-500/10 rounded-full animate-ping [animation-duration:2s]"></div>
                    <div className="absolute inset-4 border border-sky-500/20 rounded-full animate-ping [animation-duration:2s] [animation-delay:0.5s]"></div>
                    <Globe size={64} className="text-sky-500 animate-pulse" />
                    
                    {/* Rotating Scan Line */}
                    <div className="absolute inset-0 rounded-full border-t-2 border-sky-500/50 animate-spin [animation-duration:3s]"></div>
                 </div>
                 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sky-400 font-mono text-xs">
                    <Signal size={14} className="animate-pulse"/> 
                    <span>PING: {Math.floor(Math.random() * 40 + 20)}ms</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter animate-pulse">SEARCHING FOR OPPONENT</h2>
                 <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Scanning Global Sectors...</p>
                 
                 <div className="inline-block px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 text-sky-400 font-mono text-xl font-bold">
                    {formatTime(searchTime)}
                 </div>
              </div>

              <Button 
                variant="danger" 
                size="lg" 
                className="px-12 py-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                onClick={() => setIsSearching(false)}
              >
                 <X size={20} /> CANCEL SEARCH
              </Button>
           </div>
        </div>
      )}
    </ScreenWrapper>
  );
};
