import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface SessionAlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function SessionAlert({
  type = 'error',
  message,
  onClose,
  className = ''
}: SessionAlertProps) {
  if (!message) return null;

  const styles = {
    error: 'bg-error-container/60 border-error text-error',
    success: 'bg-success-container/70 border-success text-success',
    warning: 'bg-secondary-container/80 border-secondary text-secondary-dark',
    info: 'bg-primary-container/60 border-primary text-primary-dark'
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />
  };

  return (
    <div className={`p-3.5 rounded-lg border flex items-start gap-3 text-sm animate-fadeIn ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1 leading-relaxed">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100 transition-opacity p-0.5"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
