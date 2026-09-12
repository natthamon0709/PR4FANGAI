import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function AuthButton({
  loading = false,
  variant = 'primary',
  fullWidth = true,
  children,
  className = '',
  disabled,
  ...props
}: AuthButtonProps) {
  const baseStyles = 'h-12 px-6 rounded-2xl font-heading font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary via-[#8c0a0a] to-[#720000] hover:from-[#961212] hover:to-[#800000] text-white shadow-card hover:shadow-card-hover focus:ring-primary/20 ring-1 ring-white/20',
    secondary: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-card hover:shadow-card-hover focus:ring-secondary/20 ring-1 ring-white/20',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-card hover:shadow-card-hover focus:ring-red-500/20 ring-1 ring-white/20',
    outline: 'border border-outline/70 bg-surface-card hover:bg-surface-variant/80 text-onSurface focus:ring-primary/20 shadow-xs',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      <span>{children}</span>
    </button>
  );
}
