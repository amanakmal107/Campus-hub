import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '380px',
      width: '100%',
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-lg)',
            border: `1px solid ${
              toast.type === 'error' ? 'var(--accent-rose)' :
              toast.type === 'success' ? 'var(--accent)' :
              toast.type === 'warning' ? 'var(--accent-orange)' : 'var(--primary)'
            }`,
            animation: 'slideIn 0.25s ease-out',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                toast.type === 'error' ? 'var(--accent-rose)' :
                toast.type === 'success' ? 'var(--accent)' :
                toast.type === 'warning' ? 'var(--accent-orange)' : 'var(--primary)',
            }} />
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              lineHeight: 1,
              marginLeft: '12px',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
