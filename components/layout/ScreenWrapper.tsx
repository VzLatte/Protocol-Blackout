import React from 'react';
import { VisualLevel } from '../../types';

interface ScreenWrapperProps {
  children: React.ReactNode;
  visualLevel?: VisualLevel;
  className?: string;
  noScroll?: boolean;
  centerContent?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
  children, 
  visualLevel = VisualLevel.MID, 
  className = "",
  noScroll = false,
  centerContent = true
}) => {
  const isLow = visualLevel === VisualLevel.LOW;
  const isMid = visualLevel === VisualLevel.MID;
  const isHigh = visualLevel === VisualLevel.HIGH;

  return (
    <div className={`h-[100dvh] w-full flex flex-col bg-[#020617] relative overflow-hidden select-none ${className}`}>
      
      {/* Layer 1: Tactical Grid (GPU Accelerated) */}
      {!isLow && (
        <div 
          className={`tactical-grid absolute inset-0 pointer-events-none transition-opacity duration-1000 will-change-opacity
            ${isHigh ? 'opacity-100' : 'opacity-40'}`}
        ></div>
      )}

      {/* Layer 2: Moving Ambient Glow Spots (High only) */}
      {isHigh && (
        <div className="ambient-spots absolute inset-0 overflow-hidden pointer-events-none">
          <div className="ambient-spot absolute blur-[120px] opacity-50" 
               style={{ top: '0%', left: '0%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)' }}></div>
          <div className="ambient-spot absolute blur-[120px] opacity-30 animate-pulse" 
               style={{ bottom: '10%', right: '10%', width: '50vw', height: '50vw', animationDelay: '-5s', background: 'radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%)' }}></div>
        </div>
      )}
      
      {/* Layer 3: Noise Texture & Scanlines */}
      {!isLow && (
        <>
          <div className={`noise-layer absolute inset-0 pointer-events-none transition-opacity duration-1000 mix-blend-soft-light
            ${isHigh ? 'opacity-30' : 'opacity-10'}`}></div>
          <div className="scanline absolute inset-0 pointer-events-none z-50"></div>
        </>
      )}
      
      {/* Layer 4: High-Detail Header Flicker */}
      {isHigh && <div className="scanline-header fixed top-0 left-0 w-full h-[2px] z-[100] pointer-events-none"></div>}

      {/* Main Content Layer */}
      <main 
        className={`relative z-10 flex-1 w-full flex flex-col outline-none
          ${noScroll ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden custom-scrollbar'}
          ${centerContent ? 'justify-start md:justify-center items-center' : ''}`}
      >
        {/* If centering, we use a spacer to prevent top-clipping on short screens */}
        {centerContent && <div className="flex-1 hidden md:block" />}
        
        <div className={`w-full ${centerContent ? 'py-12 px-4' : ''}`}>
          {children}
        </div>

        {centerContent && <div className="flex-1 hidden md:block" />}
      </main>
    </div>
  );
};