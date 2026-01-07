import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { debounce } from "../utils/debounce";

export interface UseAutosaveOptions<T> {
  /**
   * The data to autosave
   */
  data: T;

  /**
   * Function to call when saving
   */
  onSave: (data: T) => Promise<void>;

  /**
   * Delay in milliseconds before triggering autosave after data changes
   * @default 2000
   */
  delay?: number;

  /**
   * Whether autosave is enabled
   * @default true
   */
  enabled?: boolean;
}

export interface UseAutosaveReturn {
  /**
   * Whether a save operation is currently in progress
   */
  isSaving: boolean;

  /**
   * Timestamp of the last successful save
   */
  lastSaved: Date | null;

  /**
   * Error from the last save attempt, if any
   */
  error: Error | null;

  /**
   * Manually trigger a save operation immediately
   */
  forceSave: () => Promise<void>;
}

/**
 * Hook for automatic saving of data after a delay
 *
 * Features:
 * - Debounced save logic to prevent excessive save operations
 * - Tracks saving state, last saved time, and errors
 * - Supports force save on demand
 * - Prevents save on initial load (only after edits)
 * - Automatic cleanup on unmount
 *
 * @example
 * ```tsx
 * const { isSaving, lastSaved, forceSave } = useAutosave({
 *   data: formData,
 *   onSave: async (data) => {
 *     await api.saveProject(data);
 *   },
 *   delay: 2000,
 *   enabled: hasEdits
 * });
 * ```
 */
export function useAutosave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Track if this is the initial mount to prevent save on initial load
  const isInitialMount = useRef(true);

  // Store the latest data in a ref to avoid stale closures
  const dataRef = useRef(data);
  dataRef.current = data;

  // Store the onSave function in a ref to avoid recreating debounced function
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async () => {
    if (!enabled) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSaveRef.current(dataRef.current);
      setLastSaved(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Save failed");
      setError(error);
      console.error("Autosave failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [enabled]);

  /**
   * Debounced save function
   */
  const debouncedSave = useMemo(
    () => debounce(performSave, { delay }),
    [performSave, delay]
  );

  /**
   * Force save immediately without debouncing
   */
  const forceSave = useCallback(async () => {
    // Cancel any pending debounced save
    debouncedSave.cancel();
    await performSave();
  }, [debouncedSave, performSave]);

  /**
   * Trigger autosave when data changes (but not on initial mount)
   */
  useEffect(() => {
    // Skip autosave on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only trigger if enabled
    if (!enabled) return;

    // Trigger debounced save
    debouncedSave();

    // Cleanup: cancel pending save on unmount or when dependencies change
    return () => {
      debouncedSave.cancel();
    };
  }, [data, enabled, debouncedSave]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    isSaving,
    lastSaved,
    error,
    forceSave,
  };
}
