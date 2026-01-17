import { useState } from "react";
import type { Settings } from "../../../types";

/**
 * Hook for managing session-only settings overrides.
 * These overrides are applied during the current session but are not persisted.
 * Useful for temporary settings changes that shouldn't affect saved preferences.
 */
export const useSessionOverrides = () => {
  const [sessionOverrides, setSessionOverrides] = useState<Partial<Settings>>(
    {}
  );

  return [sessionOverrides, setSessionOverrides] as const;
};
