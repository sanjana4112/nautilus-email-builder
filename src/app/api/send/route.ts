import { NextResponse } from "next/server";
import { renderEmailHtml, type EmailData } from "@/email/render";
import { resend } from "@/lib/resend";

// One address only: no spaces, commas, or second "@".
const SINGLE_EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

// Light shape check only: confirms this looks like Puck data before rendering.
function isEmailData(value: unknown): value is EmailData {
  if (typeof value !== "object" || value === null) return false;
  const { content, root } = value as Record<string, unknown>;
  return Array.isArray(content) && typeof root === "object" && root !== null;
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: Request) {
  let body: { to?: unknown; data?: unknown };
  try {
    body = (await request.json()) ?? {}; // `?? {}` covers a body of just `null`
  } catch {
    return badRequest("Request body must be JSON.");
  }

  const { to, data } = body;
  if (typeof to !== "string" || !SINGLE_EMAIL.test(to.trim())) {
    return badRequest("Enter one valid email address.");
  }
  if (!isEmailData(data)) return badRequest("Request body is not a valid email design.");

  const subject = data.root.props?.subject?.trim();
  if (!subject) return badRequest("Add a subject first.");
  if (data.content.length === 0) return badRequest("Add at least one block before sending.");

  const { data: sent, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: to.trim(),
    subject,
    html: await renderEmailHtml(data),
  });

  if (error) {
    // 502: our server is fine, but the email service refused or failed.
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  return NextResponse.json({ id: sent.id });
}
