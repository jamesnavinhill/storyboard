import type { SceneActivityType } from "../types";

const ALLOWED_TRANSITIONS: Record<SceneActivityType, SceneActivityType[]> = {
  idle: [
    "generating-image",
    "editing-image",
    "generating-video",
    "regenerating-description",
    "regenerating-prompt",
  ],
  "generating-image": ["idle"],
  "editing-image": ["idle"],
  "generating-video": ["idle"],
  "regenerating-description": ["idle"],
  "regenerating-prompt": ["idle"],
};

export class SceneActivityTransitionError extends Error {
  constructor(
    public readonly from: SceneActivityType,
    public readonly to: SceneActivityType
  ) {
    super(`Invalid scene activity transition: ${from} → ${to}`);
    this.name = "SceneActivityTransitionError";
  }
}

export const canTransitionSceneActivity = (
  from: SceneActivityType,
  to: SceneActivityType
): boolean => {
  if (from === to) {
    return true;
  }
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
};

export const transitionSceneActivity = (
  from: SceneActivityType,
  to: SceneActivityType
): SceneActivityType => {
  if (from === to) {
    return to;
  }
  if (!canTransitionSceneActivity(from, to)) {
    throw new SceneActivityTransitionError(from, to);
  }
  return to;
};
