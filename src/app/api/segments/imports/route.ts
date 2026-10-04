import { NextResponse } from "next/server";
import { getResend } from "@/lib/resend";

// GET /api/segments/imports?id=…: how far along a CSV import is.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[\w-]{1,100}$/.test(id))
    return NextResponse.json({ error: "Missing or invalid import id." }, { status: 400 });

  let resend;
  try {
    resend = getResend();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
  const { data, error } = await resend.contacts.imports.get(id);
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Import not found." }, { status: 502 });
  return NextResponse.json({ status: data.status, counts: data.counts });
}
