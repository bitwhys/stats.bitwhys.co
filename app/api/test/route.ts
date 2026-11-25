import duckdb from "@duckdb/node-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  console.log(searchParams);
  console.log(duckdb.version());
  return NextResponse.json({ message: `[${Date.now()}]: Hello world!` });
}
