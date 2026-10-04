import type { CSSProperties, ReactNode } from "react";
import type { NumberField, ObjectField, PuckContext, SelectField, TextField } from "@puckeditor/core";
import {
  EMAIL_SAFE_FONTS,
  LIMITS,
  isHexColor,
  resolveSpace,
  resolveStyle,
  type EmailStyle,
  type FontName,
  type TextOverride,
} from "@/email/theme";

// Helpers used by more than one block. Server-safe: no browser-only code.

export type Align = "left" | "center" | "right";

export const alignField: SelectField = {
  type: "select",
  label: "Alignment",
  options: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ],
};

// A color field the editor shows as palette swatches (see editor/puck-config.tsx).
// Here it is a plain text field, so the server never loads editor code.
// allowNone adds a swatch saved as "": transparent for backgrounds, or
// "use the default" for text (noneLabel names it in the editor).
export function paletteColorField(label: string, { allowNone = false, noneLabel = "None" } = {}): TextField {
  return { type: "text", label, metadata: { palette: true, allowNone, noneLabel } };
}

// --- Text overrides --------------------------------------------------------

const toggleField = (label: string): SelectField => ({
  type: "select",
  label,
  options: [
    { value: "", label: "Default" },
    { value: "on", label: "On" },
    { value: "off", label: "Off" },
  ],
});

// A group of text settings that change only this block (or one link).
// Every value starts at "Default", meaning the Style tab's text style.
export function textOverrideField(label = "Typography"): ObjectField<TextOverride> {
  return {
    type: "object",
    label,
    objectFields: {
      font: {
        type: "select",
        label: "Font",
        options: [
          { value: "", label: "Default" },
          ...(Object.keys(EMAIL_SAFE_FONTS) as FontName[]).map((f) => ({ value: f, label: f })),
        ],
      },
      size: { type: "number", label: "Size", ...LIMITS.fontSize },
      bold: toggleField("Bold"),
      italic: toggleField("Italic"),
      underline: toggleField("Underline"),
      color: paletteColorField("Color", { allowNone: true, noneLabel: "Default color" }),
    },
  };
}

// The Style tab's settings, which Puck hands every block as metadata.
export function styleOf(puck: PuckContext): EmailStyle {
  return resolveStyle(puck.metadata.style);
}

export function colorOr<T extends string | undefined>(value: unknown, fallback: T): string | T {
  return isHexColor(value) ? value : fallback;
}

// Links from the editor end up in real inboxes, so only allow safe kinds.
// Anything else (e.g. "javascript:") is dropped.
export function safeHref(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  return /^(https?:\/\/|mailto:)/i.test(trimmed) ? trimmed : undefined;
}

// Inboxes block non-https images, so only those are rendered.
export function safeImageSrc(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  return /^https:\/\//i.test(trimmed) ? trimmed : undefined;
}

// --- The box every block sits in -------------------------------------------

// Every block gets these, grouped under "Spacing & background" in the right
// tab: spacing around it and a background that is transparent unless picked.
export type BoxSettings = {
  spaceAbove: number;
  spaceBelow: number;
  spaceSides: number;
  background: string;
};
export type BoxProps = { box: BoxSettings };

const spaceField = (label: string): NumberField => ({ type: "number", label, ...LIMITS.space });

export const boxFields: { box: ObjectField<BoxSettings> } = {
  box: {
    type: "object",
    label: "Spacing & background",
    objectFields: {
      spaceAbove: spaceField("Space above"),
      spaceBelow: spaceField("Space below"),
      spaceSides: spaceField("Side padding"),
      background: paletteColorField("Background", { allowNone: true }),
    },
  },
};

// Side padding defaults to 24px so text doesn't touch the edge of the email;
// full-bleed blocks (images, sections, banners) default to 0.
export const INSET = 24;

export function boxDefaults(spaceAbove = 0, spaceBelow = 16, spaceSides = INSET): BoxProps {
  return { box: { spaceAbove, spaceBelow, spaceSides, background: "" } };
}

// The wrapper every block renders inside: its spacing and background.
export function Box({
  spaceAbove,
  spaceBelow,
  spaceSides,
  background,
  children,
}: Partial<BoxSettings> & { children: ReactNode }) {
  const side = resolveSpace(spaceSides, INSET);
  return (
    <Cell
      background={colorOr(background, undefined)}
      style={{ padding: `${resolveSpace(spaceAbove, 0)}px ${side}px ${resolveSpace(spaceBelow, 0)}px` }}
    >
      {children}
    </Cell>
  );
}

// A full-width, one-cell table. Padding and borders go on the cell (<td>),
// the only place every inbox applies them. (On a <table> they also vanish in
// the editor, where Tailwind's reset collapses table borders.)
export function Cell({
  background,
  style,
  children,
}: {
  background?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ width: "100%", backgroundColor: background }}
    >
      <tbody>
        <tr>
          <td style={style}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}
