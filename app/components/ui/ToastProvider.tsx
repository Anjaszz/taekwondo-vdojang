"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextProps {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const variantConfig: Record<ToastVariant, { icon: React.ReactNode; bg: string; border: string; text: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle size={16} />,
    bg: 'bg-emerald-950',
    border: 'border-emerald-700/40',
    text: 'text-emerald-100',
    iconColor: 'text-emerald-400',
  },
  error: {
    icon: <XCircle size={16} />,
    bg: 'bg-rose-950',
    border: 'border-rose-700/40',
    text: 'text-rose-100',
    iconColor: 'text-rose-400',
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    bg: 'bg-amber-950',
    border: 'border-amber-700/40',
    text: 'text-amber-100',
    iconColor: 'text-amber-400',
  },
  info: {
    icon: <Info size={16} />,
    bg: 'bg-blue-950',
    border: 'border-blue-700/40',
    text: 'text-blue-100',
    iconColor: 'text-blue-400',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const config = variantConfig[toast.variant];

  useEffect(() => {
    // Trigger entrance animation
    const in_ = setTimeout(() => setVisible(true), 10);
    // Auto dismiss
    const out = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 350);
    }, toast.duration || 4000);

    return () => { clearTimeout(in_); clearTimeout(out); };
  }, [toast, onDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl max-w-sm w-full
        transition-all duration-350 ease-out
        ${config.bg} ${config.border} ${config.text}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      <span className={`shrink-0 mt-0.5 ${config.iconColor}`}>{config.icon}</span>
      <p className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 350); }}
        className="shrink-0 text-white/40 hover:text-white/80 transition mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, message, variant, duration }]);
  }, []);

  const ctx: ToastContextProps = {
    toast: addToast,
    success: (m) => addToast(m, 'success'),
    error: (m) => addToast(m, 'error'),
    warning: (m) => addToast(m, 'warning'),
    info: (m) => addToast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
