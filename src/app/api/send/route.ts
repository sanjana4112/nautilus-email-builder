import { NextResponse } from "next/server";
import { renderEmailHtml } from "@/email/render";
import { deliver, readSendRequest } from "@/lib/send";

// POST /api/send: sends now, to one address ({ data, to }) or a list
// ({ data, segmentId }).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const checked = readSendRequest(body);
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

  const { data, target, subject } = checked.value;
  const html = await renderEmailHtml(data, { forList: target.kind === "list" });
  const result = await deliver(html, subject, target);

  // 502: our server is fine, but the email service refused or failed.
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ id: result.id });
}
