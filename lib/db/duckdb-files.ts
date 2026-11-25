"use client";

import * as duckdb from "@duckdb/duckdb-wasm";
import { getConnection, getDuckDB } from "./duckdb";

export type SupportedFormat = "csv" | "parquet" | "json";

function detectFormat(filename: string): SupportedFormat {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "tsv") return "csv";
  if (ext === "parquet") return "parquet";
  if (ext === "json" || ext === "ndjson" || ext === "jsonl") return "json";
  throw new Error(`Unsupported file extension: .${ext}`);
}

/**
 * Sanitizes a filename into a safe SQL table identifier (e.g. "my-sales 2026.csv" -> "my_sales_2026").
 * Why: Prevents SQL injection or syntax errors from spaces/hyphens in user filenames.
 */
function toSafeTableName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
  return /^[0-9]/.test(cleaned) ? `t_${cleaned}` : cleaned || "dataset";
}

/**
 * Register a user-uploaded browser File (CSV, Parquet, or JSON) and expose it as a table/view.
 */
export async function loadBrowserFile(file: File): Promise<{
  tableName: string;
  virtualPath: string;
  format: SupportedFormat;
}> {
  const db = await getDuckDB();
  const conn = await getConnection();
  const format = detectFormat(file.name);
  const virtualPath = file.name;
  const tableName = toSafeTableName(file.name);

  // Drop any previous registration with the same virtual name to free handles/RAM
  await db.dropFile(virtualPath).catch(() => {});

  // BROWSER_FILEREADER lets DuckDB read chunks lazily instead of loading the entire File into RAM
  await db.registerFileHandle(
    virtualPath,
    file,
    duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
    true, // directIO: avoid unnecessary buffering
  );

  // Escape single quotes in the virtual filename for SQL safety
  const sqlPath = virtualPath.replace(/'/g, "''");

  if (format === "parquet") {
    // Parquet is already columnar: a VIEW avoids duplicating data in memory while keeping fast scans
    await conn.query(
      `CREATE OR REPLACE VIEW "${tableName}" AS SELECT * FROM read_parquet('${sqlPath}')`,
    );
  } else if (format === "csv") {
    // Materialize CSV into an in-memory DuckDB table so subsequent queries don't re-parse text.
    // auto_detect=true infers delimiters, headers, and column types automatically.
    await conn.query(
      `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv('${sqlPath}', auto_detect = true)`,
    );
  } else {
    // read_json_auto handles standard JSON arrays, newline-delimited JSON (NDJSON), and nested structs.
    // Note: DuckDB-Wasm autoloads the `json` extension on first use.
    await conn.query(
      `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_json_auto('${sqlPath}')`,
    );
  }

  return { tableName, virtualPath, format };
}

/**
 * Register a static file from Next.js `public/` (e.g. "/data/events.parquet") or a remote HTTPS URL.
 */
export async function loadRemoteOrPublicFile(
  urlOrPublicPath: string,
  tableName: string,
): Promise<void> {
  const db = await getDuckDB();
  const conn = await getConnection();
  const format = detectFormat(urlOrPublicPath);

  // Always pass an absolute URL to the Web Worker so relative paths like "/data/foo.parquet" resolve reliably
  const absoluteUrl = new URL(urlOrPublicPath, window.location.origin).href;
  const virtualPath = `${tableName}.${format}`;

  await db.dropFile(virtualPath).catch(() => {});
  await db.registerFileURL(
    virtualPath,
    absoluteUrl,
    duckdb.DuckDBDataProtocol.HTTP,
    false,
  );

  const sqlPath = virtualPath.replace(/'/g, "''");

  if (format === "parquet") {
    await conn.query(
      `CREATE OR REPLACE VIEW "${tableName}" AS SELECT * FROM read_parquet('${sqlPath}')`,
    );
  } else if (format === "csv") {
    await conn.query(
      `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv('${sqlPath}', auto_detect = true)`,
    );
  } else {
    await conn.query(
      `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_json_auto('${sqlPath}')`,
    );
  }
}
