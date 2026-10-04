import type { ComponentConfig } from "@puckeditor/core";
import { Text } from "@react-email/components";
import { applyOverride, noOverride, textCss, type TextOverride } from "@/email/theme";
import {
  Box,
  boxDefaults,
  Cell,
  boxFields,
  colorOr,
  paletteColorField,
  styleOf,
  textOverrideField,
  type BoxProps,
} from "../shared";

export type QuoteProps = BoxProps & {
  quote: string;
  attribution: string;
  accentColor: string;
  quoteTypography: TextOverride;
  attributionTypography: TextOverride;
};

// A pull quote with a colored bar on the left and an optional attribution.
export const Quote: ComponentConfig<QuoteProps> = {
  fields: {
    quote: { type: "textarea", label: "Quote" },
    attribution: { type: "text", label: "Attribution (optional)" },
    accentColor: paletteColorField("Accent bar color"),
    quoteTypography: textOverrideField("Quote text"),
    attributionTypography: textOverrideField("Attribution text"),
    ...boxFields,
  },
  defaultProps: {
    quote: "The best dinner I've had all year.",
    attribution: "A happy guest",
    accentColor: "#000000",
    quoteTypography: noOverride,
    attributionTypography: noOverride,
    ...boxDefaults(0, 16),
  },
  render: ({
    quote,
    attribution,
    accentColor,
    quoteTypography,
    attributionTypography,
    puck,
    spaceAbove,
    spaceBelow,
    background,
  }) => {
    const { subtitle, caption } = styleOf(puck).text;
    return (
      <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
        <Cell style={{ borderLeft: `4px solid ${colorOr(accentColor, "#000000")}`, padding: "4px 0 4px 16px" }}>
          <Text style={{ ...textCss(applyOverride(subtitle, quoteTypography)), lineHeight: 1.4, margin: 0 }}>
            {quote}
          </Text>
          {attribution && (
            <Text style={{ ...textCss(applyOverride(caption, attributionTypography)), margin: "8px 0 0" }}>
              {attribution}
            </Text>
          )}
        </Cell>
      </Box>
    );
  },
};
