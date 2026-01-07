import React, { Suspense } from "react";
// Lazy-load the heavy EnhancedSettingsSheet to avoid pulling editor/workflow code on first paint
const EnhancedSettingsSheet = React.lazy(() =>
  import("@/features/settings/components/EnhancedSettingsSheet").then((m) => ({
    default: m.EnhancedSettingsSheet,
  }))
);
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import type { AppShellState } from "../hooks/useAppShellState";

interface SettingsSheetProps {
  appState: AppShellState;
  theme: string;
  onToggleTheme: () => void;
  onApplySettingsChange: (next: Record<string, unknown>) => void;
}

/**
 * Settings sheet component extracted from AppShell
 * Displays a 3/4 width sheet with tabbed settings interface
 * Now uses EnhancedSettingsSheet which includes workflow and template management
 */
export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  appState,
  theme,
  onToggleTheme,
  onApplySettingsChange,
}) => {
  const handleSettingsChange = (partial: Record<string, unknown>) => {
    console.log("[SettingsSheet] onSettingsChange called with:", partial);
    onApplySettingsChange(partial);
  };

  // Render nothing unless the sheet is open to avoid downloading the chunk
  if (!appState.ui.isSettingsSheetOpen) return null;

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <EnhancedSettingsSheet
          isOpen={appState.ui.isSettingsSheetOpen}
          activeTab={appState.ui.settingsTab}
          settings={appState.project.settings}
          theme={theme}
          aspectRatio={appState.ui.aspectRatio}
          activeTemplateId={null} // TODO: Track active template in app state
          onClose={() => appState.ui.setSettingsSheetOpen(false)}
          onTabChange={(tab) => appState.ui.setSettingsTab(tab)}
          onSettingsChange={handleSettingsChange}
          onToggleTheme={onToggleTheme}
          onAspectRatioChange={appState.ui.setAspectRatio}
          onTemplateSelect={(template) => {
            // TODO: Handle template selection
            console.log("Template selected:", template);
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
};
