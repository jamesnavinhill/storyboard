import { useEffect } from "react";
import { useToast } from "../../../components/toast/useToast";
import type { ToastEvent } from "../../project/state/projectStore";

/**
 * Hook that bridges store-driven toasts to the UI toast system.
 * Monitors the toast queue from the project store and displays them using the UI toast component.
 * 
 * @param toasts - Array of toast events from the store
 * @param dequeueToast - Function to remove a toast from the store queue after displaying
 */
export const useToastBridge = (
  toasts: ToastEvent[] | undefined,
  dequeueToast: (id: number) => void
) => {
  const { show: showToast } = useToast();

  useEffect(() => {
    if (!toasts || toasts.length === 0) return;

    for (const t of toasts) {
      const variant =
        t.type === "error"
          ? "error"
          : t.type === "success"
          ? "success"
          : "info";
      try {
        showToast({ description: t.message, variant });
      } finally {
        dequeueToast(t.id);
      }
    }
  }, [toasts, dequeueToast, showToast]);
};
