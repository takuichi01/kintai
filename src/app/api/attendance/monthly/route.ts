import { NextRequest, NextResponse } from "next/server";
import { getMonthlyAttendance } from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const year = Number(request.nextUrl.searchParams.get("year"));
  const month = Number(request.nextUrl.searchParams.get("month"));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "year/month が不正です" }, { status: 400 });
  }

  return NextResponse.json({ records: getMonthlyAttendance(year, month) });
}
