'use client';

import { Check, X, AlertCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ type, message, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <Check className="h-5 w-5" />,
    error: <X className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  const colors = {
    success: 'bg-[#2ECC71] text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-orange-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  return (
    <div
      className={`fixed right-4 top-4 z-[9999] flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg transition-all duration-300 ${
        colors[type]
      } ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="ml-2 hover:opacity-80"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast 관리 Hook
interface ToastState {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;
const toastListeners: Set<(toasts: ToastState[]) => void> = new Set();
let toasts: ToastState[] = [];

function emitChange() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function showToast(type: ToastType, message: string) {
  const id = toastId++;
  toasts.push({ id, type, message });
  emitChange();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 3500);
}

export function useToasts() {
  const [state, setState] = useState<ToastState[]>([]);

  useEffect(() => {
    toastListeners.add(setState);
    return () => {
      toastListeners.delete(setState);
    };
  }, []);

  return state;
}

// Toast Container
export function ToastContainer() {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-end gap-2 p-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => {
            // Auto-removed by timeout
          }}
        />
      ))}
    </div>
  );
}
