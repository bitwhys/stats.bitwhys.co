"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "@/components/Table";
import { queryRows } from "@/lib/db/duckdb";
import { loadBrowserFile } from "@/lib/db/duckdb-files";

export function DataExplorer() {
  // declare state
  const [tableName, setTableName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState<string>(
    "Drop a CSV, Parquet, or JSON file to start.",
  );
  const [error, setError] = useState<string | null>(null);

  // define file upload handler
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

  // extract column names for header
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
        <TableRoot className="overflow-x-auto">
          <Table>
            <TableHead className="bg-surface-muted">
              <TableRow>
                {columns.map((col) => (
                  <TableHeaderCell
                    key={col}
                    className="px-3 py-2 font-semibold"
                  >
                    {col}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={idx} className="even:bg-surface-faint">
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className="px-3 py-1.5 whitespace-nowrap"
                    >
                      {String(row[col] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableRoot>
      )}
    </div>
  );
}
