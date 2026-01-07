import React, { useState } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  content: string;
}

/**
 * Simple info tooltip component that displays on hover
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="inline-flex items-center justify-center"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="More information"
      >
        <Info className="w-3.5 h-3.5 text-muted opacity-60 hover:opacity-100 transition-opacity" />
      </button>
      {isVisible && (
        <div
          className="absolute z-50 px-3 py-2 text-xs rounded-lg shadow-lg whitespace-normal max-w-xs"
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            bottom: "calc(100% + 4px)",
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: "200px",
          }}
          role="tooltip"
        >
          {content}
          <div
            className="absolute"
            style={{
              bottom: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid var(--border)",
            }}
          />
        </div>
      )}
    </div>
  );
};
