import type { Scene } from "../types";

/**
 * Calculate the total duration of all scenes in seconds
 * @param scenes Array of scenes
 * @returns Total duration in seconds
 */
export function calculateTotalDuration(scenes: Scene[]): number {
  return scenes.reduce((total, scene) => total + (scene.duration || 0), 0);
}

/**
 * Format duration in seconds to a human-readable string (MM:SS)
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Format duration in seconds to a detailed human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "2 minutes 30 seconds")
 */
export function formatDurationDetailed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  return `${minutes} minute${
    minutes !== 1 ? "s" : ""
  } ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
}
