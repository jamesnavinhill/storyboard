import React, { useRef, useState, useEffect } from "react";
import { Settings, Trash2 } from "lucide-react";

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface ProjectContextMenuProps {
  projectId: string;
  projectName: string;
  onManage: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

/**
 * Calculate context menu position with viewport boundary detection
 * Ensures menu stays visible near viewport edges
 */
const calculateMenuPosition = (
  triggerRect: DOMRect,
  menuHeight: number,
  menuWidth: number
): MenuPosition => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const position: MenuPosition = {};
  const SPACING = 4; // Gap between trigger and menu

  // Vertical positioning
  const spaceBelow = viewport.height - triggerRect.bottom;
  const spaceAbove = triggerRect.top;

  if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
    // Position below trigger
    position.top = triggerRect.bottom + SPACING;
  } else {
    // Position above trigger
    position.bottom = viewport.height - triggerRect.top + SPACING;
  }

  // Horizontal positioning
  const spaceRight = viewport.width - triggerRect.right;
  const spaceLeft = triggerRect.left;

  if (spaceRight >= menuWidth) {
    // Position to the right of trigger
    position.left = triggerRect.right;
  } else if (spaceLeft >= menuWidth) {
    // Position to the left of trigger
    position.right = viewport.width - triggerRect.left;
  } else {
    // Not enough space on either side, align to right edge with padding
    position.right = 8;
  }

  return position;
};

/**
 * ProjectContextMenu component
 * Displays a three-dot menu on hover with "Manage" and "Delete" options
 * Matches styling of scene card context menus
 */
export const ProjectContextMenu: React.FC<ProjectContextMenuProps> = ({
  projectId,
  projectName,
  onManage,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({});
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project selection when clicking menu

    if (!menuOpen && menuButtonRef.current) {
      // Calculate position when opening menu
      const rect = menuButtonRef.current.getBoundingClientRect();
      const MENU_WIDTH = 192; // 48 * 4 = 192px (w-48)
      const MENU_HEIGHT = 120; // Approximate height for 2 items
      const pos = calculateMenuPosition(rect, MENU_HEIGHT, MENU_WIDTH);
      setMenuPosition(pos);
    }
    setMenuOpen((s) => !s);
  };

  const handleManage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onManage(projectId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete(projectId);
  };

  // Show menu button on hover or when menu is open
  const shouldShowButton = isHovered || menuOpen;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Three-dot menu button */}
      <button
        ref={menuButtonRef}
        type="button"
        onClick={handleMenuToggle}
        aria-label="Project options"
        className={`icon-btn-overlay p-1.5 transition-opacity ${
          shouldShowButton ? "opacity-100" : "opacity-0"
        }`}
        style={{ pointerEvents: shouldShowButton ? "auto" : "none" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon-sm"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="rounded-lg shadow-lg p-2 w-48"
          style={{
            position: "fixed",
            zIndex: "var(--z-dropdown)",
            backgroundColor: "var(--popover)",
            border: "1px solid var(--card-border)",
            top:
              menuPosition.top !== undefined
                ? `${menuPosition.top}px`
                : undefined,
            bottom:
              menuPosition.bottom !== undefined
                ? `${menuPosition.bottom}px`
                : undefined,
            left:
              menuPosition.left !== undefined
                ? `${menuPosition.left}px`
                : undefined,
            right:
              menuPosition.right !== undefined
                ? `${menuPosition.right}px`
                : undefined,
          }}
          role="menu"
        >
          <button
            type="button"
            onClick={handleManage}
            className="menu-item flex items-center"
            role="menuitem"
          >
            <Settings className="icon-sm mr-2" /> Manage
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="menu-item text-danger flex items-center"
            role="menuitem"
          >
            <Trash2 className="icon-sm mr-2" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};
