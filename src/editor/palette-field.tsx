"use client";

import { createUsePuck, FieldLabel } from "@puckeditor/core";
import type { blocksConfig } from "@/blocks";
import { resolveStyle } from "@/email/theme";

const usePuck = createUsePuck<typeof blocksConfig>();

// Pick a color from the palette. A color that was removed from the palette
// stays selected (so nothing changes by surprise) and is marked as such.
// allowNone adds a "None" swatch, saved as "" (transparent).
export function ColorChoice({
  value,
  palette,
  onChange,
  allowNone = false,
  noneLabel = "None",
}: {
  value: string;
  palette: string[];
  onChange: (c: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const isNone = allowNone && !value;
  const inPalette = isNone || palette.includes(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {allowNone && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={noneLabel}
            aria-pressed={isNone}
            title={noneLabel}
            className={`h-6 w-6 rounded border border-zinc-300 bg-[linear-gradient(135deg,transparent_45%,#ef4444_45%,#ef4444_55%,transparent_55%)] ${isNone ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
          />
        )}
        {[...(inPalette ? [] : [value]), ...palette].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={c}
            aria-pressed={c === value}
            style={{ backgroundColor: c }}
            className={`h-6 w-6 rounded border border-zinc-300 ${c === value ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
          />
        ))}
      </div>
      {!inPalette && <span className="text-xs text-zinc-500">{value} is not in the palette</span>}
    </div>
  );
}

// A block's color field in the right sidebar, showing the Style tab's palette.
export function PaletteField({
  label,
  value,
  onChange,
  allowNone,
  noneLabel,
}: {
  label?: string;
  value: string;
  onChange: (c: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  // Select the raw saved style (a stable reference), then resolve it here.
  const rawStyle = usePuck((s) => s.appState.data.root.props?.style);
  const { palette } = resolveStyle(rawStyle);
  return (
    <FieldLabel label={label ?? "Color"} el="div">
      <ColorChoice value={value} palette={palette} onChange={onChange} allowNone={allowNone} noneLabel={noneLabel} />
    </FieldLabel>
  );
}
