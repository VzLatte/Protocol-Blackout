
import React, { useEffect, useState } from 'react';
import { WifiOff, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface MultiplayerErrorOverlayProps {
  error: string;
  onExit: () => void;
}

export const MultiplayerErrorOverlay: React.FC<MultiplayerErrorOverlayProps> = ({ error, onExit }) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Brutalist Red Overlay */}
      <div className="absolute inset-0 bg-red-950/20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] z-[1] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg p-8 border-2 border-red-600 bg-[#050000] rounded-3xl shadow-[0_0_100px_rgba(220,38,38,0.3)] flex flex-col items-center text-center space-y-8">
         <div className="relative">
            <WifiOff size={64} className="text-red-500 relative z-10" />
            <div className="absolute inset-0 text-red-500 blur-lg opacity-50 animate-pulse"><WifiOff size={64}/></div>
         </div>

         <div className="space-y-2">
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter animate-pulse">CONNECTION_SEVERED</h2>
            <p className="text-red-500 font-mono text-xs uppercase tracking-[0.2em]">Neural Link Offline</p>
         </div>

         <div className="w-full bg-red-950/30 border border-red-900/50 p-4 rounded-xl relative overflow-hidden group">
            <div className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
               <AlertTriangle size={10}/> SYSTEM_ERROR_CODE
            </div>
            <div className="font-mono text-red-400 font-bold text-sm truncate">
               {error || "ERR_SOCKET_HANG_UP_4001"}
            </div>
            {/* Scanline in box */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/30 animate-scanline opacity-50"></div>
         </div>

         <div className="w-full space-y-3">
            <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest">
               <span>Auto-Reconnect Sequence</span>
               <span className={countdown > 0 ? "text-white" : "text-red-500"}>
                  {countdown > 0 ? `T-MINUS ${countdown}s` : "FAILED"}
               </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
               <div 
                  className={`h-full transition-all duration-1000 ease-linear ${countdown > 0 ? 'bg-white' : 'bg-red-900'}`} 
                  style={{ width: `${(countdown / 15) * 100}%` }}
               ></div>
            </div>
         </div>

         <Button 
            variant="danger" 
            size="lg" 
            className="w-full py-5 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:shadow-[0_0_50px_rgba(220,38,38,0.4)] transition-shadow"
            onClick={onExit}
         >
            <XCircle size={20} className="mr-2" /> RETURN TO TERMINAL
         </Button>
      </div>
    </div>
  );
};
