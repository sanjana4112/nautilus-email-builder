import type { ComponentConfig, Slot } from "@puckeditor/core";
import { LIMITS, resolveSpace } from "@/email/theme";
import { Box, boxDefaults, boxFields, Cell, type BoxProps } from "../shared";

export type SectionProps = BoxProps & {
  content: Slot;
  padding: { vertical: number; horizontal: number };
};

// A full-width band: set its color under Spacing & background, then drop
// any blocks inside.
export const SectionBlock: ComponentConfig<SectionProps> = {
  label: "Section",
  fields: {
    content: { type: "slot" },
    padding: {
      type: "object",
      label: "Inner padding",
      objectFields: {
        vertical: { type: "number", label: "Top and bottom", ...LIMITS.space },
        horizontal: { type: "number", label: "Sides", ...LIMITS.space },
      },
    },
    ...boxFields,
  },
  defaultProps: {
    content: [],
    padding: { vertical: 24, horizontal: 0 },
    ...boxDefaults(0, 0, 0),
  },
  render: ({ content: Content, padding, box }) => (
    <Box {...box}>
      <Cell
        style={{
          padding: `${resolveSpace(padding?.vertical, 24)}px ${resolveSpace(padding?.horizontal, 0)}px`,
        }}
      >
        <Content minEmptyHeight={80} />
      </Cell>
    </Box>
  ),
};
