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
  const baseStyles = 'h-11 px-5 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-dark text-white shadow-sm focus:ring-primary',
    secondary: 'bg-secondary hover:bg-secondary-dark text-white shadow-sm focus:ring-secondary',
    danger: 'bg-error hover:bg-red-700 text-white shadow-sm focus:ring-error',
    outline: 'border border-outline bg-transparent hover:bg-surface-variant text-onSurface focus:ring-primary',
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
