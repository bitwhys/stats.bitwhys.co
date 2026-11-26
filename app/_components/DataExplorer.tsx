"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/Button";
import { Label } from "@/components/Label";
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
import { cx } from "@/lib/utils";

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
    <>
      <div className="sm:flex sm:items-center sm:justify-between sm:space-x-10">
        <div>
          <h3 className="font-semibold">Workspaces</h3>
          <p className="mt-1 text-sm/6 text-ink-detail">
            Overview of all registered workspaces within your organization.
          </p>
        </div>
        <Label
          htmlFor="file-upload"
          className={cx(
            buttonVariants(),
            "mt-4 w-full text-brand-contrast sm:mt-0 sm:w-fit gap-x-2 shadow-sm [--tw-shadow-color:var(--color-black-a5)]",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            fill="currentColor"
            className="size-5 group-data-loading:hidden"
          >
            <path
              d="M216,128a88,88,0,1,1-88-88A88,88,0,0,1,216,128Z"
              opacity="0.2"
            ></path>
            <path d="M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a79.56,79.56,0,0,0-56.13-23.43h-.45A79.52,79.52,0,0,0,69.59,72.71,8,8,0,0,1,58.41,61.27a96,96,0,0,1,135,.79L208,76.69V48a8,8,0,0,1,16,0ZM186.41,183.29a80,80,0,0,1-112.47-.66L59.31,168H88a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V179.31l14.63,14.63A95.43,95.43,0,0,0,130,222.06h.53a95.36,95.36,0,0,0,67.07-27.33,8,8,0,0,0-11.18-11.44Z"></path>
          </svg>
          Upload data
          <input
            type="file"
            id="file-upload"
            accept=".csv,.tsv,.parquet,.json,.ndjson,.jsonl"
            onChange={handleFileChange}
            className="sr-only"
          />
        </Label>
      </div>
      {tableName && rows.length > 0 && (
        <TableRoot className="overflow-x-auto mt-8">
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
    </>
  );
}
