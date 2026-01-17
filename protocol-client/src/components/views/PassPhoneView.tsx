
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { Button } from '../ui/Button';
import { Cpu, Loader2 } from 'lucide-react';

interface PassPhoneViewProps {
  game: any;
}

export const PassPhoneView: React.FC<PassPhoneViewProps> = ({ game }) => {
  const nextPlayer = game.players[game.currentPlayerIdx];
  const isAI = nextPlayer?.isAI;

  return (
    <ScreenWrapper visualLevel={game.visualLevel} className="p-8 text-center">
       <div className="z-10 space-y-12 max-w-lg w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
          <div className="space-y-4">
            <div className={`font-mono text-xs uppercase tracking-[0.5em] mb-4 flex items-center gap-4 ${isAI ? 'text-amber-500' : 'text-teal-500'}`}>
              <span className={`h-[1px] w-12 ${isAI ? 'bg-amber-500/30' : 'bg-teal-500/30'}`}></span>
              {isAI ? 'System Link Active' : 'Secure Handover'}
              <span className={`h-[1px] w-12 ${isAI ? 'bg-amber-500/30' : 'bg-teal-500/30'}`}></span>
            </div>
            <h2 className="text-7xl sm:text-8xl font-black text-white italic uppercase tracking-tighter mb-2 leading-tight">
              {nextPlayer.name}
            </h2>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] max-w-xs mx-auto opacity-70">
              {isAI 
                ? 'AI Operative is calculating tactical matrix. Stand by...' 
                : 'Authorization key detected. PLEASE HAND OVER DEVICE TO OPERATIVE.'}
            </p>
          </div>
          
          <div className="w-full pt-8 flex flex-col items-center">
            {isAI ? (
              <div className="flex flex-col items-center gap-4 text-amber-500 animate-pulse">
                <div className="relative">
                  <Cpu size={64} className="opacity-80" />
                  <Loader2 size={80} className="absolute -top-2 -left-2 animate-spin opacity-40" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Logic...</span>
              </div>
            ) : (
              <>
                <Button 
                  variant="primary" size="xl" 
                  className="w-full py-8 text-2xl px-16 shadow-[0_0_50px_rgba(20,184,166,0.15)]" 
                  onClick={() => { game.playSfx('confirm'); game.setPhase('TURN_ENTRY'); }}
                >
                  Access Terminal
                </Button>
                <div className="mt-6 text-[8px] font-mono text-slate-700 uppercase tracking-widest">
                  Biometric verification pending...
                </div>
              </>
            )}
          </div>
       </div>
    </ScreenWrapper>
  );
};
