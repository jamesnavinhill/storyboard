import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createDocumentSlice, type DocumentSlice } from "./documentStore";

// Combined storyboard store interface
export interface StoryboardStore extends DocumentSlice {}

// Create the storyboard store with document slice
export const useStoryboardStore = create<StoryboardStore>()(
  devtools(
    (set, get, ...rest) => ({
      // Compose document slice
      ...createDocumentSlice(set, get, ...rest),
    }),
    { name: "StoryboardStore" }
  )
);
