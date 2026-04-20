import { NextRequest, NextResponse } from "next/server";
import {
  getLatestTemplate,
  getLatestTodosBeforeToday,
  getWorkReportBundle,
  setCheckin,
  setCheckout,
} from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  if (action === "checkin-context") {
    return NextResponse.json({
      template: getLatestTemplate("checkin"),
      previousTodos: getLatestTodosBeforeToday(),
    });
  }

  if (action === "checkout-context") {
    const bundle = getWorkReportBundle();
    return NextResponse.json({
      template: getLatestTemplate("checkout"),
      workReports: bundle.workReports,
    });
  }

  if (action === "today") {
    return NextResponse.json(getWorkReportBundle());
  }

  return NextResponse.json({ error: "unsupported action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.action === "checkin") {
    return NextResponse.json({ attendance: setCheckin() });
  }

  if (body.action === "checkout") {
    return NextResponse.json({ attendance: setCheckout() });
  }

  return NextResponse.json({ error: "unsupported action" }, { status: 400 });
}
