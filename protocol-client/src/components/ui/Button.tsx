
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  glow = true,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-black uppercase italic tracking-[0.1em] transition-all active:scale-95 disabled:opacity-20 disabled:grayscale rounded-2xl flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-teal-500 text-black hover:bg-teal-400",
    secondary: "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500",
    danger: "bg-red-500 text-white hover:bg-red-400",
    amber: "bg-amber-500 text-black hover:bg-amber-400",
    ghost: "bg-transparent border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-3 text-xs",
    lg: "px-8 py-5 text-base",
    xl: "px-12 py-6 text-xl"
  };

  const glows = {
    primary: "shadow-[0_0_20px_rgba(20,184,166,0.3)]",
    amber: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    danger: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
    secondary: "",
    ghost: ""
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${glow ? glows[variant] : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
