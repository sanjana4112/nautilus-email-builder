import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

// GET /api/segments/imports?id=…: how far along a CSV import is.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[\w-]{1,100}$/.test(id))
    return NextResponse.json({ error: "Missing or invalid import id." }, { status: 400 });

  const { data, error } = await resend.contacts.imports.get(id);
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Import not found." }, { status: 502 });
  return NextResponse.json({ status: data.status, counts: data.counts });
}
