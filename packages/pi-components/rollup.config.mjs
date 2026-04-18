import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

/**
 * Rollup config for building PI web components as a standalone browser bundle.
 * Outputs pi-components.js into browser/ so consumer plugins can copy it
 * alongside the vendored sdpi-components.js into their own ui/ folder.
 */
export default {
  input: "src/components/index.ts",
  output: {
    file: "browser/pi-components.js",
    format: "iife",
    name: "IRaceDeckPI",
    sourcemap: false,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.pi.json",
    }),
    terser({
      format: {
        comments: false,
      },
    }),
  ],
};
