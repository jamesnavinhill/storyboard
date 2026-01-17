import type { Settings } from "../../../types";

/**
 * Normalizes settings data from storage, applying fallback values for missing or invalid fields
 */
export const normalizeSettings = (
  data: unknown,
  fallback: Settings
): Settings => {
  if (!data || typeof data !== "object") return fallback;
  const incoming = data as Partial<Settings>;
  return {
    sceneCount:
      typeof incoming.sceneCount === "number" && incoming.sceneCount > 0
        ? incoming.sceneCount
        : fallback.sceneCount,
    chatModel: incoming.chatModel ?? fallback.chatModel,
    imageModel: incoming.imageModel ?? fallback.imageModel,
    videoModel: incoming.videoModel ?? fallback.videoModel,
    workflow: incoming.workflow ?? fallback.workflow,
    videoAutoplay: incoming.videoAutoplay ?? fallback.videoAutoplay,
    videoResolution: incoming.videoResolution ?? fallback.videoResolution,
    videoDuration: incoming.videoDuration ?? fallback.videoDuration,
  };
};

/**
 * Validates that a filter ID exists in the provided list
 * Returns the filter ID if valid, null otherwise
 */
export const validateFilter = <T extends { id: string }>(
  filterId: string | null,
  items: T[]
): string | null => {
  if (!filterId) return null;
  return items.some((item) => item.id === filterId) ? filterId : null;
};

/**
 * Ensures unique items in an array by ID
 */
export const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/**
 * Ensures unique string values in an array
 */
export const uniqueStrings = (items: string[]): string[] => {
  return Array.from(new Set(items));
};

/**
 * Creates a map from an array of items by their ID
 */
export const createIdMap = <T extends { id: string }>(
  items: T[]
): Map<string, T> => {
  return new Map(items.map((item) => [item.id, item]));
};

/**
 * Safely updates an item in an array by ID
 */
export const updateItemById = <T extends { id: string }>(
  items: T[],
  id: string,
  updater: (item: T) => T
): T[] => {
  return items.map((item) => (item.id === id ? updater(item) : item));
};

/**
 * Safely removes an item from an array by ID
 */
export const removeItemById = <T extends { id: string }>(
  items: T[],
  id: string
): T[] => {
  return items.filter((item) => item.id !== id);
};

/**
 * Reorders items based on an array of IDs
 */
export const reorderByIds = <T extends { id: string }>(
  items: T[],
  orderedIds: string[]
): T[] => {
  const map = createIdMap(items);
  return orderedIds.map((id) => map.get(id)!).filter(Boolean);
};
