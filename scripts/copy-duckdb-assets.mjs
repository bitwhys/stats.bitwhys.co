import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const srcDir = join(
  process.cwd(),
  "node_modules",
  "@duckdb",
  "duckdb-wasm",
  "dist",
);
const destDir = join(process.cwd(), "public", "duckdb");

mkdirSync(destDir, { recursive: true });

const candidates = [
  "duckdb-eh.wasm",
  "duckdb-browser-eh.worker.js",
  "duckdb-mvp.wasm",
  "duckdb-browser-mvp.worker.js",
  "duckdb-base.wasm",
  "duckdb-browser-base.worker.js",
];

let copied = 0;
for (const file of candidates) {
  const src = join(srcDir, file);
  if (existsSync(src)) {
    copyFileSync(src, join(destDir, file));
    copied++;
  }
}

console.log(`Copied ${copied} DuckDB-WASM assets to public/duckdb/`);
