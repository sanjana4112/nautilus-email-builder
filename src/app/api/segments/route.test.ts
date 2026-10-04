import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake Resend so tests never create real lists or contacts.
const list = vi.fn();
const createSegment = vi.fn();
const createImport = vi.fn();
const getImport = vi.fn();
vi.mock("@/lib/resend", () => ({
  getResend: () => ({
    segments: { list, create: createSegment },
    contacts: { imports: { create: createImport, get: getImport } },
  }),
}));

const { GET, POST } = await import("./route");
const imports = await import("./imports/route");

function upload(name: string | null, csv: string | null) {
  const form = new FormData();
  if (name !== null) form.set("name", name);
  if (csv !== null) form.set("file", new Blob([csv], { type: "text/csv" }), "list.csv");
  return POST(new Request("http://test/api/segments", { method: "POST", body: form }));
}

describe("GET /api/segments", () => {
  it("lists saved lists with just their id and name", async () => {
    list.mockResolvedValue({ data: { data: [{ id: "s1", name: "VIPs", created_at: "x" }] }, error: null });
    const response = await GET();
    expect(await response.json()).toEqual({ segments: [{ id: "s1", name: "VIPs" }] });
  });
});

describe("POST /api/segments", () => {
  beforeEach(() => {
    createSegment.mockReset().mockResolvedValue({ data: { id: "seg_1" }, error: null });
    createImport.mockReset().mockResolvedValue({ data: { id: "imp_1" }, error: null });
  });

  it("creates the list and imports a cleaned CSV into it", async () => {
    const response = await upload("Supper Club", "Email,First Name\nmaria@x.com,=evil()\nbad\nmaria@x.com,Dup");
    expect(await response.json()).toEqual({
      segment: { id: "seg_1", name: "Supper Club" },
      importId: "imp_1",
      contacts: 1,
      skipped: 2,
    });
    expect(createSegment).toHaveBeenCalledWith({ name: "Supper Club" });
    const { file, segments, onConflict } = createImport.mock.calls[0][0];
    expect(segments).toEqual([{ id: "seg_1" }]);
    expect(onConflict).toBe("upsert");
    expect(await file.text()).toBe("email,first_name,last_name\nmaria@x.com,'=evil(),");
  });

  it.each([
    [null, "email\na@x.com", "Give the list a name."],
    ["  ", "email\na@x.com", "Give the list a name."],
    ["x".repeat(101), "email\na@x.com", "Keep the name under 100 characters."],
    ["VIPs", null, "Add a CSV file."],
    ["VIPs", "", "The file is empty."],
    ["VIPs", "name\nMaria", "Couldn't find an email column."],
    ["VIPs", "email\nnot-an-email", "No valid email addresses found."],
  ])("rejects name %j with file %j", async (name, csv, error) => {
    const response = await upload(name, csv);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error });
    expect(createSegment).not.toHaveBeenCalled();
  });

  it("returns 502 with Resend's message when the import fails", async () => {
    createImport.mockResolvedValue({ data: null, error: { message: "Rate limited" } });
    const response = await upload("VIPs", "email\na@x.com");
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Rate limited" });
  });
});

describe("GET /api/segments/imports", () => {
  it("reports an import's progress", async () => {
    getImport.mockResolvedValue({ data: { status: "in_progress", counts: { total: 10, created: 4 } }, error: null });
    const response = await imports.GET(new Request("http://test/api/segments/imports?id=imp_1"));
    expect(await response.json()).toEqual({ status: "in_progress", counts: { total: 10, created: 4 } });
  });

  it("rejects a missing or odd-looking id", async () => {
    for (const url of ["http://test/x", "http://test/x?id=../../etc"]) {
      expect((await imports.GET(new Request(url))).status).toBe(400);
    }
  });
});
