import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, Player, VisualLevel, UnitType } from '../../shared/types';
import { Button } from '../ui/Button';
import { 
  Users, CheckCircle2, Circle, X, 
  Shield, Zap, Target, ArrowRight, 
  Loader2, AlertCircle 
} from 'lucide-react';

interface MultiplayerLobbyViewProps {
  players: Player[];
  sessionId: string;
  visualLevel: VisualLevel;
  onToggleReady: () => void;
  onLeave: () => void;
  onSelectUnit: (type: UnitType) => void;
  credits: number;
  xp?: number;
}

export const MultiplayerLobbyView: React.FC<MultiplayerLobbyViewProps> = ({
  players,
  sessionId,
  visualLevel,
  onToggleReady,
  onLeave,
  onSelectUnit,
  credits,
  xp = 0
}) => {
  const localPlayer = players.find(p => p.id === sessionId);
  const allReady = players.length >= 2 && players.every(p => p.isReady);
  const readyCount = players.filter(p => p.isReady).length;

  return (
    <ScreenWrapper visualLevel={visualLevel} centerContent={false}>
      <GlobalHeader 
        phase={Phase.MULTIPLAYER_LOBBY} 
        onExit={onLeave} 
        onHelp={() => {}} 
        onSettings={() => {}} 
        credits={credits} 
        xp={xp} 
      />

      <div className="flex-1 w-full max-w-6xl mx-auto p-6 flex flex-col lg:flex-row gap-8 pt-12 pb-24">
        
        {/* LEFT: PLAYER ROSTER */}
        <div className="flex-[1.5] space-y-6">
          <div className="flex items-end justify-between border-b border-slate-800 pb-4">
             <div>
                <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Combat_Roster</h2>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">
                   {players.length} / 2 Operatives Connected
                </p>
             </div>
             <div className="text-right">
                <div className="text-[10px] font-black text-sky-400 uppercase">Sync Status</div>
                <div className="flex gap-1 mt-1">
                   {players.map((player, index) => (
  <div 
    // Fallback to index if id is missing, though ID is preferred
    key={player.id && player.id !== "" ? player.id : `temp-key-${index}`} 
    className="..."
  >
     {/* ... */}
  </div>
))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {players.map((player) => (
              <div 
                key={player.id} 
                className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                  player.id === sessionId 
                    ? 'bg-slate-900/80 border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.1)]' 
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                    player.isReady ? 'border-teal-500 bg-teal-500/10' : 'border-slate-700 bg-slate-800'
                  }`}>
                    {player.unit ? (
                       <span className="text-xs font-black text-white">{player.unit.type[0]}</span>
                    ) : (
                       <Users size={20} className="text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase tracking-tight">
                        {player.name}
                      </span>
                      {player.id === sessionId && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-teal-500 text-black font-black rounded uppercase">You</span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">
                      {player.unit?.role || "Selecting Class..."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {player.isReady ? (
                    <div className="flex items-center gap-2 text-teal-400 font-black italic text-xs uppercase animate-pulse">
                      <CheckCircle2 size={16} /> Ready
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase">
                      <Circle size={16} /> Awaiting
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
               <div key={`empty-${i}`} className="p-5 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center opacity-50">
                  <span className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.4em] animate-pulse">
                     Scanning for neural link...
                  </span>
               </div>
            ))}
          </div>
        </div>

        {/* RIGHT: UNIT SELECTION & PREVIEW */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 flex-1 flex flex-col space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xs font-black text-teal-500 uppercase tracking-[0.3em]">Unit Configuration</h3>
              <div className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {localPlayer?.unit?.name || "Neural_Interface_Offline"}
              </div>
            </div>

            {/* Unit Stats Preview */}
            <div className="grid grid-cols-3 gap-4">
              <StatBlock label="ATK" value={localPlayer?.unit?.atkStat || 0} icon={<Target size={12}/>} />
              <StatBlock label="DEF" value={localPlayer?.unit?.defStat || 0} icon={<Shield size={12}/>} />
              <StatBlock label="SPD" value={localPlayer?.unit?.speed || 0} icon={<Zap size={12}/>} />
            </div>

            {/* Quick Select Grid */}
            <div className="grid grid-cols-3 gap-2 flex-1 pt-4">
              {Object.values(UnitType).map((type) => (
                <button
                  key={type}
                  onClick={() => onSelectUnit(type)}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${
                    localPlayer?.unit?.type === type 
                    ? 'bg-teal-500 border-teal-400 text-black scale-105 shadow-lg' 
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-tighter">{type}</span>
                </button>
              ))}
            </div>

            {/* Action Section */}
            <div className="pt-6 space-y-4">
            <Button 
                variant={localPlayer?.isReady ? "danger" : "primary"}
                className="w-full py-8 text-xl shadow-2xl"
                onClick={onToggleReady}
                disabled={!localPlayer?.unit || players.length < 2}
              >
                {localPlayer?.isReady ? (
                  <span className="flex items-center gap-2 italic uppercase"><X size={20}/> Stand Down</span>
                ) : (
                  <span className="flex items-center gap-2 italic uppercase">Initialize Ready <ArrowRight size={20}/></span>
                )}
              </Button>
              
              {!localPlayer?.unit && (
                <p className="text-[9px] text-amber-500 font-mono text-center uppercase animate-pulse">
                   Warning: Select unit type to enable readiness protocol
                </p>
              )}
            </div>
          </div>

          {/* GLOBAL STATUS BOX */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
                {allReady ? (
                  <Loader2 className="text-teal-500 animate-spin" size={24} />
                ) : (
                  <AlertCircle className="text-slate-600" size={24} />
                )}
                <div>
                   <div className="text-[10px] font-black text-white uppercase">Network_Auth</div>
                   <div className="text-[10px] font-mono text-slate-500">
                      {allReady ? "Commencing sequence..." : `Awaiting ${players.length - readyCount} confirmations`}
                   </div>
                </div>
             </div>
             <div className="text-right">
                <span className="text-2xl font-black text-white italic">{readyCount}/{players.length}</span>
             </div>
          </div>
        </div>

      </div>
    </ScreenWrapper>
  );
};

const StatBlock = ({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) => (
  <div className="bg-black/40 border border-slate-800 p-3 rounded-xl text-center">
    <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
      {icon} <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-lg font-black text-white">{value}</div>
  </div>
);