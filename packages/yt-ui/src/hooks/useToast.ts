'use client';

import { useEffect, useState } from 'react';
import type { ToastVariant } from '../components/Toast';

type ToastData = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  open: boolean;
};

type ToastInput = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastState = ToastData[];
type Listener = (state: ToastState) => void;

const listeners = new Set<Listener>();
let memoryState: ToastState = [];

const notify = () => {
  listeners.forEach((listener) => {
    listener(memoryState);
  });
};

const removeToast = (id: string) => {
  memoryState = memoryState.filter((toast) => toast.id !== id);
  notify();
};

const dismissToast = (id: string) => {
  memoryState = memoryState.map((toast) =>
    toast.id === id ? { ...toast, open: false } : toast,
  );
  notify();
};

const addToast = ({
  message,
  variant = 'info',
  duration = 3000,
}: ToastInput) => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const toast: ToastData = {
    id,
    message,
    variant,
    duration,
    open: true,
  };
  memoryState = [toast, ...memoryState].slice(0, 3);
  notify();
  return {
    id,
    dismiss: () => dismissToast(id),
  };
};

export const useToast = () => {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    toasts: state,
    toast: addToast,
    dismiss: dismissToast,
    remove: removeToast,
  };
};
