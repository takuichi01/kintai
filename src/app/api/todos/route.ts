import { NextRequest, NextResponse } from "next/server";
import {
  getLatestTodosBeforeToday,
  getWorkReportBundle,
  saveTodosForToday,
} from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");

  if (scope === "previous") {
    return NextResponse.json({ todos: getLatestTodosBeforeToday() });
  }

  return NextResponse.json({ todos: getWorkReportBundle().todos });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const result = saveTodosForToday(body.todos ?? []);
  return NextResponse.json({ success: true, ...result });
}
