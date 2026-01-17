import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type ToastVariant = "error" | "warning" | "info" | "success";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  action?: ToastAction;
  duration?: number; // ms
}

export interface Toast extends Required<Omit<ToastOptions, "duration">> {
  id: string;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};

type TimerState = {
  timeoutId: number | null;
  remaining: number; // ms
  startedAt: number; // ts when timer started
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queue, setQueue] = useState<Toast[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<TimerState>({
    timeoutId: null,
    remaining: 0,
    startedAt: 0,
  });

  const now = () => Date.now();

  const makeId = () => Math.random().toString(36).slice(2, 10);

  const show = useCallback((opts: ToastOptions) => {
    const id = opts.id ?? makeId();
    const toast: Toast = {
      id,
      title: opts.title ?? "",
      description: opts.description,
      variant: opts.variant ?? "info",
      action: opts.action ?? undefined,
      duration:
        typeof opts.duration === "number"
          ? opts.duration
          : opts.variant === "error"
          ? 2000
          : 2500,
      createdAt: now(),
    } as Toast;
    setQueue((prev) => [...prev, toast]);
    return id;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current.timeoutId !== null) {
      window.clearTimeout(timerRef.current.timeoutId);
      timerRef.current.timeoutId = null;
    }
  }, []);

  const startTimer = useCallback(
    (duration: number) => {
      clearTimer();
      timerRef.current.startedAt = now();
      timerRef.current.remaining = duration;
      timerRef.current.timeoutId = window.setTimeout(() => {
        // auto-dismiss current
        setQueue((prev) => prev.slice(1));
      }, duration);
    },
    [clearTimer]
  );

  const pauseTimer = useCallback(() => {
    if (timerRef.current.timeoutId !== null) {
      const elapsed = now() - timerRef.current.startedAt;
      timerRef.current.remaining = Math.max(
        0,
        timerRef.current.remaining - elapsed
      );
      clearTimer();
    }
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (timerRef.current.remaining > 0) {
      startTimer(timerRef.current.remaining);
    }
  }, [startTimer]);

  const dismiss = useCallback((id: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setQueue([]);
  }, []);

  // Manage activeId based on queue
  useEffect(() => {
    if (queue.length === 0) {
      setActiveId(null);
      clearTimer();
      return;
    }
    const current = queue[0];
    if (current.id !== activeId) {
      setActiveId(current.id);
      // start timer for new active toast unless hovered
      if (!isHovered) {
        startTimer(current.duration);
      } else {
        // ensure timer is paused while hovered
        pauseTimer();
        timerRef.current.remaining = current.duration;
      }
    } else {
      // active unchanged, ensure timer is running or paused appropriately
      if (isHovered) {
        pauseTimer();
      } else if (
        timerRef.current.timeoutId === null &&
        timerRef.current.remaining > 0
      ) {
        resumeTimer();
      }
    }
  }, [
    queue,
    activeId,
    isHovered,
    startTimer,
    pauseTimer,
    resumeTimer,
    clearTimer,
  ]);

  const onMouseEnter = () => {
    setIsHovered(true);
  };
  const onMouseLeave = () => {
    setIsHovered(false);
  };

  const promote = useCallback((id: string) => {
    setQueue((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ show, dismiss, clear }),
    [show, dismiss, clear]
  );

  const container = (
    <div
      className="toast-viewport"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-live="polite"
      aria-atomic="true"
    >
      {queue[0] && (
        <ToastItem
          key={queue[0].id}
          toast={queue[0]}
          onDismiss={() => dismiss(queue[0].id)}
        />
      )}
      {/* Stack popover on hover */}
      {isHovered && queue.length > 1 && (
        <div className="toast-stack">
          {queue.slice(1).map((t) => (
            <button
              key={t.id}
              className={`toast toast-${t.variant} toast-queued`}
              onClick={() => promote(t.id)}
            >
              <div className="toast-body">
                {t.title && <div className="toast-title">{t.title}</div>}
                <div className="toast-desc">{t.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(container, document.body)}
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const { title, description, variant, action } = toast;
  return (
    <div className={`toast toast-${variant}`} role="status">
      <div className="toast-body">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-desc">{description}</div>
      </div>
      {action && (
        <button
          className="toast-action btn-base btn-soft-primary btn-xs"
          onClick={() => {
            onDismiss();
            try {
              action.onClick();
            } catch {
              /* no-op */
            }
          }}
        >
          {action.label}
        </button>
      )}
      <button
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
};
