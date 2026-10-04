import type { PuckContext, SelectField, TextField } from "@puckeditor/core";
import { isHexColor, resolveStyle, type EmailStyle } from "@/email/theme";

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
export function paletteColorField(label: string): TextField {
  return { type: "text", label, metadata: { palette: true } };
}

// The Style tab's settings, which Puck hands every block as metadata.
export function styleOf(puck: PuckContext): EmailStyle {
  return resolveStyle(puck.metadata.style);
}

export function colorOr(value: unknown, fallback: string): string {
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
