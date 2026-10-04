import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake Resend so tests never send real email or need an API key.
const send = vi.fn();
const createBroadcast = vi.fn();
vi.mock("@/lib/resend", () => ({ resend: { emails: { send }, broadcasts: { create: createBroadcast } } }));

const { POST } = await import("./route");

const heading = { type: "Heading", props: { id: "h1", text: "Hi", textStyle: "heading1" } };
const validData = { content: [heading], root: { props: { title: "Draft", subject: "Hello" } } };

function post(body: unknown) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return POST(new Request("http://test/api/send", { method: "POST", body: raw }));
}

async function expectBadRequest(body: unknown, error: string) {
  const response = await post(body);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error });
  expect(send).not.toHaveBeenCalled();
}

describe("POST /api/send", () => {
  beforeEach(() => {
    send.mockReset();
    createBroadcast.mockReset();
  });

  it("sends the rendered email to the recipient with the subject", async () => {
    send.mockResolvedValue({ data: { id: "email_123" }, error: null });

    const response = await post({ to: " maria@example.com ", data: validData });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "email_123" });
    expect(send).toHaveBeenCalledOnce();
    const sent = send.mock.calls[0][0];
    expect(sent.to).toBe("maria@example.com");
    expect(sent.subject).toBe("Hello");
    expect(sent.html).toContain("Hi");
  });

  it("returns 502 with Resend's message when Resend fails", async () => {
    send.mockResolvedValue({ data: null, error: { message: "Invalid API key" } });

    const response = await post({ to: "maria@example.com", data: validData });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Invalid API key" });
  });

  it("rejects a body that isn't JSON", () => expectBadRequest("hello", "Request body must be JSON."));

  it("rejects a null body", () => expectBadRequest(null, "Enter one valid email address."));

  it("rejects a missing recipient", () => expectBadRequest({ data: validData }, "Enter one valid email address."));

  it("rejects an invalid email", () =>
    expectBadRequest({ to: "banana", data: validData }, "Enter one valid email address."));

  it("rejects more than one email", () =>
    expectBadRequest({ to: "a@x.com, b@x.com", data: validData }, "Enter one valid email address."));

  it("rejects a recipient that isn't text", () =>
    expectBadRequest({ to: 42, data: validData }, "Enter one valid email address."));

  it("rejects a missing design", () =>
    expectBadRequest({ to: "a@x.com" }, "Request body is not a valid email design."));

  it("rejects a blank subject", () =>
    expectBadRequest(
      { to: "a@x.com", data: { ...validData, root: { props: { title: "Draft", subject: "   " } } } },
      "Add a subject first.",
    ));

  it("rejects an email with no blocks", () =>
    expectBadRequest({ to: "a@x.com", data: { ...validData, content: [] } }, "Add at least one block before sending."));

  describe("to a list", () => {
    it("sends a Broadcast with each reader's unsubscribe link and an added footer", async () => {
      createBroadcast.mockResolvedValue({ data: { id: "bc_1" }, error: null });

      const response = await post({ segmentId: "seg_123", data: validData });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: "bc_1" });
      expect(send).not.toHaveBeenCalled();
      const broadcast = createBroadcast.mock.calls[0][0];
      expect(broadcast).toMatchObject({ segmentId: "seg_123", subject: "Hello", send: true });
      expect(broadcast.html).toContain("{{{RESEND_UNSUBSCRIBE_URL}}}");
    });

    it("returns 502 with Resend's message when the Broadcast fails", async () => {
      createBroadcast.mockResolvedValue({ data: null, error: { message: "Domain not verified" } });
      const response = await post({ segmentId: "seg_123", data: validData });
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: "Domain not verified" });
    });

    it("rejects a request with both an address and a list", async () => {
      const response = await post({ to: "a@x.com", segmentId: "seg_123", data: validData });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Choose one address or one list, not both." });
      expect(createBroadcast).not.toHaveBeenCalled();
    });

    it("rejects a list id that doesn't look right", async () => {
      const response = await post({ segmentId: "../../etc", data: validData });
      expect(response.status).toBe(400);
      expect(createBroadcast).not.toHaveBeenCalled();
    });
  });
});
