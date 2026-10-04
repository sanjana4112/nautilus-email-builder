"use client";

import { AutoField, FieldLabel, type Field, type FieldProps } from "@puckeditor/core";

type ObjectFieldDef = Extract<Field, { type: "object" }>;

// How every grouped field (Typography, Spacing & background, Style) appears
// in the right tab: a quiet header you click to open or close, so the panel
// stays clean. Closed by default; each inner field is drawn by Puck's AutoField.
export function FieldGroup({
  field,
  value,
  onChange,
  readOnly,
  label,
  name,
}: FieldProps<ObjectFieldDef, Record<string, unknown> | undefined> & { label?: string; name: string }) {
  const current = value ?? {};
  return (
    <details className="group border-t border-zinc-200 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-zinc-900 [&::-webkit-details-marker]:hidden">
        {label ?? field.label ?? name}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          className="transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </summary>
      <div className="flex flex-col gap-4 pb-4">
        {Object.entries(field.objectFields).map(([key, sub]) => {
          const control = (
            <AutoField
              field={sub}
              value={current[key]}
              readOnly={Boolean(readOnly)}
              onChange={(next) => onChange({ ...current, [key]: next })}
            />
          );
          // Palette swatches (custom fields) draw their own label.
          return (
            <div key={key}>
              {sub.type === "custom" ? control : <FieldLabel label={sub.label ?? key}>{control}</FieldLabel>}
            </div>
          );
        })}
      </div>
    </details>
  );
}
