"use client";

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-sm animate-modal-in overflow-hidden">
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 flex items-start gap-4`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-rose-50' : 'bg-blue-50'
          }`}>
            {isDanger
              ? <Trash2 size={18} className="text-rose-600" />
              : <AlertTriangle size={18} className="text-brand-blue" />
            }
          </div>
          <div className="flex-1">
            <h3 className="font-black text-sm text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 text-slate-400 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-6" />

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider text-white rounded-xl transition ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200'
                : 'bg-brand-blue hover:bg-brand-blue-hover shadow-sm shadow-blue-200'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to manage confirm modal state
export function useConfirm() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'default';
    resolve?: (confirmed: boolean) => void;
  }>({ isOpen: false, title: '', message: '' });

  const confirm = React.useCallback((
    title: string,
    message: string,
    options?: { confirmLabel?: string; variant?: 'danger' | 'default' }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, title, message, ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState(s => ({ ...s, isOpen: false }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState(s => ({ ...s, isOpen: false }));
  };

  const modal = (
    <ConfirmModal
      isOpen={state.isOpen}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, modal };
}
