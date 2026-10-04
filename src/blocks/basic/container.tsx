import type { ComponentConfig, Slot } from "@puckeditor/core";
import { LIMITS, resolveSpace } from "@/email/theme";
import { Box, boxDefaults, boxFields, colorOr, paletteColorField, type BoxProps } from "../shared";

export type ContainerProps = BoxProps & {
  content: Slot;
  card: { fill: string; borderColor: string; borderWidth: number; radius: number; padding: number };
};

// A boxed card inside the content column: fill, border, rounded corners.
export const Container: ComponentConfig<ContainerProps> = {
  fields: {
    content: { type: "slot" },
    card: {
      type: "object",
      label: "Card",
      objectFields: {
        fill: paletteColorField("Fill", { allowNone: true }),
        borderColor: paletteColorField("Border color", { allowNone: true }),
        borderWidth: { type: "number", label: "Border width", min: 0, max: 8 },
        radius: { type: "number", label: "Corner radius", min: 0, max: 32 },
        padding: { type: "number", label: "Inner padding", ...LIMITS.space },
      },
    },
    ...boxFields,
  },
  defaultProps: {
    content: [],
    card: { fill: "", borderColor: "#000000", borderWidth: 1, radius: 8, padding: 8 },
    ...boxDefaults(0, 16),
  },
  render: ({ content: Content, card, box }) => {
    const borderColor = colorOr(card?.borderColor, undefined);
    const borderWidth = Math.max(0, Math.min(8, Number(card?.borderWidth) || 0));
    return (
      <Box {...box}>
        {/* Fill, border, and radius sit on the cell: the only place every inbox draws them. */}
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={{ width: "100%", borderCollapse: "separate" }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: colorOr(card?.fill, undefined),
                  border: borderColor && borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
                  borderRadius: `${Math.max(0, Math.min(32, Number(card?.radius) || 0))}px`,
                  padding: `${resolveSpace(card?.padding, 8)}px 0`,
                }}
              >
                <Content minEmptyHeight={80} />
              </td>
            </tr>
          </tbody>
        </table>
      </Box>
    );
  },
};
