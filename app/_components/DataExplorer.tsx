"use client";

import { useState } from "react";
import { queryRows } from "@/lib/db/duckdb";
import { loadBrowserFile } from "@/lib/db/duckdb-files";

export function DataExplorer() {
  const [tableName, setTableName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState<string>(
    "Drop a CSV, Parquet, or JSON file to start.",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStatus(`Loading ${file.name} into DuckDB...`);

    try {
      const { tableName: loadedTable } = await loadBrowserFile(file);
      setTableName(loadedTable);

      // Query the first 25 rows — DuckDB runs this inside the Web Worker
      const preview = await queryRows(
        `SELECT * FROM "${loadedTable}" LIMIT 25`,
      );
      const [{ total }] = await queryRows<{ total: number }>(
        `SELECT COUNT(*) AS total FROM "${loadedTable}"`,
      );

      setRows(preview);
      setStatus(
        `Loaded "${loadedTable}" (${total.toLocaleString()} rows). Showing first ${preview.length}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("Failed to load file.");
    }
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-4 p-6">
      <input
        type="file"
        accept=".csv,.tsv,.parquet,.json,.ndjson,.jsonl"
        onChange={handleFileChange}
        className="block text-sm"
      />

      <p className="text-sm text-ink-detail">{status}</p>
      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      {tableName && rows.length > 0 && (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-left text-base">
            <thead className="bg-surface-muted">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
