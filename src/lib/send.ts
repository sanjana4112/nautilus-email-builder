import type { EmailData } from "@/email/render";
import { isEmail } from "@/lib/contacts-csv";
import { getResend } from "@/lib/resend";

// Shared by "send now" (api/send) and scheduled sends (api/schedule and the
// Temporal worker): who an email goes to, checking a request, and delivering.

export type Target = { kind: "one"; to: string } | { kind: "list"; segmentId: string; listName?: string };

export type SendRequest = { data: EmailData; target: Target; subject: string };

// Light shape check only: confirms this looks like Puck data before rendering.
function isEmailData(value: unknown): value is EmailData {
  if (typeof value !== "object" || value === null) return false;
  const { content, root } = value as Record<string, unknown>;
  return Array.isArray(content) && typeof root === "object" && root !== null;
}

// Checks a request body: { data, to } for one address, or { data, segmentId }
// for a list. Returns the reason in plain words when something is wrong.
export function readSendRequest(body: unknown): { value: SendRequest } | { error: string } {
  const { to, segmentId, listName, data } = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;

  let target: Target;
  if (typeof segmentId === "string" && segmentId.trim() !== "") {
    if (to !== undefined) return { error: "Choose one address or one list, not both." };
    if (!/^[\w-]{1,100}$/.test(segmentId)) return { error: "That list doesn't look right. Pick it again." };
    target = { kind: "list", segmentId, listName: typeof listName === "string" ? listName.slice(0, 100) : undefined };
  } else if (typeof to === "string" && isEmail(to)) {
    target = { kind: "one", to: to.trim() };
  } else {
    return { error: "Enter one valid email address." };
  }

  if (!isEmailData(data)) return { error: "Request body is not a valid email design." };
  const subject = data.root.props?.subject?.trim();
  if (!subject) return { error: "Add a subject first." };
  if (data.content.length === 0) return { error: "Add at least one block before sending." };

  return { value: { data, target, subject } };
}

const from = () => process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

// Sends finished HTML. One address: a normal email. A list: a Resend
// Broadcast, which sends each person their own copy with their own
// unsubscribe link and skips anyone who unsubscribed.
export async function deliver(
  html: string,
  subject: string,
  target: Target,
): Promise<{ id: string } | { error: string }> {
  try {
    return await send(html, subject, target);
  } catch (err) {
    // e.g. RESEND_API_KEY is missing: report it like any other send failure.
    return { error: err instanceof Error ? err.message : "Sending failed." };
  }
}

async function send(html: string, subject: string, target: Target): Promise<{ id: string } | { error: string }> {
  if (target.kind === "one") {
    const { data, error } = await getResend().emails.send({ from: from(), to: target.to, subject, html });
    return error || !data ? { error: error?.message ?? "Sending failed." } : { id: data.id };
  }
  const { data, error } = await getResend().broadcasts.create({
    segmentId: target.segmentId,
    from: from(),
    subject,
    name: subject,
    html,
    send: true,
  });
  return error || !data ? { error: error?.message ?? "Sending failed." } : { id: data.id };
}
