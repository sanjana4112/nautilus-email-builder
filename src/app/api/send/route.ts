import { NextResponse } from "next/server";
import { renderEmailHtml, type EmailData } from "@/email/render";
import { resend } from "@/lib/resend";

// Fixed for this first slice; the send panel will let users type these.
const SUBJECT = "Test email from the builder";
const TO = process.env.RESEND_TO_EMAIL ?? "";

// Light shape check only: confirms this looks like Puck data before rendering.
function isEmailData(value: unknown): value is EmailData {
  if (typeof value !== "object" || value === null) return false;
  const { content, root } = value as Record<string, unknown>;
  return Array.isArray(content) && typeof root === "object" && root !== null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  if (!isEmailData(body)) {
    return NextResponse.json({ error: "Request body is not a valid email design." }, { status: 400 });
  }
  if (body.content.length === 0) {
    return NextResponse.json({ error: "Add at least one block before sending." }, { status: 400 });
  }

  const html = await renderEmailHtml(body);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: TO,
    subject: SUBJECT,
    html,
  });

  if (error) {
    // 502: our server is fine, but the email service refused or failed.
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  return NextResponse.json({ id: data.id });
}
