import { describe, expect, it } from "vitest";
import { renderEmailHtml, type EmailData } from "@/email/render";
import { defaultStyle, noOverride } from "@/email/theme";
import { blocksConfig } from ".";
import { safeHref, safeImageSrc } from "./shared";

type Item = EmailData["content"][number];

function html(...content: Item[]) {
  return renderEmailHtml({ content, root: { props: { title: "", subject: "", style: defaultStyle } } });
}

// A block with its default props, plus any overrides.
function block<T extends keyof typeof blocksConfig.components>(type: T, props: Record<string, unknown> = {}): Item {
  const defaults = blocksConfig.components[type].defaultProps ?? {};
  return { type, props: { id: `${type}-1`, ...defaults, ...props } } as Item;
}

describe("every block", () => {
  it.each(Object.keys(blocksConfig.components) as (keyof typeof blocksConfig.components)[])(
    "%s renders with its default props",
    async (type) => {
      await expect(html(block(type))).resolves.toContain("<body");
    },
  );
});

describe("Title", () => {
  it("shows the title in the Title text style", async () => {
    const out = await html(block("Title", { title: "Supper Club" }));
    expect(out).toContain("Supper Club");
    expect(out).toContain("font-size:36px");
    expect(out).not.toContain("<img");
  });
});

describe("Navigation", () => {
  const link = (label: string, url: string, extra: Record<string, unknown> = {}) => ({
    label,
    url,
    boxColor: "",
    linkColor: "",
    ...extra,
  });

  it("defaults to Menu, Reservations, Private events, evenly spaced", async () => {
    const out = await html(block("Navigation"));
    for (const label of ["Menu", "Reservations", "Private events"]) expect(out).toContain(label);
    expect((out.match(/width="33.33/g) ?? []).length).toBe(3);
  });

  it("renders safe links and skips unsafe or empty ones", async () => {
    const out = await html(
      block("Navigation", {
        links: [
          link("Shop", "https://example.com/shop"),
          link("Evil", "javascript:alert(1)"),
          link("", "https://example.com/blank"),
        ],
      }),
    );
    expect(out).toContain('href="https://example.com/shop"');
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("Evil");
    expect(out).not.toContain("example.com/blank");
    expect(out).toContain('width="100%"');
  });

  const style = (extra: Record<string, unknown>) => ({
    look: "plain",
    separatorColor: "#000000",
    barColor: "#000000",
    linkSpacing: 8,
    ...extra,
  });

  it("lets one link have its own color and box", async () => {
    const out = await html(
      block("Navigation", {
        style: style({ look: "boxes" }),
        links: [
          link("Menu", "https://example.com/a", { boxColor: "#0a7a3a", linkColor: "#ffffff" }),
          link("Reservations", "https://example.com/b"),
        ],
      }),
    );
    expect(out).toContain("background-color:#0a7a3a");
    expect(out).toContain("color:#ffffff");
    expect(out).toContain("background-color:#f4f4f5");
  });

  it("draws separators between links and a solid bar", async () => {
    const two = [link("A", "https://a.com"), link("B", "https://b.com")];
    const separated = await html(
      block("Navigation", { style: style({ look: "separators", separatorColor: "#ff0000" }), links: two }),
    );
    expect((separated.match(/background-color:#ff0000/g) ?? []).length).toBe(1);
    expect(separated).toContain("height:18px");
    const bar = await html(block("Navigation", { style: style({ look: "bar", barColor: "#123456" }), links: two }));
    expect(bar).toContain("background-color:#123456");
  });

  it("applies link spacing, kept between 0 and 48px", async () => {
    expect(await html(block("Navigation", { style: style({ linkSpacing: 20 }) }))).toContain("padding:0 10px");
    expect(await html(block("Navigation", { style: style({ linkSpacing: 500 }) }))).toContain("padding:0 24px");
  });

  it("spreads links across the width, or groups them in the center", async () => {
    const spread = await html(block("Navigation"));
    expect(spread).toContain("table-layout:fixed");
    const grouped = await html(block("Navigation", { style: style({ arrangement: "grouped", linkSpacing: 40 }) }));
    expect(grouped).not.toContain("table-layout:fixed");
    expect(grouped).not.toMatch(/width="33.33/);
    expect(grouped).toContain("padding:0 20px");
  });

  it("paints the solid bar edge to edge, as the block's background", async () => {
    const out = await html(block("Navigation", { style: style({ look: "bar", barColor: "#123456" }) }));
    // The bar color sits on the outer block table, around the 24px side padding.
    expect(out).toMatch(/background-color:#123456[^>]*>\s*<tbody>\s*<tr>\s*<td style="padding:8px 24px 8px"/);
  });

  it("lets the bar color be removed", async () => {
    const out = await html(block("Navigation", { style: style({ look: "bar", barColor: "" }) }));
    expect(out).not.toContain("background-color:#000000");
  });

  it("renders nothing with no links", async () => {
    expect(await html(block("Navigation", { links: [] }))).not.toContain("<a");
  });
});

describe("text settings in the right tab", () => {
  it("change only that block", async () => {
    const out = await html(
      block("Heading", { text: "Changed", typography: { ...noOverride, color: "#ff0000", italic: "on" } }),
      block("Heading", { text: "Default" }),
    );
    const [changed, plain] = out.split("Default");
    expect(changed).toContain("color:#ff0000");
    expect(changed).toContain("font-style:italic");
    expect(plain ?? "").not.toContain("color:#ff0000");
  });
});

describe("Image", () => {
  it("renders a linked image", async () => {
    const out = await html(
      block("Image", { imageUrl: "https://cdn.example.com/hero.jpg", alt: "Dinner", linkUrl: "https://example.com" }),
    );
    expect(out).toMatch(/<a[^>]*href="https:\/\/example.com"[^>]*>\s*<img[^>]*alt="Dinner"/);
  });

  it("leaves the image out of the email when the URL is missing", async () => {
    const out = await html(block("Image", { imageUrl: "" }));
    expect(out).not.toContain("<img");
    expect(out).not.toContain("Add an https image URL");
  });
});

describe("BodyCopy", () => {
  it("keeps line breaks and uses the chosen text style", async () => {
    const out = await html(block("BodyCopy", { text: "Line one\nLine two", textStyle: "caption" }));
    expect(out).toMatch(/Line one<br\/?>Line two/);
    expect(out).toContain("font-size:12px");
  });
});

describe("BodyCopy rich text", () => {
  it("sends links as underlined links in the paragraph's color", async () => {
    const out = await html(block("BodyCopy", { text: '<p>See the <a href="https://example.com/menu">menu</a>.</p>' }));
    expect(out).toContain('<a href="https://example.com/menu" style="color:#000000;text-decoration:underline"');
    expect(out).toContain(">menu</a>");
  });

  it("strips unsafe links and markup someone slips into the saved data", async () => {
    const out = await html(
      block("BodyCopy", {
        text: '<p><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)><script>bad()</script></p>',
      }),
    );
    expect(out).not.toMatch(/javascript:|onerror|<script|bad\(\)/);
    expect(out).toContain(">x</p>");
  });
});

describe("Quote", () => {
  it("shows the quote, attribution, and accent bar color", async () => {
    const out = await html(block("Quote", { quote: "Amazing", attribution: "Maria", accentColor: "#0a7a3a" }));
    expect(out).toContain("Amazing");
    expect(out).toContain("Maria");
    expect(out).toContain("border-left:4px solid #0a7a3a");
  });

  it("falls back to black for a bad accent color", async () => {
    const out = await html(block("Quote", { accentColor: "red;display:none" }));
    expect(out).toContain("border-left:4px solid #000000");
  });
});

describe("Button", () => {
  it("renders a link with the chosen colors", async () => {
    const out = await html(
      block("Button", {
        label: "RSVP",
        url: "https://example.com/rsvp",
        backgroundColor: "#0a7a3a",
        textColor: "#ffffff",
      }),
    );
    expect(out).toContain('href="https://example.com/rsvp"');
    expect(out).toContain("RSVP");
    expect(out).toContain("background-color:#0a7a3a");
  });

  it("drops an unsafe link but still shows the button", async () => {
    const out = await html(block("Button", { label: "Click", url: "javascript:alert(1)" }));
    expect(out).toContain("Click");
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("<a");
  });
});

describe("SocialLinks", () => {
  it("shows chosen networks with links, skipping missing or unknown ones", async () => {
    const out = await html(
      block("SocialLinks", {
        links: [
          { network: "instagram", url: "https://instagram.com/supperclub" },
          { network: "tiktok", url: "" },
          { network: "myspace", url: "https://myspace.com/x" },
        ],
      }),
    );
    expect(out).toContain('href="https://instagram.com/supperclub"');
    expect(out).toContain("Instagram");
    expect(out).not.toContain("TikTok");
    expect(out).not.toContain("myspace");
  });

  it("renders nothing with no networks", async () => {
    expect(await html(block("SocialLinks", { links: [] }))).not.toContain("<a");
  });
});

describe("removing text colors", () => {
  it("Button text color None uses the Normal text color", async () => {
    const style = {
      ...defaultStyle,
      text: { ...defaultStyle.text, normal: { ...defaultStyle.text.normal, color: "#0a7a3a" } },
    };
    const out = await renderEmailHtml({
      content: [block("Button", { textColor: "" })],
      root: { props: { title: "", subject: "", style } },
    });
    // Match the text color property, not "background-color".
    expect(out).toMatch(/[";]color:#0a7a3a/);
    expect(out).not.toMatch(/[";]color:#ffffff/);
  });

  it("a Style tab text color of None sets no color at all", async () => {
    const style = {
      ...defaultStyle,
      text: { ...defaultStyle.text, heading1: { ...defaultStyle.text.heading1, color: "" } },
    };
    const out = await renderEmailHtml({
      content: [block("Heading", { text: "Plain" })],
      root: { props: { title: "", subject: "", style } },
    });
    expect(out).toMatch(/<h1 style="(?![^"]*\bcolor:)[^"]*">Plain<\/h1>/);
  });
});

describe("removing fill colors", () => {
  it("Button with no color shows just its label", async () => {
    const out = await html(block("Button", { backgroundColor: "" }));
    expect(out).toContain("Get tickets");
    expect(out).not.toContain("background-color:#000000");
  });

  it("Banner strip with no color is transparent", async () => {
    const out = await html(block("Banner", { strip: { color: "", textColor: "#000000", height: 64 } }));
    expect(out).toContain("Reservations open Friday");
    expect(out).not.toContain("background-color:#000000");
  });

  it("a broken fill color still falls back to the default", async () => {
    const out = await html(block("Button", { backgroundColor: "red;display:none" }));
    expect(out).toContain("background-color:#000000");
  });
});

describe("Banner", () => {
  it("defaults to a colored text strip", async () => {
    const out = await html(block("Banner"));
    expect(out).toContain("Reservations open Friday");
    expect(out).toContain("background-color:#000000");
    expect(out).toContain("height:64px");
    expect(out).not.toContain("<img");
  });

  it("links the strip text and keeps its height between 32 and 160px", async () => {
    const out = await html(
      block("Banner", {
        linkUrl: "https://example.com/book",
        strip: { color: "#0a7a3a", textColor: "#ffffff", height: 999 },
      }),
    );
    expect(out).toContain('href="https://example.com/book"');
    expect(out).toContain("background-color:#0a7a3a");
    expect(out).toContain("height:160px");
  });

  it("shows a banner image with its alt text, full width", async () => {
    const out = await html(
      block("Banner", { kind: "image", imageUrl: "https://cdn.example.com/banner.jpg", alt: "Summer supper" }),
    );
    expect(out).toMatch(
      /<img[^>]*alt="Summer supper"[^>]*src="https:\/\/cdn.example.com\/banner.jpg"|<img[^>]*src="https:\/\/cdn.example.com\/banner.jpg"[^>]*alt="Summer supper"/,
    );
    expect(out).toContain("width:100%");
    expect(out).not.toContain("Reservations open Friday");
  });

  it("leaves out an image banner with a missing or unsafe link", async () => {
    for (const imageUrl of ["", "http://cdn.example.com/banner.jpg", "javascript:alert(1)"]) {
      const out = await html(block("Banner", { kind: "image", imageUrl }));
      expect(out).not.toContain("<img");
      expect(out).not.toContain("Add a banner image");
    }
  });
});

describe("Footer and unsubscribe", () => {
  const listHtml = (...content: Item[]) =>
    renderEmailHtml({ content, root: { props: { title: "", subject: "", style: defaultStyle } } }, { forList: true });

  it("shows the note, address, and an unsubscribe link that goes nowhere in a test send", async () => {
    const out = await html(block("Footer", { address: "Supper Club\n12 Grand St" }));
    expect(out).toContain("joined our list");
    expect(out).toMatch(/Supper Club<br\/?>12 Grand St/);
    expect(out).toContain('href="#"');
    expect(out).toContain("Unsubscribe");
    expect(out).not.toContain("works when you send to a list");
  });

  it("uses each reader's own unsubscribe link when sent to a list", async () => {
    const out = await listHtml(block("Footer"));
    expect(out).toContain('href="{{{RESEND_UNSUBSCRIBE_URL}}}"');
  });

  it("adds a footer to list emails that don't have one", async () => {
    const out = await listHtml(block("Heading"));
    expect(out).toContain('href="{{{RESEND_UNSUBSCRIBE_URL}}}"');
  });

  it("doesn't add a second footer, even when the footer sits inside a layout block", async () => {
    const out = await listHtml(block("Section", { content: [block("Footer", { unsubscribeText: "Opt out" })] }));
    expect((out.match(/RESEND_UNSUBSCRIBE_URL/g) ?? []).length).toBe(1);
    expect(out).toContain("Opt out");
  });

  it("doesn't add a footer to a test send to one address", async () => {
    expect(await html(block("Heading"))).not.toContain("Unsubscribe");
  });
});

describe("layout blocks", () => {
  const button = (label: string) => block("Button", { label, url: "https://example.com" });

  it("Section draws its blocks inside a full-width band", async () => {
    const out = await html(
      block("Section", {
        content: [button("Inside")],
        box: { spaceAbove: 0, spaceBelow: 0, spaceSides: 0, background: "#123456" },
      }),
    );
    expect(out).toContain("background-color:#123456");
    expect(out).toContain("Inside");
  });

  it("Container draws a card with fill, border, and rounded corners", async () => {
    const out = await html(
      block("Container", {
        content: [button("Card")],
        card: { fill: "#fafafa", borderColor: "#0a7a3a", borderWidth: 2, radius: 12, padding: 8 },
      }),
    );
    expect(out).toContain("Card");
    expect(out).toContain("border:2px solid #0a7a3a");
    expect(out).toContain("border-radius:12px");
    expect(out).toContain("background-color:#fafafa");
  });

  it("Columns shows only the chosen number of columns, kept between 1 and 4", async () => {
    const cols = {
      column1: [button("One")],
      column2: [button("Two")],
      column3: [button("Three")],
      column4: [button("Four")],
    };
    const three = await html(block("Columns", { ...cols, count: 3 }));
    expect(three).toContain("eb-cols-3");
    expect(three).toContain("Three");
    expect(three).not.toContain("Four");
    expect((three.match(/class="eb-col"/g) ?? []).length).toBe(3);
    expect(await html(block("Columns", { ...cols, count: 9 }))).toContain("eb-cols-4");
    expect(await html(block("Columns", { ...cols, count: 0 }))).toContain("eb-cols-1");
  });

  it("includes the screen-size rules that wrap columns on tablets and phones", async () => {
    const out = await html(block("Columns"));
    expect(out).toMatch(/<head>[\s\S]*@media \(max-width: 480px\)[\s\S]*<\/head>/);
  });

  it("renders blocks nested several levels deep", async () => {
    const out = await html(
      block("Section", {
        content: [block("Container", { content: [block("Columns", { column1: [button("Deep")] })] })],
      }),
    );
    expect(out).toContain("Deep");
  });

  it("stops at the nesting limit instead of crashing", async () => {
    let item = button("Too deep");
    for (let i = 0; i < 20; i++) item = block("Section", { content: [item] });
    const out = await html(item);
    expect(out).not.toContain("Too deep");
  });
});

describe("safeHref / safeImageSrc", () => {
  it.each([
    ["https://example.com", "https://example.com"],
    ["  http://example.com  ", "http://example.com"],
    ["mailto:hi@example.com", "mailto:hi@example.com"],
    ["javascript:alert(1)", undefined],
    ["data:text/html,hi", undefined],
    ["example.com", undefined],
    ["", undefined],
    [42, undefined],
  ])("safeHref(%j) is %j", (input, expected) => {
    expect(safeHref(input)).toBe(expected);
  });

  it("only allows https images", () => {
    expect(safeImageSrc("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    expect(safeImageSrc("http://cdn.example.com/a.png")).toBeUndefined();
    expect(safeImageSrc(undefined)).toBeUndefined();
  });
});
