import { describe, expect, it } from "vitest";
import { renderEmailHtml, type EmailData } from "./render";
import { defaultStyle, type EmailStyle } from "./theme";

function email(content: EmailData["content"], style?: EmailStyle): EmailData {
  return { content, root: { props: { title: "Test", subject: "Test", style } } };
}

const heading = (text: string, textStyle: "title" | "heading1" | "heading2" | "subtitle" = "heading1") =>
  ({ type: "Heading", props: { id: text, text, textStyle } }) as const;

describe("renderEmailHtml", () => {
  it("renders a heading with its text style from the Style tab", async () => {
    const style: EmailStyle = {
      ...defaultStyle,
      text: {
        ...defaultStyle.text,
        heading1: { font: "Verdana", size: 30, bold: true, italic: true, underline: false, color: "#0a7a3a" },
      },
    };
    const html = await renderEmailHtml(email([heading("Hello Maria")], style));

    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("Hello Maria");
    expect(html).toContain("color:#0a7a3a");
    expect(html).toContain("font-size:30px");
    expect(html).toContain("font-style:italic");
    expect(html).toContain("Verdana");
  });

  it("uses the right tag for each heading style", async () => {
    const html = await renderEmailHtml(email([heading("T", "title"), heading("H2", "heading2"), heading("S", "subtitle")]));
    expect(html).toMatch(/<h1[^>]*>T<\/h1>/);
    expect(html).toMatch(/<h2[^>]*>H2<\/h2>/);
    expect(html).toMatch(/<h3[^>]*>S<\/h3>/);
  });

  it("applies the background color and content width", async () => {
    const html = await renderEmailHtml(email([heading("Hi")], { ...defaultStyle, background: "#f4f4f5", contentWidth: 640 }));
    expect(html).toContain("background-color:#f4f4f5");
    expect(html).toContain("max-width:640px");
  });

  it("uses default styles when none are saved", async () => {
    const html = await renderEmailHtml(email([heading("Hi")]));
    expect(html).toContain("max-width:600px");
    expect(html).toContain("font-size:28px");
  });

  it("renders an empty email without crashing", async () => {
    const html = await renderEmailHtml(email([]));
    expect(html).toContain("<body");
  });

  it("skips block types it doesn't know instead of crashing", async () => {
    const unknownBlock = { type: "Banana", props: { id: "b1" } } as unknown as EmailData["content"][number];
    const html = await renderEmailHtml(email([unknownBlock, heading("Still here")]));

    expect(html).toContain("Still here");
    expect(html).not.toContain("Banana");
  });
});
