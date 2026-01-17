import { useState, useEffect, useCallback } from "react";

export type TopTab = "library" | "details" | "groups-tags" | "history";
export type LibrarySubTab = "projects" | "assets";
export type GTSubTab = "groups" | "tags";

// Local storage keys for tiny persisted UI state
const STORAGE_KEYS = {
  topTab: "vb:lmd:topTab",
  librarySubTab: "vb:lmd:libSub",
  gtSubTab: "vb:lmd:gtSub",
  search: "vb:lmd:search",
} as const;

const isTopTab = (v: unknown): v is TopTab =>
  v === "library" || v === "details" || v === "groups-tags" || v === "history";
const isLibrarySubTab = (v: unknown): v is LibrarySubTab =>
  v === "projects" || v === "assets";
const isGTSubTab = (v: unknown): v is GTSubTab =>
  v === "groups" || v === "tags";

export interface UseDrawerTabsOptions {
  defaultTopTab?: TopTab;
  defaultLibrarySubTab?: LibrarySubTab;
  defaultGTSubTab?: GTSubTab;

  // Controlled state for library sub-tab
  librarySubTab?: LibrarySubTab;
  onLibrarySubTabChange?: (subTab: LibrarySubTab) => void;

  // Controlled state for search
  librarySearch?: string;
  onLibrarySearchChange?: (value: string) => void;
}

export interface DrawerTabsState {
  // Top-level tab state
  topTab: TopTab;
  setTopTab: (tab: TopTab) => void;

  // Library sub-tab state
  librarySubTab: LibrarySubTab;
  setLibrarySubTab: (subTab: LibrarySubTab) => void;

  // Groups & Tags sub-tab state
  gtSubTab: GTSubTab;
  setGTSubTab: (subTab: GTSubTab) => void;

  // Search state
  search: string;
  setSearch: (value: string) => void;
}

export const useDrawerTabs = (
  options: UseDrawerTabsOptions = {}
): DrawerTabsState => {
  const {
    defaultTopTab = "library",
    defaultLibrarySubTab = "projects",
    defaultGTSubTab = "groups",
    librarySubTab: controlledLibrarySubTab,
    onLibrarySubTabChange,
    librarySearch: controlledLibrarySearch,
    onLibrarySearchChange,
  } = options;

  const [topTab, setTopTab] = useState<TopTab>(defaultTopTab);
  const [librarySubTabState, setLibrarySubTabState] =
    useState<LibrarySubTab>(defaultLibrarySubTab);
  const [gtSubTab, setGTSubTab] = useState<GTSubTab>(defaultGTSubTab);
  const [searchState, setSearchState] = useState("");

  // Use controlled values if provided, otherwise use internal state
  const librarySubTab = controlledLibrarySubTab ?? librarySubTabState;
  const search =
    controlledLibrarySearch !== undefined
      ? controlledLibrarySearch
      : searchState;

  // Sync controlled values to internal state
  useEffect(() => {
    if (controlledLibrarySubTab) {
      setLibrarySubTabState(controlledLibrarySubTab);
    }
  }, [controlledLibrarySubTab]);

  useEffect(() => {
    if (controlledLibrarySearch !== undefined) {
      setSearchState(controlledLibrarySearch);
    }
  }, [controlledLibrarySearch]);

  // Load persisted UI state on mount (SSR-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedTop = window.localStorage.getItem(STORAGE_KEYS.topTab);
      if (storedTop && isTopTab(storedTop)) {
        setTopTab(storedTop);
      }
      const storedLib = window.localStorage.getItem(STORAGE_KEYS.librarySubTab);
      if (storedLib && isLibrarySubTab(storedLib)) {
        setLibrarySubTabState(storedLib);
        onLibrarySubTabChange?.(storedLib);
      }
      const storedGT = window.localStorage.getItem(STORAGE_KEYS.gtSubTab);
      if (storedGT && isGTSubTab(storedGT)) {
        setGTSubTab(storedGT);
      }
      const storedSearch = window.localStorage.getItem(STORAGE_KEYS.search);
      if (typeof storedSearch === "string") {
        setSearchState(storedSearch);
        onLibrarySearchChange?.(storedSearch);
      }
    } catch {
      // Ignore storage errors (e.g., privacy mode)
    }
    // We intentionally run this only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state when values change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.topTab, topTab);
    } catch {}
  }, [topTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.librarySubTab, librarySubTab);
    } catch {}
  }, [librarySubTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.search, search);
    } catch {}
  }, [search]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.gtSubTab, gtSubTab);
    } catch {}
  }, [gtSubTab]);

  // Handlers
  const handleSetLibrarySubTab = useCallback(
    (next: LibrarySubTab) => {
      setLibrarySubTabState(next);
      onLibrarySubTabChange?.(next);
    },
    [onLibrarySubTabChange]
  );

  const handleSetSearch = useCallback(
    (value: string) => {
      setSearchState(value);
      onLibrarySearchChange?.(value);
    },
    [onLibrarySearchChange]
  );

  return {
    topTab,
    setTopTab,
    librarySubTab,
    setLibrarySubTab: handleSetLibrarySubTab,
    gtSubTab,
    setGTSubTab,
    search,
    setSearch: handleSetSearch,
  };
};
