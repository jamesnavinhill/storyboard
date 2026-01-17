/**
 * Debounce utility for autosave with configurable delay and immediate execution option
 */

export interface DebounceOptions {
  /**
   * Delay in milliseconds before executing the function
   */
  delay: number;

  /**
   * If true, execute immediately on the first call, then debounce subsequent calls
   */
  immediate?: boolean;
}

/**
 * Creates a debounced function that delays invoking func until after delay milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param options - Debounce configuration options
 * @returns A debounced version of the function with a cancel method
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;

  const debouncedFunc = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const shouldCallImmediately =
      options.immediate && now - lastCallTime > options.delay;

    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Execute immediately if immediate option is set and enough time has passed
    if (shouldCallImmediately) {
      lastCallTime = now;
      return func.apply(this, args);
    }

    // Otherwise, schedule execution after delay
    timeoutId = setTimeout(() => {
      lastCallTime = Date.now();
      timeoutId = null;
      func.apply(this, args);
    }, options.delay);
  } as T & { cancel: () => void };

  // Add cancel method to clear pending execution
  debouncedFunc.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunc;
}

/**
 * React hook-friendly debounce that automatically cleans up on unmount
 * Use this with useEffect to ensure cleanup happens properly
 *
 * @example
 * ```tsx
 * const debouncedSave = useMemo(
 *   () => debounce(saveFunction, { delay: 500 }),
 *   [saveFunction]
 * );
 *
 * useEffect(() => {
 *   return () => debouncedSave.cancel();
 * }, [debouncedSave]);
 * ```
 */
export function createDebouncedCallback<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate = false
): T & { cancel: () => void } {
  return debounce(func, { delay, immediate });
}
