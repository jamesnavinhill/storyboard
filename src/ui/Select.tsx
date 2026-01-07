/**
 * UI Primitive: Select Component
 *
 * This is a reusable UI primitive with no business logic or feature-specific dependencies.
 * UI primitives live in src/ui/ and can be imported by any feature using @/ui/Select.
 *
 * Organizational Pattern:
 * - src/ui/ - Generic, reusable UI components (primitives)
 * - src/components/ - Truly shared components used across multiple features
 * - src/features/[feature]/components/ - Feature-specific components with business logic
 */
import React from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface SelectProps {
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  title?: string;
  className?: string; // applied to trigger
  menuClassName?: string; // applied to menu
  size?: "sm" | "md";
}

// A minimal, accessible custom select: neutral trigger; fully styled popover list with brand-tinted hover/active — no OS blue.
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  ariaLabel,
  title,
  className = "",
  menuClassName = "",
  size = "md",
}) => {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  });
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    // Ensure active index is in-bounds and try to focus list for keyboard
    let idx = options.findIndex((o) => o.value === value);
    if (idx < 0) idx = 0;
    setActiveIndex(idx);
    listRef.current?.focus();
  }, [open, value, options]);

  const selected = options.find((o) => o.value === value) ?? null;
  const sizeClasses =
    size === "sm" ? "select-sm px-3 text-sm" : "px-3 py-1.5 text-sm";
  const triggerClasses = `select-base ${sizeClasses} ${className}`.trim();
  const menuClasses =
    `popover popover-elevated absolute left-0 z-40 mt-1 p-0 overflow-auto select-menu ${menuClassName}`.trim();

  function commitIndex(idx: number) {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDownList(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      commitIndex(activeIndex);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      let next = activeIndex + 1;
      while (next < options.length && options[next]?.disabled) next++;
      if (next < options.length) setActiveIndex(next);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      let prev = activeIndex - 1;
      while (prev >= 0 && options[prev]?.disabled) prev--;
      if (prev >= 0) setActiveIndex(prev);
      return;
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        className={triggerClasses}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        title={title}
        onClick={() => setOpen((s) => !s)}
      >
        <span className="truncate max-w-[18ch] inline-block align-middle">
          {selected ? (
            selected.label
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </span>
        <span className="ml-2 opacity-70" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel || title || placeholder}
          tabIndex={-1}
          className={menuClasses}
          onKeyDown={onKeyDownList}
        >
          {options.map((opt, idx) => {
            const isActive = idx === activeIndex;
            const isSelected = value === opt.value;
            const baseItem =
              "px-3 py-2 text-sm cursor-pointer select-none flex items-center justify-between";
            const visual =
              isActive || isSelected
                ? "bg-primary-soft text-primary"
                : "bg-transparent hover:bg-primary-soft";
            const disabledCls = opt.disabled
              ? "opacity-50 cursor-not-allowed"
              : "";
            return (
              <li
                key={opt.value}
                role="option"
                className={`${baseItem} ${visual} ${disabledCls}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) =>
                  e.preventDefault()
                } /* keep focus for click */
                onClick={() => commitIndex(idx)}
              >
                <span className="truncate pr-4">{opt.label}</span>
                {isSelected && <span aria-hidden>✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Select;
