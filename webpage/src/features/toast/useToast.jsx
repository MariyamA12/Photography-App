// src/features/toast/useToast.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({
  message: '',
  type: 'info',
  toast: (msg, type) => {},
  clear: () => {},
});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  // Stable toast function: won't change identity across renders
  const toast = useCallback((msg, t = 'info') => {
    setMessage(msg);
    setType(t);
    setTimeout(() => setMessage(''), 3000);
  }, []);

  const clear = useCallback(() => {
    setMessage('');
  }, []);

  return (
    <ToastContext.Provider value={{ message, type, toast, clear }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
