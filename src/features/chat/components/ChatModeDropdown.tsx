import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  MessageCircle,
  Lightbulb,
  Palette,
  Workflow,
} from "lucide-react";

export type ChatMode = "simple" | "concept" | "style" | "agent";

interface ChatModeOption {
  key: ChatMode;
  label: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const CHAT_MODE_OPTIONS: ChatModeOption[] = [
  {
    key: "agent",
    label: "Agent Mode",
    description: "Workflow-based generation with file uploads",
    icon: Workflow,
  },
  {
    key: "simple",
    label: "Simple Chat",
    description: "General conversation and brainstorming",
    icon: MessageCircle,
  },
  {
    key: "concept",
    label: "Concept Development",
    description: "Develop and refine your video concept",
    icon: Lightbulb,
  },
  {
    key: "style",
    label: "Style Exploration",
    description: "Explore visual styles and aesthetics",
    icon: Palette,
  },
];

interface ChatModeDropdownProps {
  selectedMode: ChatMode;
  onModeSelect: (mode: ChatMode) => void;
}

export const ChatModeDropdown: React.FC<ChatModeDropdownProps> = ({
  selectedMode,
  onModeSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedOption = CHAT_MODE_OPTIONS.find(
    (opt) => opt.key === selectedMode
  );
  const SelectedIcon = selectedOption?.icon || MessageCircle;

  const handleModeClick = (mode: ChatMode) => {
    onModeSelect(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-base btn-ghost px-3 py-1.5 rounded-md gap-1.5 text-xs font-medium hover-primary transition-colors flex items-center"
        aria-expanded={isOpen ? "true" : "false"}
        aria-haspopup="true"
        title={selectedOption?.description}
      >
        <SelectedIcon className="w-4 h-4" />
        <span className="hidden md:inline">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-muted rounded-lg shadow-lg z-50">
          {CHAT_MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = option.key === selectedMode;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handleModeClick(option.key)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  isSelected ? "bg-primary/10" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isSelected ? "text-primary" : "text-muted"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium text-sm ${
                        isSelected ? "text-primary" : ""
                      }`}
                    >
                      {option.label}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
