import { describe, expect, it } from "vitest";
import { richTextToEmailHtml } from "./rich-text";

const LINK = "color:#000000;text-decoration:underline";
const clean = (html: unknown) => richTextToEmailHtml(html, LINK);

describe("richTextToEmailHtml", () => {
  it("keeps paragraphs, bold, italic, underline, and line breaks", () => {
    expect(clean("<p>Hello <strong>bold</strong> <em>it</em> <u>under</u><br>next</p><p>Two</p>")).toBe(
      '<p style="margin:0">Hello <strong>bold</strong> <em>it</em> <u>under</u><br>next</p>' +
        '<p style="margin:1em 0 0">Two</p>',
    );
  });

  it("turns safe links into styled email links", () => {
    expect(clean('<p>See the <a href="https://example.com/menu" rel="noopener">menu</a></p>')).toBe(
      `<p style="margin:0">See the <a href="https://example.com/menu" style="${LINK}" target="_blank">menu</a></p>`,
    );
  });

  it("allows mailto links and keeps & in addresses", () => {
    expect(clean('<a href="mailto:hi@example.com">email</a>')).toContain('href="mailto:hi@example.com"');
    expect(clean('<a href="https://x.com/?a=1&amp;b=2">x</a>')).toContain('href="https://x.com/?a=1&amp;b=2"');
  });

  it("drops unsafe links but keeps their words", () => {
    for (const href of ["javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,hi", "vbscript:x", ""]) {
      const out = clean(`<p><a href="${href}">click</a> after</p>`);
      expect(out).toBe('<p style="margin:0">click after</p>');
    }
  });

  it("strips every attribute except a checked href", () => {
    const out = clean(
      '<p onclick="evil()" style="color:red" class="x"><a href="https://a.com" onmouseover="evil()">a</a></p>',
    );
    expect(out).not.toMatch(/onclick|onmouseover|class=|color:red/);
    expect(out).toContain('href="https://a.com"');
  });

  it("removes dangerous tags and their contents", () => {
    const out = clean(
      '<p>ok</p><script>alert(1)</script><style>p{}</style><iframe src="x"></iframe><svg onload="x"><g/></svg>',
    );
    expect(out).toBe('<p style="margin:0">ok</p>');
  });

  it("removes unknown tags but keeps their text", () => {
    expect(clean('<p><span style="x">hi</span> <img src=x onerror=alert(1)> <h1>big</h1></p>')).toBe(
      '<p style="margin:0">hi  big</p>',
    );
  });

  it("escapes stray < and > in text", () => {
    expect(clean("<p>1 < 2 and 3 > 2</p>")).toBe('<p style="margin:0">1 &lt; 2 and 3 &gt; 2</p>');
  });

  it("closes tags the input left open and ignores stray closing tags", () => {
    expect(clean("<p><strong>bold</p></em>")).toBe('<p style="margin:0"><strong>bold</strong></p>');
    expect(clean("<p>text")).toBe('<p style="margin:0">text</p>');
  });

  it("treats older plain text as text, keeping line breaks", () => {
    expect(clean("Line one\nLine two & more")).toBe('<p style="margin:0">Line one<br>Line two &amp; more</p>');
  });

  it("drops HTML comments", () => {
    expect(clean("<p>a<!-- <script>x</script> -->b</p>")).toBe('<p style="margin:0">ab</p>');
  });

  it("returns nothing for empty or missing content", () => {
    expect(clean("")).toBe("");
    expect(clean(undefined)).toBe("");
    expect(clean(42)).toBe("");
  });

  it("can't be tricked by quotes inside the link address", () => {
    const out = clean(`<a href='https://a.com/" onclick="evil()'>x</a>`);
    expect(out).not.toMatch(/onclick="evil/);
    expect(out).toContain("&quot;");
  });
});
