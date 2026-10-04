"use client";

import type { Config, Field } from "@puckeditor/core";
import { blocksConfig, type BlockProps, type EmailRootProps } from "@/blocks";
import { PaletteField } from "./palette-field";

// Swap any field a block marked as a palette color for the swatch picker.
// Only the field's editor UI changes; the saved value is still a hex string.
function withPaletteFields<C extends { fields?: unknown }>(component: C): C {
  if (!component.fields) return component;
  const fields = Object.fromEntries(
    Object.entries(component.fields as Record<string, Field>).map(([name, field]) => [
      name,
      field.metadata?.palette
        ? ({
            type: "custom",
            label: field.label,
            render: ({ value, onChange }) => (
              <PaletteField
                label={field.label}
                value={String(value ?? "")}
                onChange={onChange}
                allowNone={Boolean(field.metadata?.allowNone)}
              />
            ),
          } satisfies Field<string>)
        : field,
    ]),
  );
  return { ...component, fields };
}

// The shared block list plus editor-only extras: palette swatches and the
// groups shown in the Blocks tab. The server keeps using blocksConfig.
export const editorConfig: Config<BlockProps, EmailRootProps> = {
  ...blocksConfig,
  root: withPaletteFields(blocksConfig.root ?? {}),
  categories: {
    header: { title: "Header", components: ["Title", "Navigation", "Image"] },
    content: { title: "Content", components: ["Heading", "BodyCopy", "Quote", "Button"] },
    social: { title: "Social", components: ["SocialLinks"] },
  },
  components: Object.fromEntries(
    Object.entries(blocksConfig.components).map(([name, component]) => [name, withPaletteFields(component)]),
  ) as typeof blocksConfig.components,
};
