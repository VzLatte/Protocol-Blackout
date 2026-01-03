
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
          <div className="mb-12 relative group">
            <h1 className={`text-6xl sm:text-9xl font-black italic text-white uppercase leading-none tracking-tighter ${visualLevel !== VisualLevel.LOW ? 'animate-glitch' : ''}`}>
              BLACKOUT
            </h1>
            <div className="absolute -inset-4 bg-teal-500/10 blur-3xl rounded-full -z-10 group-hover:bg-teal-500/20 transition-all duration-700"></div>
          </div>
          <div className="text-teal-500 font-mono text-[10px] sm:text-xs uppercase tracking-[0.8em] mb-24 opacity-60">
            Strategic Protocol System <span className="ml-2 animate-pulse font-black">v2.5.0</span>
          </div>
          <Button variant="primary" size="xl" onClick={onInitialize} glow className="px-24 py-8 text-2xl">
            INITIALIZE
          </Button>
       </div>
    </ScreenWrapper>
  );
};
