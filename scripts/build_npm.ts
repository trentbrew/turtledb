// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  test: false,
  shims: {
    // We are building for a browser environment, so we don't want to use the
    // Node.js-specific Deno shims.
    deno: false,
    crypto: true,
    // Shim out Node.js specific modules that are transitively imported
    // by @xenova/transformers
    "onnxruntime-node": true,
    "os": true,
    "path": true,
    "fs": true,
    "http": true,
    "https": true,
    "url": true,
    "util": true,
  },
  package: {
    // package.json properties
    name: "turtledb",
    version: "0.1.0",
    description:
      "Framework-agnostic graph data layer (nodes, edges, CRUD, events) for JS/TS projects.",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/turtledb",
    },
    bugs: {
      url: "https://github.com/turtledb/issues",
    },
    keywords: [
      "graph",
      "data",
      "typescript",
      "framework-agnostic",
      "nodes",
      "edges",
      "event-emitter",
      "crud",
    ],
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
