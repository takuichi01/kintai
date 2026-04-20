import { NextRequest, NextResponse } from "next/server";
import { getWorkReportBundle, saveWorkReportBundle } from "@/lib/db";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(getWorkReportBundle());
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const result = saveWorkReportBundle({
    workReports: body.workReports ?? [],
    breakReports: body.breakReports ?? [],
    todos: body.todos ?? [],
  });

  return NextResponse.json({ success: true, ...result });
}
