/**
 * Utility for managing scene group stacking preferences in localStorage
 */

const STORAGE_KEY = "vibeboard_stacking_prefs";

interface StackingPreferences {
  [projectId: string]: {
    [groupId: string]: boolean;
  };
}

export function getStackingPreference(
  projectId: string,
  groupId: string
): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const prefs: StackingPreferences = JSON.parse(stored);
    return prefs[projectId]?.[groupId] ?? false;
  } catch {
    return false;
  }
}

export function setStackingPreference(
  projectId: string,
  groupId: string,
  isStacked: boolean
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefs: StackingPreferences = stored ? JSON.parse(stored) : {};
    if (!prefs[projectId]) {
      prefs[projectId] = {};
    }
    prefs[projectId][groupId] = isStacked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function clearStackingPreferences(projectId?: string): void {
  try {
    if (projectId) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs: StackingPreferences = JSON.parse(stored);
        delete prefs[projectId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Silently fail
  }
}
