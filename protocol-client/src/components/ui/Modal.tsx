
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-md",
  zIndex = "z-[100]"
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 transition-all duration-300`}>
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className={`relative w-full ${maxWidth} bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]`}>
        {title && (
          <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-black uppercase text-teal-400 italic tracking-tighter">{title}</h2>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
              <X className="text-slate-500 hover:text-white" size={16}/>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};
