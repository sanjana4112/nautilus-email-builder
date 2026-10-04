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
    typography: noOverride,
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

  it("lets one link have its own color and box", async () => {
    const out = await html(
      block("Navigation", {
        look: "boxes",
        links: [
          link("Menu", "https://example.com/a", {
            boxColor: "#0a7a3a",
            typography: { ...noOverride, color: "#ffffff" },
          }),
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
    const separated = await html(block("Navigation", { look: "separators", separatorColor: "#ff0000", links: two }));
    expect((separated.match(/border-left:1px solid #ff0000/g) ?? []).length).toBe(1);
    const bar = await html(block("Navigation", { look: "bar", barColor: "#123456", links: two }));
    expect(bar).toContain("background-color:#123456");
  });

  it("applies link spacing, kept between 0 and 48px", async () => {
    expect(await html(block("Navigation", { linkSpacing: 20 }))).toContain("padding:0 10px");
    expect(await html(block("Navigation", { linkSpacing: 500 }))).toContain("padding:0 24px");
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
