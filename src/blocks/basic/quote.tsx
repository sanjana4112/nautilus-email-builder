import type { ComponentConfig } from "@puckeditor/core";
import { Section, Text } from "@react-email/components";
import { textCss } from "@/email/theme";
import { Box, boxDefaults, boxFields, colorOr, paletteColorField, styleOf, type BoxProps } from "../shared";

export type QuoteProps = BoxProps & {
  quote: string;
  attribution: string;
  accentColor: string;
};

// A pull quote with a colored bar on the left and an optional attribution.
export const Quote: ComponentConfig<QuoteProps> = {
  fields: {
    quote: { type: "textarea", label: "Quote" },
    attribution: { type: "text", label: "Attribution (optional)" },
    accentColor: paletteColorField("Accent bar color"),
    ...boxFields,
  },
  defaultProps: {
    quote: "The best dinner I've had all year.",
    attribution: "A happy guest",
    accentColor: "#000000",
    ...boxDefaults(0, 16),
  },
  render: ({ quote, attribution, accentColor, puck, spaceAbove, spaceBelow, background }) => {
    const { subtitle, caption } = styleOf(puck).text;
    return (
      <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
        <Section style={{ borderLeft: `4px solid ${colorOr(accentColor, "#000000")}`, padding: "4px 0 4px 16px" }}>
          <Text style={{ ...textCss(subtitle), lineHeight: 1.4, margin: 0 }}>{quote}</Text>
          {attribution && <Text style={{ ...textCss(caption), margin: "8px 0 0" }}>{attribution}</Text>}
        </Section>
      </Box>
    );
  },
};
