import { defineConfig } from "vitest/config";

export default defineConfig({
  // Reuse tsconfig.json's paths so tests understand the `@/` shortcut for src/.
  resolve: { tsconfigPaths: true },
});
