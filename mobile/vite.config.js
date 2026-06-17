import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url)); // mobile/
const root = path.resolve(dir, "..");                     // repo root

// The shared desktop modules (components/*.js, lib/*.js) contain JSX in .js
// files (Next.js treats .js as JSX). Vite/esbuild do not by default. For this
// one-shot production single-file build we don't need React Fast Refresh, so we
// skip @vitejs/plugin-react and let esbuild transform JSX everywhere with the
// automatic runtime (no `import React` needed in each file).
export default defineConfig({
  root: dir,
  plugins: [viteSingleFile()],
  resolve: { alias: { "@": root } },
  esbuild: { loader: "jsx", jsx: "automatic", include: /\.(js|jsx)$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { ".js": "jsx" }, jsx: "automatic" } },
  build: {
    outDir: path.resolve(dir, "dist"),
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 5000,
  },
});
