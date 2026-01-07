import React from "react";
import type { PresetStyle } from "@/types";

export interface StylePresetPickerProps {
  styles: PresetStyle[];
  selectedStyles: PresetStyle[];
  onToggleStyle: (style: PresetStyle) => void;
  onClose: () => void;
}

export const StylePresetPicker: React.FC<StylePresetPickerProps> = ({
  styles,
  selectedStyles,
  onToggleStyle,
  onClose,
}) => {
  return (
    <div className="popover popover-elevated absolute inset-0 p-2 sm:p-3 z-30 flex flex-col">
      <h3 className="text-xs sm:text-sm font-semibold mb-2">Style Presets</h3>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-1 overflow-y-auto hide-scrollbar pr-1 pt-1 pb-6 sm:pb-7">
        {styles.map((style) => {
          const isSelected = selectedStyles.some((s) => s.id === style.id);
          return (
            <button
              key={style.id}
              onClick={() => onToggleStyle(style)}
              className="text-left group relative"
              aria-label={`${isSelected ? "Remove" : "Add"} ${
                style.name
              } style`}
              aria-pressed={isSelected}
            >
              <div
                className={`aspect-square w-full bg-muted overflow-hidden transition-all ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-primary border border-primary"
                    : "ring-1 ring-transparent group-hover:opacity-90"
                }`}
              >
                <img
                  src={style.thumbnail}
                  alt={style.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] sm:text-xs mt-1 truncate text-muted hover-primary">
                {style.name}
              </p>
            </button>
          );
        })}
      </div>
      <div className="pt-2 sm:pt-3 sticky bottom-0 bg-popover/80 backdrop-blur border-t border-muted -mx-2 sm:-mx-3 px-2 sm:px-3">
        <button
          onClick={onClose}
          className="mt-2 w-full text-center py-1.5 text-xs btn-base btn-outline-destructive rounded"
          aria-label="Close style presets"
        >
          Done
        </button>
      </div>
    </div>
  );
};
