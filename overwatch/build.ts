import esbuild from "esbuild";
import { globSync } from "glob";

// Mirrors the build in botpress/packages/cli: transpile each source file to CommonJS
// (no bundling), leaving runtime deps as `require(...)`. Type declarations are emitted
// separately by `tsc -p tsconfig.build.json` (the `build:types` script). Test files are
// excluded so they don't ship in `dist`.
const entryPoints = globSync("./src/**/*.ts", { ignore: ["**/*.test.ts"] });

void esbuild.build({
  entryPoints,
  bundle: false,
  platform: "node",
  format: "cjs",
  external: [],
  outdir: "./dist",
  sourcemap: true,
});
