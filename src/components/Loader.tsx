/**
 * Shared Component: Loader
 *
 * This is a truly shared component used across multiple features.
 * Shared components live in src/components/ and should be minimal - most components
 * belong in feature modules (src/features/[feature]/components/).
 *
 * Only components that are genuinely used across many features should live here.
 */
import React from "react";

export const Loader: React.FC = () => {
  return (
    <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
  );
};
