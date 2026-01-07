import React, { useState } from "react";
import { Eye, AlertCircle } from "lucide-react";

interface SystemInstructionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onPreview?: () => void;
  placeholder?: string;
}

export const SystemInstructionEditor: React.FC<
  SystemInstructionEditorProps
> = ({
  value,
  onChange,
  onPreview,
  placeholder = "Enter system instructions for the AI model...",
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const characterCount = value.length;
  const maxRecommended = 2000;
  const isOverRecommended = characterCount > maxRecommended;

  const handlePreview = () => {
    setShowPreview(!showPreview);
    if (onPreview && !showPreview) {
      onPreview();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold">System Instructions</label>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs ${
              isOverRecommended ? "text-warning" : "text-foreground-muted"
            }`}
          >
            {characterCount.toLocaleString()} characters
            {isOverRecommended &&
              ` (recommended: ${maxRecommended.toLocaleString()})`}
          </span>
          {onPreview && (
            <button
              type="button"
              onClick={handlePreview}
              className="text-xs btn-outline px-2 py-1 rounded flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              {showPreview ? "Edit" : "Preview"}
            </button>
          )}
        </div>
      </div>

      {showPreview ? (
        <div className="border border-muted rounded-md p-3 bg-accent/30 min-h-[200px] max-h-[400px] overflow-y-auto">
          <div className="text-xs whitespace-pre-wrap">
            {value || "No instructions provided"}
          </div>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-base text-xs min-h-[200px] max-h-[400px] resize-y font-mono"
          spellCheck={false}
        />
      )}

      {isOverRecommended && (
        <div className="flex items-start gap-2 p-2 bg-warning/10 border border-warning/30 rounded text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-warning">
            Long system instructions may impact response quality and increase
            costs. Consider being more concise.
          </p>
        </div>
      )}

      <p className="text-xs text-foreground-muted">
        System instructions guide the AI's behavior and response style. Be
        specific about tone, format, and constraints.
      </p>
    </div>
  );
};
