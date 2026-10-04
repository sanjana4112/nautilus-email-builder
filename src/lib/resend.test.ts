import { afterEach, describe, expect, it, vi } from "vitest";

describe("getResend", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("loads without a key, and only complains when used", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { getResend } = await import("./resend"); // importing must not throw (builds rely on this)
    expect(() => getResend()).toThrow("RESEND_API_KEY is not set.");
  });

  it("makes the client once and reuses it", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const { getResend } = await import("./resend");
    expect(getResend()).toBe(getResend());
  });
});

describe("deliver without a key", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports the missing key instead of crashing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { deliver } = await import("./send");
    await expect(deliver("<p>Hi</p>", "Hi", { kind: "one", to: "a@x.com" })).resolves.toEqual({
      error: "RESEND_API_KEY is not set.",
    });
  });
});
