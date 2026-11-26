"use client";

import * as duckdb from "@duckdb/duckdb-wasm";

/**
 * Cache the *Promise* not just the resolved instance.
 * Why: In development, React 19 Strict Mode mounts components twice.
 * Caching the in-flight Promise guarantees both mounts await the SAME
 * Web Worker instead of spawing two 35MB Wasm instances racing each other
 */
let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
let connPromise: Promise<duckdb.AsyncDuckDBConnection> | null = null;
let queue: Promise<unknown> = Promise.resolve();

// Point DuckDB at the static files we copied into public/duckdb/.
// selectBundle() probes the browser for Wasm exception handling (EH)
// and picks the fastest supported build automatically.
// Note: If you upgrade to a DuckDB-Wasm 2.0 release that ships `duckdb-base.wasm`,
// replace `mvp`/`eh` keys with `base: { mainModule: '/duckdb/duckdb-base.wasm', mainWorker: '/duckdb/duckdb-browser-base.worker.js' }`.
const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: "/duckdb/duckdb-mvp.wasm",
    mainWorker: "/duckdb/duckdb-browser-mvp.worker.js",
  },
  eh: {
    mainModule: "/duckdb/duckdb-eh.wasm",
    mainWorker: "/duckdb/duckdb-browser-eh.worker.js",
  },
};

export function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  // Guard against accidental import/execution during Next.js SSR
  if (typeof window === "undefined") {
    throw new Error("DuckDB-Wasm can only be initialized in the browser.");
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

      // Same-origin worker URL from public/duckdb/ — no Blob wrapper needed (multithreaded usecase)
      const worker = new Worker(bundle.mainWorker!);

      // Use ConsoleLogger(duckdb.LogLevel.WARNING) in production to keep DevTools quiet
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);

      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      // Configure Arrow-to-JS type mapping globally.
      // Why: DuckDB's COUNT(*) and 64-bit ints return JS `BigInt` by default,
      // which crashes JSON.stringify() and React state serialization.
      // Caveat: If you have 64-bit IDs > 2^53 - 1 (e.g., Snowflake IDs),
      // set castBigIntToDouble to false and cast those columns to VARCHAR in SQL.
      await db.open({
        path: ":memory:",
        query: {
          castBigIntToDouble: true,
          castDecimalToDouble: true,
          castTimestampToDate: true,
        },
      });

      return db;
    })().catch((err) => {
      // Reset on failure so a subsequent retry can succeed
      dbPromise = null;
      throw err;
    });
  }

  return dbPromise;
}

export function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!connPromise) {
    connPromise = getDuckDB().then((db) => db.connect());
  }
  return connPromise;
}

export function exclusive<T>(
  fn: (conn: duckdb.AsyncDuckDBConnection) => Promise<T>,
): Promise<T> {
  const next = queue.then(async () => {
    const conn = await getConnection();
    return fn(conn);
  });
  queue = next.catch(() => {});
  return next;
}

export async function queryPrepared<T extends Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean)[] = [],
): Promise<T[]> {
  return exclusive(async (conn) => {
    if (params.length === 0) {
      const table = await conn.query(sql);
      return table.toArray().map((row) => row.toJSON() as T);
    }

    const stmt = await conn.prepare(sql);
    try {
      const table = await stmt.query(...params);
      return table.toArray().map((row) => row.toJSON() as T);
    } finally {
      await stmt.close();
    }
  });
}

/**
 * Runs a SQL query and returns plain JS objects instead of Apache Arrow Proxy rows.
 * Why: Arrow's Table.toArray() returns Proxy objects backed by binary vectors.
 * Calling .toJSON() materializes clean, React-friendly plain objects.
 */
export async function queryRows<
  T extends Record<string, unknown> = Record<string, unknown>,
>(sql: string): Promise<T[]> {
  const conn = await getConnection();
  const arrowTable = await conn.query(sql);
  return arrowTable.toArray().map((row) => row.toJSON() as T);
}
