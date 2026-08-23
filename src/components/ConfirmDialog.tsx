import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import AuthButton from './AuthButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 shadow-level3 border border-outline/30 animate-scaleUp">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              variant === 'danger' ? 'bg-error-container text-error' : 'bg-primary-container text-primary'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-heading font-bold text-onSurface">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-onSurface-muted hover:text-onSurface p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-onSurface-variant mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-onSurface hover:bg-surface-variant rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <AuthButton
            variant={variant}
            fullWidth={false}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </AuthButton>
        </div>
      </div>
    </div>
  );
}
