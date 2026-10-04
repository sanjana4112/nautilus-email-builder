"use client";

import type { Config, Field } from "@puckeditor/core";
import { blocksConfig, type BlockProps, type EmailRootProps } from "@/blocks";
import { ImageField } from "./image-field";
import { PaletteField } from "./palette-field";

// Swap fields blocks marked for the editor: palette colors become swatches
// and image links get a preview with a resolution check. Also applies to
// fields nested in groups (object) and lists (array).
// Only the field's editor UI changes; the saved value is still a plain string.
function upgradeField(field: Field): Field {
  if (field.metadata?.palette) {
    return {
      type: "custom",
      label: field.label,
      render: ({ value, onChange }) => (
        <PaletteField
          label={field.label}
          value={String(value ?? "")}
          onChange={onChange}
          allowNone={Boolean(field.metadata?.allowNone)}
          noneLabel={field.metadata?.noneLabel}
        />
      ),
    } satisfies Field<string>;
  }
  const image = field.metadata?.image as { minWidth: number } | undefined;
  if (image) {
    return {
      type: "custom",
      label: field.label,
      render: ({ value, onChange }) => (
        <ImageField
          label={field.label ?? "Image"}
          value={String(value ?? "")}
          onChange={onChange}
          minWidth={image.minWidth}
        />
      ),
    } satisfies Field<string>;
  }
  if (field.type === "object") return { ...field, objectFields: upgradeFields(field.objectFields) };
  if (field.type === "array") return { ...field, arrayFields: upgradeFields(field.arrayFields) };
  return field;
}

function upgradeFields<F extends object>(fields: F): F {
  return Object.fromEntries(
    Object.entries(fields as Record<string, Field>).map(([name, field]) => [name, upgradeField(field)]),
  ) as F;
}

function withPaletteFields<C extends { fields?: unknown }>(component: C): C {
  return component.fields ? { ...component, fields: upgradeFields(component.fields) } : component;
}

// The shared block list plus editor-only extras: palette swatches and the
// groups shown in the Blocks tab. The server keeps using blocksConfig.
export const editorConfig: Config<BlockProps, EmailRootProps> = {
  ...blocksConfig,
  root: withPaletteFields(blocksConfig.root ?? {}),
  categories: {
    layout: { title: "Layout", components: ["Section", "Container", "Columns"] },
    header: { title: "Header", components: ["Title", "Banner", "Navigation"] },
    content: { title: "Content", components: ["Heading", "BodyCopy", "Image", "Quote", "Button"] },
    social: { title: "Social", components: ["SocialLinks"] },
  },
  components: Object.fromEntries(
    Object.entries(blocksConfig.components).map(([name, component]) => [name, withPaletteFields(component)]),
  ) as typeof blocksConfig.components,
};
