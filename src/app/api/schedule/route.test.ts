import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake Temporal so tests never need a running server.
const start = vi.fn();
const list = vi.fn();
const cancel = vi.fn();
const getHandle = vi.fn(() => ({ cancel }));
const getTemporalClient = vi.fn();
vi.mock("@/temporal/client", () => ({ getTemporalClient }));
// Scheduling never sends directly; Resend is only reached from the worker.
vi.mock("@/lib/resend", () => ({ getResend: () => ({}) }));

const { POST, GET, DELETE } = await import("./route");

const heading = { type: "Heading", props: { id: "h1", text: "Hi", textStyle: "heading1" } };
const validData = { content: [heading], root: { props: { title: "", subject: "Dinner" } } };
const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

function post(body: unknown) {
  return POST(new Request("http://test/api/schedule", { method: "POST", body: JSON.stringify(body) }));
}

beforeEach(() => {
  for (const fn of [start, list, cancel, getHandle]) fn.mockClear();
  start.mockResolvedValue({ workflowId: "send-1" });
  getTemporalClient.mockReset().mockResolvedValue({ workflow: { start, list, getHandle } });
});

describe("POST /api/schedule", () => {
  it("starts a workflow with the email built now, plus a memo for the Scheduled tab", async () => {
    const sendAt = inAnHour();
    const response = await post({ to: "maria@x.com", data: validData, sendAt });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "send-1", subject: "Dinner", recipient: "maria@x.com", sendAt });
    const [type, options] = start.mock.calls[0];
    expect(type).toBe("scheduledSend");
    expect(options.taskQueue).toBe("email-sends");
    expect(options.workflowId).toMatch(/^send-[0-9a-f-]{36}$/);
    expect(options.args[0]).toMatchObject({ subject: "Dinner", target: { kind: "one", to: "maria@x.com" }, sendAt });
    expect(options.args[0].html).toContain("Hi");
  });

  it("builds list sends with each reader's unsubscribe link", async () => {
    await post({ segmentId: "seg_1", listName: "VIPs", data: validData, sendAt: inAnHour() });
    const { args, memo } = start.mock.calls[0][1];
    expect(args[0].html).toContain("{{{RESEND_UNSUBSCRIBE_URL}}}");
    expect(memo.recipient).toBe("VIPs");
  });

  it.each([
    [undefined, "Pick a date and time to send."],
    ["tomorrow-ish", "Pick a date and time to send."],
    [new Date(Date.now() - 1000).toISOString(), "Pick a time at least a minute from now."],
    [new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString(), "Pick a time within the next year."],
  ])("rejects send time %j", async (sendAt, error) => {
    const response = await post({ to: "maria@x.com", data: validData, sendAt });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error });
    expect(start).not.toHaveBeenCalled();
  });

  it("checks the email the same way as sending now", async () => {
    const response = await post({ to: "banana", data: validData, sendAt: inAnHour() });
    expect(await response.json()).toEqual({ error: "Enter one valid email address." });
  });

  it("explains how to start scheduling when Temporal isn't running", async () => {
    getTemporalClient.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const response = await post({ to: "maria@x.com", data: validData, sendAt: inAnHour() });
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("temporal server start-dev");
  });
});

describe("POST /api/schedule errors", () => {
  const body = () => ({ to: "maria@x.com", data: validData, sendAt: inAnHour() });

  it("says Temporal isn't running only when it can't be reached", async () => {
    start.mockRejectedValueOnce(Object.assign(new Error("14 UNAVAILABLE: No connection established"), { code: 14 }));
    expect((await post(body())).status).toBe(503);
  });

  it("passes on other failures with their real reason", async () => {
    start.mockRejectedValueOnce(new Error("Blob data size exceeds limit"));
    const response = await post(body());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Couldn't schedule: Blob data size exceeds limit" });
  });
});

describe("GET /api/schedule", () => {
  it("lists upcoming sends, soonest first", async () => {
    list.mockReturnValue(
      (async function* () {
        yield { workflowId: "send-b", memo: { subject: "B", recipient: "VIPs", sendAt: "2030-02-01T00:00:00.000Z" } };
        yield {
          workflowId: "send-a",
          memo: { subject: "A", recipient: "a@x.com", sendAt: "2030-01-01T00:00:00.000Z" },
        };
      })(),
    );
    const response = await GET();
    expect((await response.json()).scheduled.map((s: { id: string }) => s.id)).toEqual(["send-a", "send-b"]);
    expect(list.mock.calls[0][0].query).toContain('ExecutionStatus = "Running"');
  });
});

describe("DELETE /api/schedule", () => {
  const id = "send-0b7c7f9e-2f4b-4d4e-9a35-1c2d3e4f5a6b";
  const del = (query: string) => DELETE(new Request(`http://test/api/schedule${query}`, { method: "DELETE" }));

  it("cancels a scheduled send", async () => {
    const response = await del(`?id=${id}`);
    expect(await response.json()).toEqual({ cancelled: id });
    expect(getHandle).toHaveBeenCalledWith(id);
    expect(cancel).toHaveBeenCalled();
  });

  it("rejects a missing or odd-looking id", async () => {
    for (const query of ["", "?id=other-workflow", "?id=send-../../x"]) {
      expect((await del(query)).status).toBe(400);
    }
    expect(cancel).not.toHaveBeenCalled();
  });

  it("says so when the send already went out", async () => {
    cancel.mockRejectedValueOnce(new Error("workflow execution already completed"));
    const response = await del(`?id=${id}`);
    expect(response.status).toBe(409);
  });
});
