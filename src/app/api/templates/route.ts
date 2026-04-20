import { NextRequest, NextResponse } from "next/server";
import {
  deleteTemplate,
  getTemplates,
  saveTemplate,
  type TemplateType,
} from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") as TemplateType | null;
  const templates = getTemplates(type ?? undefined);
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const template = saveTemplate({
    type: body.type,
    title: body.title,
    items: body.items ?? [],
  });

  return NextResponse.json({ template });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const template = saveTemplate({
    id: body.id,
    type: body.type,
    title: body.title,
    items: body.items ?? [],
  });

  return NextResponse.json({ template });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  deleteTemplate(Number(body.id));
  return NextResponse.json({ success: true });
}
