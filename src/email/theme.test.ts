import { describe, expect, it } from "vitest";
import { defaultStyle, isHexColor, nextPaletteColor, resolveStyle, textCss } from "./theme";

describe("resolveStyle", () => {
  it("returns the defaults when nothing is saved", () => {
    expect(resolveStyle(undefined)).toEqual(defaultStyle);
    expect(resolveStyle(null)).toEqual(defaultStyle);
    expect(resolveStyle("not an object")).toEqual(defaultStyle);
  });

  it("falls back to black and white when the palette is empty", () => {
    expect(resolveStyle({ palette: [] }).palette).toEqual(["#000000", "#ffffff"]);
  });

  it("keeps valid brand colors, drops bad ones and duplicates", () => {
    const { palette } = resolveStyle({ palette: ["#0A7A3A", "banana", "#0a7a3a", 42, "#ff0000"] });
    expect(palette).toEqual(["#0a7a3a", "#ff0000"]);
  });

  it("caps the palette at 15 colors", () => {
    const many = Array.from({ length: 30 }, (_, i) => `#0000${i.toString(16).padStart(2, "0")}`);
    expect(resolveStyle({ palette: many }).palette).toHaveLength(15);
  });

  it("ignores a bad background color", () => {
    expect(resolveStyle({ background: "red; display:none" }).background).toBe("#ffffff");
  });

  it("keeps content width between 320 and 800px", () => {
    expect(resolveStyle({ contentWidth: 100 }).contentWidth).toBe(320);
    expect(resolveStyle({ contentWidth: 5000 }).contentWidth).toBe(800);
    expect(resolveStyle({ contentWidth: "wide" }).contentWidth).toBe(600);
  });

  it("keeps font sizes between 8 and 72px", () => {
    const { text } = resolveStyle({ text: { title: { size: 5000 }, caption: { size: 1 } } });
    expect(text.title.size).toBe(72);
    expect(text.caption.size).toBe(8);
  });

  it("falls back to the default font when it isn't email-safe", () => {
    expect(resolveStyle({ text: { heading1: { font: "Comic Sans" } } }).text.heading1.font).toBe("Georgia");
  });

  it("keeps a text color even if it isn't in the palette", () => {
    const style = resolveStyle({ palette: ["#000000"], text: { heading1: { color: "#0a7a3a" } } });
    expect(style.text.heading1.color).toBe("#0a7a3a");
  });

  it("fills in missing text styles and fields from the defaults", () => {
    const { text } = resolveStyle({ text: { heading1: { bold: false } } });
    expect(text.heading1).toEqual({ ...defaultStyle.text.heading1, bold: false });
    expect(text.caption).toEqual(defaultStyle.text.caption);
  });
});

describe("nextPaletteColor", () => {
  it("lets you add colors one by one up to the 15-color limit", () => {
    let palette = resolveStyle(undefined).palette;
    while (palette.length < 15) {
      palette = resolveStyle({ palette: [...palette, nextPaletteColor(palette)] }).palette;
    }
    expect(palette).toHaveLength(15);
    expect(new Set(palette).size).toBe(15);
  });

  it("still finds a new valid color once every starter color is taken", () => {
    const taken: string[] = [];
    for (let i = 0; i < 30; i++) taken.push(nextPaletteColor(taken));
    expect(new Set(taken).size).toBe(30);
    expect(taken.every(isHexColor)).toBe(true);
  });
});

describe("textCss", () => {
  it("turns a text style into inline CSS", () => {
    expect(
      textCss({ font: "Georgia", size: 28, bold: true, italic: true, underline: true, color: "#0a7a3a" }),
    ).toEqual({
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize: "28px",
      fontWeight: 700,
      fontStyle: "italic",
      textDecoration: "underline",
      color: "#0a7a3a",
    });
  });
});
