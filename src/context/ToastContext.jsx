import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Bell, CircleAlert, CircleCheck, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
  notification: Bell,
};

// One place for every transient message, replacing native alert() popups and
// the per-page notice banners that each page used to roll on its own.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (input, tone = 'info') => {
      const toast = typeof input === 'string' ? { title: input, tone } : { tone, ...input };
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      // Keep at most three on screen so they never cover the page.
      setToasts((current) => [...current, { ...toast, id }].slice(-3));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), toast.duration || 5000),
      );
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      notify,
      dismiss,
      success: (input) => notify(input, 'success'),
      error: (input) => notify(input, 'error'),
      info: (input) => notify(input, 'info'),
    }),
    [notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 ? (
        <Stack aria-live="polite">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.tone] || Info;
            return (
              <Toast key={toast.id} role="status" $tone={toast.tone}>
                <IconTile $tone={toast.tone}>
                  <Icon size={18} />
                </IconTile>
                <Body>
                  <strong>{toast.title}</strong>
                  {toast.body ? <span>{toast.body}</span> : null}
                </Body>
                <Close type="button" aria-label="Dismiss" onClick={() => dismiss(toast.id)}>
                  <X size={16} />
                </Close>
              </Toast>
            );
          })}
        </Stack>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const toneColor = (tone, theme) => {
  if (tone === 'success') return theme.colors.success;
  if (tone === 'error') return theme.colors.error;
  return theme.colors.primary;
};

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(16px) scale(0.98); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
`;

const Stack = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  display: grid;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
`;

const Toast = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-left: 4px solid ${({ $tone, theme }) => toneColor($tone, theme)};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: 12px 14px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  animation: ${slideIn} 200ms ease;
`;

const IconTile = styled.span`
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ $tone, theme }) => toneColor($tone, theme)};
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    color: ${({ theme }) => theme.colors.onSurface};
    font-size: 0.94rem;
    line-height: 1.35;
  }

  span {
    display: block;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.84rem;
    line-height: 1.4;
  }
`;

const Close = styled.button`
  display: grid;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }
`;
