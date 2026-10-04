import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Fake Vercel Blob so tests never touch real storage.
const handleUpload = vi.fn();
vi.mock("@vercel/blob/client", () => ({ handleUpload }));

const { POST } = await import("./route");

function post(body: unknown) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return POST(new Request("http://test/api/upload", { method: "POST", body: raw }));
}

const tokenRequest = { type: "blob.generate-client-token", payload: { pathname: "banner.jpg", clientPayload: null } };

describe("POST /api/upload", () => {
  beforeEach(() => {
    handleUpload.mockReset();
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("issues an upload pass limited to inbox-safe images up to 10 MB", async () => {
    handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => ({
      type: "blob.generate-client-token",
      clientToken: "pass",
      options: await onBeforeGenerateToken("banner.jpg", null, false),
    }));

    const response = await post(tokenRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.options).toEqual({
      allowedContentTypes: ["image/jpeg", "image/png", "image/gif"],
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: true,
    });
  });

  it("explains a missing storage token instead of crashing", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const response = await post(tokenRequest);
    expect(response.status).toBe(500);
    expect((await response.json()).error).toContain("BLOB_READ_WRITE_TOKEN");
    expect(handleUpload).not.toHaveBeenCalled();
  });

  it("rejects a body that isn't JSON", async () => {
    const response = await post("hello");
    expect(response.status).toBe(400);
    expect(handleUpload).not.toHaveBeenCalled();
  });

  it("passes on Vercel Blob's refusal, e.g. a disallowed file type", async () => {
    handleUpload.mockRejectedValue(new Error("Content type mismatch"));
    const response = await post(tokenRequest);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Content type mismatch" });
  });
});
