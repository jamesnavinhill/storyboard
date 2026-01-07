import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createFileUploadSlice, type FileUploadSlice } from "./fileUploadStore";

// Combined generation store interface
export interface GenerationStore extends FileUploadSlice {}

// Create the generation store with file upload slice
export const useGenerationStore = create<GenerationStore>()(
  devtools(
    (set, get, ...rest) => ({
      // Compose file upload slice
      ...createFileUploadSlice(set, get, ...rest),
    }),
    { name: "GenerationStore" }
  )
);
