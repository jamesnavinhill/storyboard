import { useEffect, useMemo, useRef, useState } from "react";

export interface UseSearchStateOptions<T = unknown> {
  storageKey?: string;
  initial?: string;
  debounceMs?: number;
  // Optional helper: provide items + accessors to get a filtered list back
  items?: T[];
  predicate?: (item: T, query: string) => boolean;
}

export interface UseSearchStateResult<T = unknown> {
  query: string;
  setQuery: (q: string) => void;
  debouncedQuery: string;
  clear: () => void;
  // If items were provided, return a memoized filtered list
  filtered?: T[];
}

// Shared search state with debounce + localStorage persistence
export function useSearchState<T = unknown>(
  options: UseSearchStateOptions<T> = {}
): UseSearchStateResult<T> {
  const {
    storageKey,
    initial = "",
    debounceMs = 200,
    items,
    predicate,
  } = options;
  const [query, setQuery] = useState<string>(() => {
    if (typeof window === "undefined" || !storageKey) return initial;
    try {
      const v = window.localStorage.getItem(storageKey);
      return typeof v === "string" ? v : initial;
    } catch {
      return initial;
    }
  });

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    try {
      window.localStorage.setItem(storageKey, query);
    } catch {}
  }, [query, storageKey]);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setDebouncedQuery(query);
      timerRef.current = null;
    }, debounceMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  const clear = () => setQuery("");

  const filtered = useMemo(() => {
    if (!items) return undefined;
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return items;
    if (!predicate) return items as T[];
    return items.filter((it) => predicate(it, q));
  }, [items, debouncedQuery, predicate]);

  return { query, setQuery, debouncedQuery, clear, filtered };
}
