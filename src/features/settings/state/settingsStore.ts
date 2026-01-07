import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createWorkflowSlice, type WorkflowSlice } from "./workflowStore";
import { createTemplateSlice, type TemplateSlice } from "./templateStore";

// Combined settings store interface
export interface SettingsStore extends WorkflowSlice, TemplateSlice {}

// Create the settings store with composed slices
export const useSettingsStore = create<SettingsStore>()(
  devtools(
    (set, get, ...rest) => ({
      // Compose workflow and template slices
      ...createWorkflowSlice(set, get, ...rest),
      ...createTemplateSlice(set, get, ...rest),
    }),
    { name: "SettingsStore" }
  )
);
