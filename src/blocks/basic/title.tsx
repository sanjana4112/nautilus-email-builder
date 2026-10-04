import type { ComponentConfig } from "@puckeditor/core";
import { Text } from "@react-email/components";
import { applyOverride, noOverride, textCss, type TextOverride } from "@/email/theme";
import {
  alignField,
  Box,
  boxDefaults,
  boxFields,
  styleOf,
  textOverrideField,
  type Align,
  type BoxProps,
} from "../shared";

export type TitleProps = BoxProps & {
  title: string;
  align: Align;
  typography: TextOverride;
};

// Top of the email for brands without a banner: the brand or email title,
// in the Title text style.
export const Title: ComponentConfig<TitleProps> = {
  fields: {
    title: { type: "text", label: "Title" },
    align: alignField,
    typography: textOverrideField(),
    ...boxFields,
  },
  defaultProps: {
    title: "Your brand",
    align: "center",
    typography: noOverride,
    ...boxDefaults(24, 16),
  },
  render: ({ title, align, typography, puck, spaceAbove, spaceBelow, background }) => (
    <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
      <Text
        style={{
          ...textCss(applyOverride(styleOf(puck).text.title, typography)),
          lineHeight: 1.2,
          textAlign: align,
          margin: 0,
        }}
      >
        {title}
      </Text>
    </Box>
  ),
};
