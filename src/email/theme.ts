// Brand look in one place: the default email style, the allowed fonts, and
// resolveStyle(), which both the editor and the server use to read a saved
// style safely (missing or bad values fall back to these defaults).

// Fonts every inbox already has. Each maps to a CSS font stack with fallbacks.
export const EMAIL_SAFE_FONTS = {
  Arial: "Arial, Helvetica, sans-serif",
  Helvetica: "Helvetica, Arial, sans-serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  Verdana: "Verdana, Geneva, sans-serif",
  "Trebuchet MS": "'Trebuchet MS', Helvetica, sans-serif",
  "Courier New": "'Courier New', Courier, monospace",
} as const;
export type FontName = keyof typeof EMAIL_SAFE_FONTS;

export const TEXT_STYLE_LABELS = {
  title: "Title",
  heading1: "Heading 1",
  heading2: "Heading 2",
  subtitle: "Subtitle",
  normal: "Normal text",
  caption: "Caption",
} as const;
export type TextStyleName = keyof typeof TEXT_STYLE_LABELS;

export type TextStyle = {
  font: FontName;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
};

// Brand-wide look, edited in the Style tab.
export type EmailStyle = {
  palette: string[];
  text: Record<TextStyleName, TextStyle>;
};

// Settings for this one email, edited under Page in the right sidebar.
export type PageSettings = {
  background: string;
  contentWidth: number;
};

// The classic email width; editor placeholders use its proportions.
export const EMAIL_WIDTH = 600;

// Content stretches to fill the reader's screen, up to this width by default,
// so lines stay readable on big monitors.
export const DEFAULT_CONTENT_WIDTH = 1000;

export const LIMITS = {
  fontSize: { min: 8, max: 72 },
  contentWidth: { min: 320, max: 1600 },
  space: { min: 0, max: 160 },
  paletteSize: 15,
} as const;

const BLACK = "#000000";
const WHITE = "#ffffff";

function textStyle(font: FontName, size: number, bold = false): TextStyle {
  return { font, size, bold, italic: false, underline: false, color: BLACK };
}

export const defaultStyle: EmailStyle = {
  palette: [BLACK, WHITE],
  text: {
    title: textStyle("Georgia", 36, true),
    heading1: textStyle("Georgia", 28, true),
    heading2: textStyle("Georgia", 22, true),
    subtitle: textStyle("Helvetica", 18),
    normal: textStyle("Helvetica", 16),
    caption: textStyle("Helvetica", 12),
  },
};

// Content fills the reader's screen up to contentWidth; on wider screens the
// page background shows at the sides.
export const defaultPage: PageSettings = {
  background: WHITE,
  contentWidth: DEFAULT_CONTENT_WIDTH,
};

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

// For typed colors: accepts "0a7a3a", "#0A7A3A", or the short "0a7", and
// returns "#0a7a3a", or null if it isn't a color code.
export function parseHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "").toLowerCase();
  const full = /^[0-9a-f]{3}$/.test(raw) ? [...raw].map((c) => c + c).join("") : raw;
  const hex = `#${full}`;
  return isHexColor(hex) ? hex : null;
}

function color(value: unknown, fallback: string): string {
  return isHexColor(value) ? value.toLowerCase() : fallback;
}

function clamp(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function font(value: unknown, fallback: FontName): FontName {
  return typeof value === "string" && value in EMAIL_SAFE_FONTS ? (value as FontName) : fallback;
}

// Saved designs come from the browser, so treat every field as untrusted.
export function resolveStyle(raw: unknown): EmailStyle {
  const style = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<Record<keyof EmailStyle, unknown>>;
  const rawText = (typeof style.text === "object" && style.text !== null ? style.text : {}) as Record<string, unknown>;

  const palette = Array.isArray(style.palette)
    ? [...new Set(style.palette.filter(isHexColor).map((c) => c.toLowerCase()))].slice(0, LIMITS.paletteSize)
    : [];

  const text = {} as Record<TextStyleName, TextStyle>;
  for (const name of Object.keys(TEXT_STYLE_LABELS) as TextStyleName[]) {
    const fallback = defaultStyle.text[name];
    const t = (typeof rawText[name] === "object" && rawText[name] !== null ? rawText[name] : {}) as Record<
      string,
      unknown
    >;
    text[name] = {
      font: font(t.font, fallback.font),
      size: clamp(t.size, LIMITS.fontSize, fallback.size),
      bold: flag(t.bold, fallback.bold),
      italic: flag(t.italic, fallback.italic),
      underline: flag(t.underline, fallback.underline),
      // "" = None: no color set, so the inbox uses its own text color.
      color: t.color === "" ? "" : color(t.color, fallback.color),
    };
  }

  return {
    palette: palette.length > 0 ? palette : defaultStyle.palette,
    text,
  };
}

// Reads the page settings from the design's root props, with the same care.
export function resolvePage(raw: unknown): PageSettings {
  const page = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<Record<keyof PageSettings, unknown>>;
  return {
    // "" = None: no page color, so the inbox's own background shows.
    background: page.background === "" ? "" : color(page.background, defaultPage.background),
    contentWidth: clamp(page.contentWidth, LIMITS.contentWidth, defaultPage.contentWidth),
  };
}

// Vertical spacing around a block, in px.
export function resolveSpace(value: unknown, fallback: number): number {
  return clamp(value, LIMITS.space, fallback);
}

// Starter colors for the palette's "+" button, so each new swatch is distinct.
const STARTER_COLORS = [
  "#808080",
  "#d32f2f",
  "#1976d2",
  "#388e3c",
  "#f57c00",
  "#7b1fa2",
  "#0097a7",
  "#c2185b",
  "#5d4037",
  "#fbc02d",
  "#455a64",
  "#afb42b",
  "#e64a19",
  "#303f9f",
];

// A color not already in the palette. Duplicates would be merged away by
// resolveStyle, which made "+" look broken.
export function nextPaletteColor(palette: string[]): string {
  const starter = STARTER_COLORS.find((c) => !palette.includes(c));
  if (starter) return starter;
  let c: string;
  do {
    c = `#${Math.floor(Math.random() * 0x1000000)
      .toString(16)
      .padStart(6, "0")}`;
  } while (palette.includes(c));
  return c;
}

// Per-block (or per-link) changes on top of a text style, set in the right
// tab. Empty values mean "use the Style tab's default".
export type Toggle = "" | "on" | "off";
export type TextOverride = {
  font: FontName | "";
  size?: number;
  bold: Toggle;
  italic: Toggle;
  underline: Toggle;
  color: string;
};

export const noOverride: TextOverride = { font: "", bold: "", italic: "", underline: "", color: "" };

function toggle(value: unknown, fallback: boolean): boolean {
  return value === "on" ? true : value === "off" ? false : fallback;
}

// Applies overrides to a base style. Saved data is untrusted, so each value
// is checked the same way resolveStyle checks the Style tab.
export function applyOverride(base: TextStyle, raw: unknown): TextStyle {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    font: font(o.font, base.font),
    size: clamp(o.size, LIMITS.fontSize, base.size),
    bold: toggle(o.bold, base.bold),
    italic: toggle(o.italic, base.italic),
    underline: toggle(o.underline, base.underline),
    color: color(o.color, base.color),
  };
}

// Turns a text style into inline CSS, the only styling every inbox supports.
export function textCss(t: TextStyle) {
  return {
    fontFamily: EMAIL_SAFE_FONTS[t.font],
    fontSize: `${t.size}px`,
    fontWeight: t.bold ? 700 : 400,
    fontStyle: t.italic ? "italic" : "normal",
    textDecoration: t.underline ? "underline" : "none",
    color: t.color || undefined,
  } as const;
}
