import { describe, expect, it } from "vitest";
import { renderEmailHtml, type EmailData } from "@/email/render";
import { defaultStyle } from "@/email/theme";
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
  it("shows the logo and brand name", async () => {
    const out = await html(block("Title", { logoUrl: "https://cdn.example.com/logo.png", brandName: "Supper Club" }));
    expect(out).toContain('src="https://cdn.example.com/logo.png"');
    expect(out).toContain("Supper Club");
  });

  it("leaves out a logo that isn't https", async () => {
    const out = await html(block("Title", { logoUrl: "http://example.com/logo.png" }));
    expect(out).not.toContain("<img");
  });
});

describe("Navigation", () => {
  it("renders safe links and skips unsafe or empty ones", async () => {
    const out = await html(
      block("Navigation", {
        links: [
          { label: "Shop", url: "https://example.com/shop" },
          { label: "Evil", url: "javascript:alert(1)" },
          { label: "", url: "https://example.com/blank" },
        ],
      }),
    );
    expect(out).toContain('href="https://example.com/shop"');
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("Evil");
    expect(out).not.toContain("example.com/blank");
  });

  it("renders nothing with no links", async () => {
    expect(await html(block("Navigation", { links: [] }))).not.toContain("<a");
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
      block("Button", { label: "RSVP", url: "https://example.com/rsvp", backgroundColor: "#0a7a3a", textColor: "#ffffff" }),
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
