import { useState, useEffect } from "react";

/**
 * Hook to determine if text labels should be shown alongside icons
 * based on viewport width. Returns true when viewport is wide enough
 * to show text labels, false when only icons should be shown.
 *
 * @param breakpoint - Viewport width in pixels below which only icons are shown (default: 640px)
 * @returns boolean - true if text labels should be shown, false for icon-only
 */
export const useResponsiveIcons = (breakpoint: number = 640): boolean => {
  const [showTextLabels, setShowTextLabels] = useState(
    window.innerWidth >= breakpoint
  );

  useEffect(() => {
    const handleResize = () => {
      setShowTextLabels(window.innerWidth >= breakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return showTextLabels;
};
