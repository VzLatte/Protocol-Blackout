
import React from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { Button } from '../ui/Button';
import { VisualLevel } from '../../types';

interface SplashViewProps {
  onInitialize: () => void;
  visualLevel: VisualLevel;
}

export const SplashView: React.FC<SplashViewProps> = ({ onInitialize, visualLevel }) => {
  return (
    <ScreenWrapper visualLevel={visualLevel} className="p-6 text-center">
       <div className="max-w-xl w-full flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <div className="mb-12 relative group w-full">
            <div className="relative inline-block">
               {/* Decorative background layers for high intensity feel */}
               {visualLevel === VisualLevel.HIGH && (
                 <>
                   <div className="absolute inset-0 text-red-500/20 translate-x-1 -z-10 blur-[1px] select-none pointer-events-none">
                     <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic uppercase leading-none tracking-tighter break-words">BLACKOUT</h1>
                   </div>
                   <div className="absolute inset-0 text-cyan-500/20 -translate-x-1 -z-10 blur-[1px] select-none pointer-events-none">
                     <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic uppercase leading-none tracking-tighter break-words">BLACKOUT</h1>
                   </div>
                 </>
               )}
               
               <h1 className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic text-white uppercase leading-none tracking-tighter break-words ${visualLevel !== VisualLevel.LOW ? 'animate-glitch' : ''}`}>
                 BLACKOUT
               </h1>
            </div>
            <div className="absolute -inset-4 bg-teal-500/10 blur-3xl rounded-full -z-10 group-hover:bg-teal-500/20 transition-all duration-700"></div>
          </div>
          <div className="text-teal-500 font-mono text-[9px] sm:text-xs uppercase tracking-[0.5em] sm:tracking-[0.8em] mb-16 sm:mb-24 opacity-60">
            Strategic Protocol System <span className="ml-2 animate-pulse font-black">v2.5.0</span>
          </div>
          <Button variant="primary" size="xl" onClick={onInitialize} glow className="w-full sm:w-auto px-12 sm:px-24 py-6 sm:py-8 text-xl sm:text-2xl">
            INITIALIZE
          </Button>
       </div>
    </ScreenWrapper>
  );
};
