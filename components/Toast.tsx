import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Simple event bus for toasts to avoid complex context in this MVP
const TOAST_EVENT = 'rankwars:toast';

export const toast = (message: string, type: ToastType = 'success') => {
  const event = new CustomEvent(TOAST_EVENT, { detail: { message, type } });
  window.dispatchEvent(event);
};

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts(prev => [...prev, { id, message: detail.message, type: detail.type }]);

      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl shadow-black/20 text-white min-w-[300px] animate-fade-up
            ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-slate-700'}
          `}
        >
          {t.type === 'success' && <CheckCircle size={18} />}
          {t.type === 'error' && <AlertCircle size={18} />}
          <p className="text-sm font-medium flex-grow">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};