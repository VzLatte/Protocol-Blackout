
import React from 'react';
import { ProgressBar } from '../ui/ProgressBar';

interface TimerProps {
  timeLeft: number | null;
  timeLimit: number;
  isCritical: boolean;
}

export const Timer: React.FC<TimerProps> = ({ timeLeft, timeLimit, isCritical }) => {
  if (timeLimit <= 0 || timeLeft === null) return null;

  return (
    <div className="absolute top-16 left-0 w-full h-1 z-10">
      <ProgressBar 
        value={timeLeft} 
        max={timeLimit} 
        color={isCritical ? "bg-red-500" : "bg-teal-500"}
        height="h-full"
        glow={isCritical}
      />
    </div>
  );
};
