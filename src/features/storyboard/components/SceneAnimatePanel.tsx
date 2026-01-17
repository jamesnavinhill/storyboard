import React from "react";
import { Loader } from "@/components/Loader";

interface SceneAnimatePanelProps {
  onSubmit: (prompt: string) => void;
  onSuggestPrompt: () => Promise<string | null>;
  defaultPrompt: string;
  canSuggestPrompt: boolean;
  isBusy: boolean;
}

export const SceneAnimatePanel: React.FC<SceneAnimatePanelProps> = ({
  onSubmit,
  onSuggestPrompt,
  defaultPrompt,
  canSuggestPrompt,
  isBusy,
}) => {
  const [prompt, setPrompt] = React.useState("");
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }
    const value = prompt.trim() || defaultPrompt;
    onSubmit(value);
  };

  const handleSuggest = async () => {
    if (!canSuggestPrompt || isSuggesting) {
      return;
    }
    setIsSuggesting(true);
    try {
      const suggested = await onSuggestPrompt();
      if (suggested) {
        setPrompt(suggested);
      } else {
        setPrompt(
          "Sorry, couldn't generate a prompt. Please write one manually."
        );
      }
    } catch (error) {
      console.error("Failed to suggest prompt", error);
      setPrompt(
        "Sorry, couldn't generate a prompt. Please write one manually."
      );
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div
      className="overlay-panel h-1/2"
      style={{ backgroundColor: "var(--popover)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full h-full flex gap-4 items-stretch"
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the animation..."
          className="flex-1 min-h-0 h-full overflow-auto hide-scrollbar px-4 py-3 rounded-none text-sm resize-none textarea-panel"
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--text-primary)",
            borderColor: "var(--card-border)",
          }}
          aria-label="Video animation prompt"
        />

        <div className="w-36 flex flex-col gap-3 items-stretch min-h-0 justify-between">
          <button
            type="button"
            onClick={handleSuggest}
            disabled={!canSuggestPrompt || isSuggesting}
            className="btn-base btn-soft-primary px-3 py-1.5 text-sm"
            aria-label="Generate AI prompt for animation"
          >
            {isSuggesting ? <Loader /> : <span>ai prompt</span>}
          </button>

          <button
            type="submit"
            aria-label="Animate"
            disabled={isBusy}
            className="btn-base btn-soft-primary px-3 py-1.5 text-sm"
          >
            <span>generate</span>
          </button>
        </div>
      </form>
    </div>
  );
};
