import type { ComponentConfig } from "@puckeditor/core";
import { Text } from "@react-email/components";
import { textCss } from "@/email/theme";
import { alignField, Box, boxDefaults, boxFields, styleOf, type Align, type BoxProps } from "../shared";

export type TitleProps = BoxProps & {
  title: string;
  align: Align;
};

// Top of the email for brands without a banner: the brand or email title,
// in the Title text style.
export const Title: ComponentConfig<TitleProps> = {
  fields: {
    title: { type: "text", label: "Title" },
    align: alignField,
    ...boxFields,
  },
  defaultProps: {
    title: "Your brand",
    align: "center",
    ...boxDefaults(24, 16),
  },
  render: ({ title, align, puck, spaceAbove, spaceBelow, background }) => (
    <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
      <Text style={{ ...textCss(styleOf(puck).text.title), lineHeight: 1.2, textAlign: align, margin: 0 }}>{title}</Text>
    </Box>
  ),
};
