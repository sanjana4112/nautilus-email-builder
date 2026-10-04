"use client";

import { useState, useSyncExternalStore } from "react";
import { createUsePuck, FieldLabel } from "@puckeditor/core";
import type { blocksConfig } from "@/blocks";
import { parseHex, resolveStyle } from "@/email/theme";

const usePuck = createUsePuck<typeof blocksConfig>();

// --- Swatches or hex: one choice shared by every color field ---------------
// Switching any color field to Hex makes every color field open in Hex for
// the rest of the browser session (kept in sessionStorage, this tab only).

type InputMode = "swatches" | "hex";
const MODE_KEY = "email-builder:color-input";
const listeners = new Set<() => void>();

function readMode(): InputMode {
  try {
    return window.sessionStorage.getItem(MODE_KEY) === "hex" ? "hex" : "swatches";
  } catch {
    return "swatches"; // storage blocked (e.g. private mode): fall back quietly
  }
}

let currentMode: InputMode | null = null;

function setMode(mode: InputMode) {
  currentMode = mode;
  try {
    window.sessionStorage.setItem(MODE_KEY, mode);
  } catch {
    // Not saved, but still applies until the page reloads.
  }
  listeners.forEach((notify) => notify());
}

function useInputMode(): InputMode {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => (currentMode ??= readMode()),
    () => "swatches",
  );
}

// A "#" box for typing a color. Applies as soon as the code is valid; while
// it isn't, the box is outlined in red and the color stays as it was.
function HexInput({
  value,
  onChange,
  allowNone,
}: {
  value: string;
  onChange: (c: string) => void;
  allowNone: boolean;
}) {
  // What's typed, tied to the value it was typed against; if the value changes
  // elsewhere (e.g. a swatch click), the box shows the new value instead.
  const [draft, setDraft] = useState({ against: value, text: value.replace(/^#/, "") });
  const text = draft.against === value ? draft.text : value.replace(/^#/, "");
  const invalid = text !== "" && parseHex(text) === null;

  return (
    <label
      className={`flex h-8 items-center rounded border bg-white px-2 text-sm ${invalid ? "border-red-500" : "border-zinc-300"}`}
    >
      <span className="text-zinc-400">#</span>
      <input
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          const hex = parseHex(next);
          const cleared = allowNone && next.trim() === "";
          const nextValue = hex ?? (cleared ? "" : value);
          setDraft({ against: nextValue, text: next });
          if (nextValue !== value) onChange(nextValue);
        }}
        placeholder={allowNone ? "none" : "000000"}
        maxLength={7}
        spellCheck={false}
        aria-label="Hex color"
        aria-invalid={invalid}
        className="ml-1 w-full bg-transparent font-mono uppercase outline-none placeholder:normal-case placeholder:text-zinc-300"
      />
      <span
        aria-hidden
        className="ml-2 h-4 w-4 shrink-0 rounded-sm border border-zinc-300"
        style={{ backgroundColor: value || "transparent" }}
      />
    </label>
  );
}

function ModeToggle({ mode }: { mode: InputMode }) {
  return (
    <div className="flex self-end rounded border border-zinc-200 p-px text-[10px] uppercase tracking-[0.12em]">
      {(["swatches", "hex"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-pressed={mode === m}
          className={`rounded-sm px-1.5 py-0.5 transition-colors ${mode === m ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
        >
          {m === "swatches" ? "Swatches" : "Hex"}
        </button>
      ))}
    </div>
  );
}

// Pick a color from the palette, or type a hex code. A color that was removed
// from the palette stays selected (so nothing changes by surprise) and is
// marked as such. allowNone adds a "None" choice, saved as "".
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
  const mode = useInputMode();
  const isNone = allowNone && !value;
  const inPalette = isNone || palette.includes(value);
  if (mode === "hex") {
    return (
      <div className="flex flex-col gap-1">
        <ModeToggle mode={mode} />
        <HexInput value={value} onChange={onChange} allowNone={allowNone} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <ModeToggle mode={mode} />
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
