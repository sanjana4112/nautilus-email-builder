import { describe, expect, it } from "vitest";
import { renderEmailHtml, type EmailData } from "./render";

function email(content: EmailData["content"]): EmailData {
  return { content, root: { props: { title: "Test", subject: "Test" } } };
}

describe("renderEmailHtml", () => {
  it("renders a heading's text and color into email HTML", async () => {
    const html = await renderEmailHtml(
      email([{ type: "Heading", props: { id: "h1", text: "Hello Maria", color: "#0a7a3a" } }]),
    );

    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("Hello Maria");
    expect(html).toContain("color:#0a7a3a");
  });

  it("renders an empty email without crashing", async () => {
    const html = await renderEmailHtml(email([]));
    expect(html).toContain("<body");
  });

  it("skips block types it doesn't know instead of crashing", async () => {
    const unknownBlock = { type: "Banana", props: { id: "b1" } } as unknown as EmailData["content"][number];
    const html = await renderEmailHtml(
      email([unknownBlock, { type: "Heading", props: { id: "h1", text: "Still here", color: "#000" } }]),
    );

    expect(html).toContain("Still here");
    expect(html).not.toContain("Banana");
  });
});
