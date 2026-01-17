import React from 'react';
import { Activity, Clock } from 'lucide-react';

interface WaitingProps {
  secondsLeft?: number;
  onCancel?: () => void;
  message?: string;
}

export const WaitingForOpponent: React.FC<WaitingProps> = ({ secondsLeft = 15, onCancel, message = 'Waiting for opponent...' }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-auto">
      <div className="bg-[#071024] border border-slate-700 rounded-xl p-6 flex flex-col items-center gap-3 w-80">
        <Activity className="text-sky-400 animate-spin" size={36} />
        <div className="text-lg font-black text-white">{message}</div>
        <div className="text-sm font-mono text-slate-300 flex items-center gap-2"><Clock size={12} /> <span>{secondsLeft}s</span></div>
        {onCancel && (
          <button onClick={onCancel} className="mt-2 px-4 py-2 bg-red-800 rounded-md text-white text-sm">Cancel</button>
        )}
      </div>
    </div>
  );
};

export default WaitingForOpponent;