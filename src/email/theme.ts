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

export type EmailStyle = {
  palette: string[];
  background: string;
  contentWidth: number;
  text: Record<TextStyleName, TextStyle>;
};

export const LIMITS = {
  fontSize: { min: 8, max: 72 },
  contentWidth: { min: 320, max: 800 },
  paletteSize: 15,
} as const;

const BLACK = "#000000";
const WHITE = "#ffffff";

function textStyle(font: FontName, size: number, bold = false): TextStyle {
  return { font, size, bold, italic: false, underline: false, color: BLACK };
}

export const defaultStyle: EmailStyle = {
  palette: [BLACK, WHITE],
  background: WHITE,
  contentWidth: 600,
  text: {
    title: textStyle("Georgia", 36, true),
    heading1: textStyle("Georgia", 28, true),
    heading2: textStyle("Georgia", 22, true),
    subtitle: textStyle("Helvetica", 18),
    normal: textStyle("Helvetica", 16),
    caption: textStyle("Helvetica", 12),
  },
};

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

function color(value: unknown, fallback: string): string {
  return isHexColor(value) ? value.toLowerCase() : fallback;
}

function clamp(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
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
    const t = (typeof rawText[name] === "object" && rawText[name] !== null ? rawText[name] : {}) as Record<string, unknown>;
    text[name] = {
      font: font(t.font, fallback.font),
      size: clamp(t.size, LIMITS.fontSize, fallback.size),
      bold: flag(t.bold, fallback.bold),
      italic: flag(t.italic, fallback.italic),
      underline: flag(t.underline, fallback.underline),
      color: color(t.color, fallback.color),
    };
  }

  return {
    palette: palette.length > 0 ? palette : defaultStyle.palette,
    background: color(style.background, defaultStyle.background),
    contentWidth: clamp(style.contentWidth, LIMITS.contentWidth, defaultStyle.contentWidth),
    text,
  };
}

// Starter colors for the palette's "+" button, so each new swatch is distinct.
const STARTER_COLORS = [
  "#808080", "#d32f2f", "#1976d2", "#388e3c", "#f57c00", "#7b1fa2", "#0097a7",
  "#c2185b", "#5d4037", "#fbc02d", "#455a64", "#afb42b", "#e64a19", "#303f9f",
];

// A color not already in the palette. Duplicates would be merged away by
// resolveStyle, which made "+" look broken.
export function nextPaletteColor(palette: string[]): string {
  const starter = STARTER_COLORS.find((c) => !palette.includes(c));
  if (starter) return starter;
  let c: string;
  do {
    c = `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0")}`;
  } while (palette.includes(c));
  return c;
}

// Turns a text style into inline CSS, the only styling every inbox supports.
export function textCss(t: TextStyle) {
  return {
    fontFamily: EMAIL_SAFE_FONTS[t.font],
    fontSize: `${t.size}px`,
    fontWeight: t.bold ? 700 : 400,
    fontStyle: t.italic ? "italic" : "normal",
    textDecoration: t.underline ? "underline" : "none",
    color: t.color,
  } as const;
}
