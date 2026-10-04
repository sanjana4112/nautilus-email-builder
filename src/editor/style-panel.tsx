"use client";

import { createUsePuck } from "@puckeditor/core";
import type { blocksConfig } from "@/blocks";
import { ColorChoice } from "./palette-field";
import {
  EMAIL_SAFE_FONTS,
  LIMITS,
  TEXT_STYLE_LABELS,
  nextPaletteColor,
  resolveStyle,
  type EmailStyle,
  type FontName,
  type TextStyle,
  type TextStyleName,
} from "@/email/theme";

const usePuck = createUsePuck<typeof blocksConfig>();

// The "Style" tab in the left sidebar: the brand-wide palette and text
// styles. Page-only settings (background, width) live under Page instead. Saves into the design's page settings (root.props.style).
export function StylePanel() {
  const root = usePuck((s) => s.appState.data.root);
  const dispatch = usePuck((s) => s.dispatch);
  const style = resolveStyle(root.props?.style);

  function save(next: EmailStyle) {
    // Built as a variable: Puck's action type only knows its default root fields.
    const nextRoot = { ...root, props: { title: "", subject: "", ...root.props, style: next } };
    dispatch({ type: "replaceRoot", root: nextRoot });
  }
  const setText = (name: TextStyleName, patch: Partial<TextStyle>) =>
    save({ ...style, text: { ...style.text, [name]: { ...style.text[name], ...patch } } });
  const setPaletteColor = (index: number, value: string) =>
    save({ ...style, palette: style.palette.map((c, i) => (i === index ? value : c)) });

  return (
    <div className="flex flex-col gap-6 p-4 text-sm">
      <Section title="Color palette">
        <div className="flex flex-wrap gap-2">
          {style.palette.map((c, i) => (
            <div key={i} className="relative">
              <input
                type="color"
                value={c}
                onChange={(e) => setPaletteColor(i, e.target.value)}
                aria-label={`Palette color ${c}`}
                className="h-9 w-9 cursor-pointer rounded border border-zinc-300"
              />
              <button
                type="button"
                onClick={() => save({ ...style, palette: style.palette.filter((_, j) => j !== i) })}
                aria-label={`Remove ${c}`}
                className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-zinc-700 text-[10px] leading-4 text-white"
              >
                ×
              </button>
            </div>
          ))}
          {style.palette.length < LIMITS.paletteSize && (
            <button
              type="button"
              onClick={() => save({ ...style, palette: [...style.palette, nextPaletteColor(style.palette)] })}
              aria-label="Add color"
              className="h-9 w-9 rounded border border-dashed border-zinc-400 text-lg text-zinc-500"
            >
              +
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">Empty palette falls back to black and white.</p>
      </Section>

      <Section title="Text styles">
        {(Object.keys(TEXT_STYLE_LABELS) as TextStyleName[]).map((name) => (
          <TextStyleEditor
            key={name}
            label={TEXT_STYLE_LABELS[name]}
            value={style.text[name]}
            palette={style.palette}
            onChange={(patch) => setText(name, patch)}
          />
        ))}
      </Section>
    </div>
  );
}

function TextStyleEditor({
  label,
  value,
  palette,
  onChange,
}: {
  label: string;
  value: TextStyle;
  palette: string[];
  onChange: (patch: Partial<TextStyle>) => void;
}) {
  return (
    <details className="rounded border border-zinc-200">
      <summary className="cursor-pointer px-3 py-2 font-medium">{label}</summary>
      <div className="flex flex-col gap-3 border-t border-zinc-200 p-3">
        <Row label="Font">
          <select
            value={value.font}
            onChange={(e) => onChange({ font: e.target.value as FontName })}
            className="rounded border border-zinc-300 px-2 py-1"
          >
            {(Object.keys(EMAIL_SAFE_FONTS) as FontName[]).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Size">
          <NumberInput value={value.size} limits={LIMITS.fontSize} onChange={(size) => onChange({ size })} />
        </Row>
        <Row label="Format">
          <div className="flex gap-1">
            <Toggle on={value.bold} onClick={() => onChange({ bold: !value.bold })} label="Bold" className="font-bold">
              B
            </Toggle>
            <Toggle on={value.italic} onClick={() => onChange({ italic: !value.italic })} label="Italic" className="italic">
              I
            </Toggle>
            <Toggle
              on={value.underline}
              onClick={() => onChange({ underline: !value.underline })}
              label="Underline"
              className="underline"
            >
              U
            </Toggle>
          </div>
        </Row>
        <Row label="Color">
          <ColorChoice value={value.color} palette={palette} onChange={(color) => onChange({ color })} />
        </Row>
      </div>
    </details>
  );
}

// Number box with px suffix. Out-of-range values are clamped when you leave the box.
function NumberInput({
  value,
  limits,
  onChange,
}: {
  value: number;
  limits: { min: number; max: number };
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center gap-1">
      <input
        type="number"
        min={limits.min}
        max={limits.max}
        defaultValue={value}
        key={value}
        onBlur={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.min(limits.max, Math.max(limits.min, Math.round(n))) : value);
        }}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="w-20 rounded border border-zinc-300 px-2 py-1 text-right"
      />
      <span className="text-zinc-500">px</span>
    </label>
  );
}

function Toggle({
  on,
  onClick,
  label,
  className,
  children,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  className: string;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className={`h-7 w-7 rounded border ${on ? "border-blue-500 bg-blue-50" : "border-zinc-300"} ${className}`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-700">{label}</span>
      {children}
    </div>
  );
}
