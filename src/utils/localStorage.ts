/**
 * Safe localStorage utility with error handling for quota exceeded and unavailable scenarios
 */

// Define storage key types for type safety
export type StorageKey =
  // Layout keys
  | "vb:layout:sidebarWidth"
  | "vb:layout:sidebarCollapsed"
  | "vb:layout:chatWidth"
  | "vb:layout:chatCollapsed"
  | "vb:layout:storyboardCollapsed"
  | "vb:layout:sceneManagerWidth"
  | "vb:layout:sceneManagerCollapsed"
  // UI state keys
  | "vb:ui:chatAgent"
  | "vb:ui:currentView"
  | "vb:ui:aspectRatio"
  | "vb:lmd:topTab"
  | "vb:lmd:gtSub"
  // Settings keys
  | "vb:settings:global"
  // Theme key
  | "vibeBoardTheme";

/**
 * Safely get a value from localStorage
 * @param key - The storage key to retrieve
 * @param fallback - The fallback value if retrieval fails or key doesn't exist
 * @returns The stored value or fallback
 */
export function safeGet<T = string>(key: StorageKey, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    if (value === null) {
      return fallback;
    }

    // Try to parse as JSON if it looks like JSON
    if (
      typeof fallback !== "string" &&
      (value.startsWith("{") || value.startsWith("["))
    ) {
      try {
        return JSON.parse(value) as T;
      } catch {
        // If JSON parse fails, return as string or fallback
        return (value as unknown as T) || fallback;
      }
    }

    return (value as unknown as T) || fallback;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return fallback;
  }
}

/**
 * Safely set a value in localStorage
 * @param key - The storage key to set
 * @param value - The value to store (will be JSON stringified if not a string)
 * @returns true if successful, false otherwise
 */
export function safeSet<T>(key: StorageKey, value: T): boolean {
  try {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    window.localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "QuotaExceededError") {
        console.error(`localStorage quota exceeded when setting ${key}`);
      } else {
        console.warn(`Failed to persist ${key} to localStorage:`, error);
      }
    }
    return false;
  }
}

/**
 * Safely remove a value from localStorage
 * @param key - The storage key to remove
 * @returns true if successful, false otherwise
 */
export function safeRemove(key: StorageKey): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove ${key} from localStorage:`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns true if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__localStorage_test__";
    window.localStorage.setItem(testKey, "test");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
