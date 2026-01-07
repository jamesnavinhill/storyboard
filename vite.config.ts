import path from 'path';
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
// Use async config to conditionally import visualizer only when ANALYZE is set
export default defineConfig(async () => {
  const plugins = [react()];
  if (process.env.ANALYZE) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        sourcemap: false,
      }) as any
    );
  }

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return undefined;
            // Only group known heavy vendors; let Rollup handle the rest
            if (
              id.includes("@tiptap") ||
              id.includes("lowlight") ||
              id.includes("prosemirror")
            ) {
              return "tiptap";
            }
            if (id.includes("highlight.js")) {
              return "highlight.js";
            }
            if (id.includes("@dnd-kit")) {
              return "dnd";
            }
            if (id.includes("lucide-react")) {
              return "icons";
            }
            if (id.includes("react")) {
              return "react-vendor";
            }
            if (id.includes("zustand")) {
              return "state";
            }
            if (id.includes("jszip")) {
              return "zip";
            }
            if (id.includes("@google/genai")) {
              return "ai";
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 1500,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["test/setup.ts"],
      css: false,
    },
  };
});
