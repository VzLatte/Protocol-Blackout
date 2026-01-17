import React, { useState, useEffect } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, VisualLevel, GameMode } from '../../../src/shared/types'; // Import GameMode
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  BookOpen, Users, ChevronRight, Globe, X, Signal, 
  Trophy, ChevronLeft, Edit2, AlertTriangle 
} from 'lucide-react';
import { useGameState } from '../../hooks/useGameState';

interface GameTypeSelectionViewProps {
  onCampaign: () => void;
  onCustom: () => void;
  onExitRequest: () => void; // Added for GlobalHeader consistency
  onFindMatch: () => void;
  setHideNav?: (hidden: boolean) => void;
  // Note: credits, xp, visualLevel are now pulled from the hook to prevent desync
}

const MOCK_LEADERBOARD = [
  { rank: 1, name: "NEXUS_PRIME", rating: 2890, winRate: "92%" },
  { rank: 2, name: "VORTEX_01", rating: 2750, winRate: "88%" },
  { rank: 3, name: "SHADOW_WALKER", rating: 2640, winRate: "85%" },
];

export const GameTypeSelectionView: React.FC<GameTypeSelectionViewProps> = ({ 
  onCampaign, onCustom, onFindMatch, onExitRequest, setHideNav
}) => {
  // --- Centralized State from Hook ---
  const game = useGameState(); 
  
  // --- Local UI State ---
  const [viewMode, setViewMode] = useState<'SELECTION' | 'LOBBY'>('SELECTION');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(game.playerName);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => setSearchTime(prev => prev + 1), 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Sync Nav visibility
  useEffect(() => {
    setHideNav?.(isSearching || viewMode === 'LOBBY');
    return () => setHideNav?.(false);
  }, [isSearching, viewMode, setHideNav]);

  // AUTO-CANCEL search if engine reports error or connects
  useEffect(() => {
      if (game.error) setIsSearching(false);
      if (game.isConnected) setIsSearching(false);
  }, [game.error, game.isConnected]);

  const handleFindMatch = () => {
      if (!game.playerName || game.playerName === "OPERATIVE") {
          setIsEditingProfile(true);
          return;
      }
      setIsSearching(true);
      onFindMatch();

      game.playSfx('confirm');
      // Small delay for "dramatic effect" before firing socket
      setTimeout(() => game.startMultiplayer(), 1500);
  };

  const saveProfileName = () => {
      if (tempName.trim().length > 0) {
          game.setPlayerName(tempName.trim().toUpperCase());
          setIsEditingProfile(false);
          game.playSfx('success');
      } else {
          game.playSfx('cancel');
      }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sub-component: Multiplayer Lobby
  const renderLobby = () => (
    <div className="flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col pt-8 pb-20 animate-in slide-in-from-right duration-500">
       <div className="flex items-center justify-between mb-8">
          <div>
             <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">GLOBAL_NETWORK</h2>
             <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Ranked Season 4 // Online</p>
          </div>
          <div className="bg-sky-500/10 border border-sky-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
             <Signal size={16} className="text-sky-400 animate-pulse"/>
             <span className="text-xs font-mono text-sky-400">LATENCY: 24ms</span>
          </div>
       </div>

       {game.error && (
          <div className="mb-6 bg-red-950/40 border border-red-500/50 p-4 rounded-2xl flex items-center gap-4 animate-shake">
             <AlertTriangle size={24} className="text-red-500" />
             <div className="text-xs text-red-300 font-mono">{game.error}</div>
          </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] flex flex-col items-center justify-center space-y-4">
             <Globe size={48} className="text-sky-500" />
             <div className="text-center">
                <div className="text-4xl font-black text-white italic">1,250</div>
                <div className="text-[9px] font-mono text-sky-400 uppercase">Silver II</div>
             </div>
             <button 
                onClick={() => { setTempName(game.playerName); setIsEditingProfile(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700"
             >
                <span className="text-[10px] font-black text-white">{game.playerName}</span>
                <Edit2 size={12} className="text-teal-500"/>
             </button>
          </div>

          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-[2rem] p-4 overflow-y-auto">
             <h3 className="text-xs font-black uppercase text-white mb-4">Top Operatives</h3>
             {MOCK_LEADERBOARD.map(p => (
                <div key={p.rank} className="flex justify-between p-3 border-b border-slate-800/50">
                   <span className="text-xs text-slate-300">{p.rank}. {p.name}</span>
                   <span className="text-[10px] font-mono text-sky-400">{p.rating} MMR</span>
                </div>
             ))}
          </div>
       </div>

       <div className="mt-8 flex gap-4">
          <Button variant="ghost" onClick={() => setViewMode('SELECTION')}>BACK</Button>
          <Button variant="primary" className="flex-1" onClick={handleFindMatch}>FIND MATCH</Button>
       </div>
    </div>
  );

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader 
        phase={Phase.GAME_TYPE_SELECTION} 
        onHelp={() => game.setIsHelpOpen(true)} 
        onSettings={() => game.setIsSettingsOpen(true)} 
        onExit={onExitRequest} 
        credits={game.credits} 
        xp={game.xp} 
      />
      
      {viewMode === 'SELECTION' ? (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 space-y-12">
           <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter">PROTOCOL</h1>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-6xl">
              <button onClick={onCampaign} className="bg-slate-900/60 border border-slate-800 hover:border-teal-500 p-8 rounded-[2.5rem] text-left transition-all">
                 <BookOpen size={28} className="text-teal-500 mb-4" />
                 <h2 className="text-2xl font-black text-white uppercase">Campaign</h2>
              </button>
              <button onClick={() => setViewMode('LOBBY')} className="bg-slate-900/60 border border-slate-800 hover:border-sky-500 p-8 rounded-[2.5rem] text-left transition-all">
                 <Globe size={28} className="text-sky-500 mb-4" />
                 <h2 className="text-2xl font-black text-white uppercase">Multiplayer</h2>
              </button>
              <button onClick={onCustom} className="bg-slate-900/60 border border-slate-800 hover:border-amber-500 p-8 rounded-[2.5rem] text-left transition-all">
                 <Users size={28} className="text-amber-500 mb-4" />
                 <h2 className="text-2xl font-black text-white uppercase">Sandbox</h2>
              </button>
           </div>
        </div>
      ) : renderLobby()}

      {/* MATCHMAKING OVERLAY */}
      {isSearching && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center">
           <div className="text-center space-y-8">
              <div className="w-32 h-32 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto"></div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                 {game.isConnecting ? "ESTABLISHING UPLINK" : "SCANNING GLOBAL SECTORS"}
              </h2>
              <div className="text-sky-400 font-mono text-2xl">{formatTime(searchTime)}</div>
              <Button variant="danger" onClick={() => setIsSearching(false)}>CANCEL SEARCH</Button>
           </div>
        </div>
      )}

      {/* PROFILE EDITOR */}
      <Modal isOpen={isEditingProfile} onClose={() => setIsEditingProfile(false)} title="IDENTITY_CONFIGURATION">
          <div className="space-y-6">
              <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-slate-800 rounded-xl p-4 text-white font-black italic uppercase"
                  maxLength={12}
              />
              <Button variant="primary" className="w-full" onClick={saveProfileName}>Confirm Identity</Button>
          </div>
      </Modal>
    </ScreenWrapper>
  );
};

function onFindMatch() {
   throw new Error('Function not implemented.');
}
