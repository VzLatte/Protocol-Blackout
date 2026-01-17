
import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: string;
  glow?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  color = "bg-teal-500", 
  height = "h-1.5", 
  glow = true,
  className = ""
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={`w-full bg-slate-900 overflow-hidden rounded-full ${height} ${className}`}>
      <div 
        className={`h-full transition-all duration-500 linear ${color} ${glow ? 'shadow-[0_0_10px_currentColor]' : ''}`}
        style={{ width: `${percentage}%`, color: 'inherit' }}
      ></div>
    </div>
  );
};
