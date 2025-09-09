import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  // exclude: ["src/database/schema.sql", "src/database/test.sql"],
  clean: true,
  format: ["cjs"],
  ...options,
}));