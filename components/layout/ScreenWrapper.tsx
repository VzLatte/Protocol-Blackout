
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
    <div className={`h-[100dvh] flex flex-col bg-[#020617] relative overflow-hidden ${className}`}>
      {/* Layer 1: Tactical Grid */}
      {!isLow && (
        <div 
          className={`tactical-grid transition-opacity duration-1000 ${isHigh ? 'opacity-100' : 'opacity-40'}`}
        ></div>
      )}

      {/* Layer 2: Moving Ambient Glow Spots (High only) */}
      {isHigh && (
        <div className="ambient-spots">
          <div className="ambient-spot" style={{ top: '0%', left: '0%', width: '700px', height: '700px' }}></div>
          <div className="ambient-spot" style={{ top: '40%', left: '50%', width: '600px', height: '600px', animationDelay: '-8s', background: 'radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, transparent 70%)' }}></div>
          <div className="ambient-spot" style={{ bottom: '0%', right: '0%', width: '800px', height: '800px', animationDelay: '-15s' }}></div>
        </div>
      )}
      
      {/* Layer 3: Noise Texture */}
      {!isLow && (
        <div className={`noise-layer transition-opacity duration-1000 ${isHigh ? 'opacity-30' : 'opacity-10'}`}></div>
      )}

      {/* Layer 4: Scanlines */}
      {!isLow && <div className="scanline"></div>}
      
      {/* High detail specific static top effect */}
      {isHigh && <div className="scanline-header"></div>}

      {/* Content Layer */}
      <div 
        className={`relative z-10 flex-1 flex flex-col ${centerContent ? 'items-center justify-center text-center' : ''} ${noScroll ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}
      >
        {children}
      </div>
    </div>
  );
};
