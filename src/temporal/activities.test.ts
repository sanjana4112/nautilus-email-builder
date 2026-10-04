import { describe, expect, it, vi } from "vitest";

const deliver = vi.fn();
vi.mock("@/lib/send", () => ({ deliver }));

const { deliverScheduledEmail } = await import("./activities");

const input = { html: "<p>Hi</p>", subject: "Dinner", target: { kind: "one" as const, to: "a@x.com" }, sendAt: "" };

describe("deliverScheduledEmail", () => {
  it("sends with the same delivery code as send now", async () => {
    deliver.mockResolvedValue({ id: "email_1" });
    await expect(deliverScheduledEmail(input)).resolves.toBe("email_1");
    expect(deliver).toHaveBeenCalledWith("<p>Hi</p>", "Dinner", input.target);
  });

  it("fails without retrying when Resend refuses", async () => {
    deliver.mockResolvedValue({ error: "Domain not verified" });
    await expect(deliverScheduledEmail(input)).rejects.toMatchObject({
      message: "Domain not verified",
      nonRetryable: true,
    });
  });
});
