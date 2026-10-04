import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { renderEmailHtml } from "@/email/render";
import { readSendRequest } from "@/lib/send";
import { getTemporalClient } from "@/temporal/client";
import { TASK_QUEUE, WORKFLOW_TYPE, type ScheduledSendInput, type ScheduledSendMemo } from "@/temporal/shared";

const MIN_LEAD_MS = 60_000; // at least a minute ahead
const MAX_LEAD_MS = 365 * 24 * 60 * 60 * 1000; // at most a year ahead

const notRunning = () =>
  NextResponse.json(
    { error: "Scheduling isn't running. Start Temporal (temporal server start-dev) and the worker (npm run worker)." },
    { status: 503 },
  );

// True when Temporal can't be reached (gRPC status 14 "unavailable", or a
// refused or timed-out connection), as opposed to Temporal answering "no".
function isUnreachable(err: unknown): boolean {
  for (let e = err, depth = 0; e && depth < 5; e = (e as { cause?: unknown }).cause, depth++) {
    const { code, message } = e as { code?: unknown; message?: unknown };
    if (code === 14) return true;
    if (typeof message === "string" && /UNAVAILABLE|ECONNREFUSED|failed to connect|deadline/i.test(message))
      return true;
  }
  return false;
}

// "Scheduling isn't running" only when that's the cause; otherwise the real reason.
function failed(err: unknown, action: string) {
  if (isUnreachable(err)) return notRunning();
  const message = err instanceof Error && err.message ? err.message : "unknown error";
  return NextResponse.json({ error: `Couldn't ${action}: ${message}` }, { status: 502 });
}

async function connect() {
  try {
    return await getTemporalClient();
  } catch {
    return null; // can't reach Temporal at all
  }
}

// POST /api/schedule: { data, to | segmentId, sendAt } schedules a send.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const checked = readSendRequest(body);
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

  const sendAt = new Date(typeof body.sendAt === "string" ? body.sendAt : NaN);
  const lead = sendAt.getTime() - Date.now();
  if (Number.isNaN(lead)) return NextResponse.json({ error: "Pick a date and time to send." }, { status: 400 });
  if (lead < MIN_LEAD_MS)
    return NextResponse.json({ error: "Pick a time at least a minute from now." }, { status: 400 });
  if (lead > MAX_LEAD_MS) return NextResponse.json({ error: "Pick a time within the next year." }, { status: 400 });

  const { data, target, subject } = checked.value;
  // Built now, so later edits to the design don't change what gets sent.
  const html = await renderEmailHtml(data, { forList: target.kind === "list" });
  const input: ScheduledSendInput = { html, subject, target, sendAt: sendAt.toISOString() };
  const memo: ScheduledSendMemo = {
    subject,
    recipient: target.kind === "one" ? target.to : (target.listName ?? "Email list"),
    sendAt: input.sendAt,
  };

  const client = await connect();
  if (!client) return notRunning();
  try {
    const handle = await client.workflow.start(WORKFLOW_TYPE, {
      taskQueue: TASK_QUEUE,
      workflowId: `send-${randomUUID()}`,
      args: [input],
      memo,
    });
    return NextResponse.json({ id: handle.workflowId, ...memo });
  } catch (err) {
    return failed(err, "schedule");
  }
}

// GET /api/schedule: sends that are scheduled and not yet sent or cancelled.
export async function GET() {
  const client = await connect();
  if (!client) return notRunning();
  try {
    const scheduled: (ScheduledSendMemo & { id: string })[] = [];
    const query = `WorkflowType = "${WORKFLOW_TYPE}" AND ExecutionStatus = "Running"`;
    for await (const run of client.workflow.list({ query })) {
      const memo = (run.memo ?? {}) as Partial<ScheduledSendMemo>;
      scheduled.push({
        id: run.workflowId,
        subject: memo.subject ?? "(no subject)",
        recipient: memo.recipient ?? "",
        sendAt: memo.sendAt ?? "",
      });
    }
    scheduled.sort((a, b) => a.sendAt.localeCompare(b.sendAt));
    return NextResponse.json({ scheduled });
  } catch (err) {
    return failed(err, "load scheduled sends");
  }
}

// DELETE /api/schedule?id=…: cancels a scheduled send before it goes out.
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^send-[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Missing or invalid scheduled send id." }, { status: 400 });
  }
  const client = await connect();
  if (!client) return notRunning();
  try {
    await client.workflow.getHandle(id).cancel();
    return NextResponse.json({ cancelled: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/not found|already completed/i.test(message)) {
      return NextResponse.json({ error: "That send already went out or was cancelled." }, { status: 409 });
    }
    return failed(err, "cancel");
  }
}
