import type { CSSProperties, ReactNode } from "react";
import type { NumberField, PuckContext, SelectField, TextField } from "@puckeditor/core";
import { LIMITS, isHexColor, resolveSpace, resolveStyle, type EmailStyle } from "@/email/theme";

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
// allowNone adds a "None" swatch, saved as "" (transparent).
export function paletteColorField(label: string, { allowNone = false } = {}): TextField {
  return { type: "text", label, metadata: { palette: true, allowNone } };
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

// Every block gets these: spacing around it and an optional background
// (transparent unless a color is picked).
export type BoxProps = {
  spaceAbove: number;
  spaceBelow: number;
  background: string;
};

const spaceField = (label: string): NumberField => ({ type: "number", label, ...LIMITS.space });

export const boxFields = {
  spaceAbove: spaceField("Space above (px)"),
  spaceBelow: spaceField("Space below (px)"),
  background: paletteColorField("Block background", { allowNone: true }),
};

export function boxDefaults(spaceAbove = 0, spaceBelow = 16): BoxProps {
  return { spaceAbove, spaceBelow, background: "" };
}

// Side padding for text, so it doesn't touch the edge of the email.
// Full-bleed blocks (images, banners) pass inset={false}.
const INSET = 24;

export function Box({
  spaceAbove,
  spaceBelow,
  background,
  inset = true,
  children,
}: BoxProps & { inset?: boolean; children: ReactNode }) {
  const side = inset ? INSET : 0;
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
