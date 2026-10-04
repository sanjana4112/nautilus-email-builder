import type { ComponentConfig } from "@puckeditor/core";
import { Button as EmailButton, Text } from "@react-email/components";
import { applyOverride, noOverride, textCss, type TextOverride } from "@/email/theme";
import {
  alignField,
  Box,
  boxDefaults,
  boxFields,
  colorOr,
  paletteColorField,
  safeHref,
  styleOf,
  textOverrideField,
  type Align,
  type BoxProps,
} from "../shared";

export type ButtonProps = BoxProps & {
  label: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  align: Align;
  typography: TextOverride;
};

// A call-to-action button. React Email's Button handles Outlook's padding quirks.
export const Button: ComponentConfig<ButtonProps> = {
  fields: {
    label: { type: "text", label: "Label" },
    url: { type: "text", label: "Link" },
    backgroundColor: paletteColorField("Button color"),
    textColor: paletteColorField("Text color"),
    align: alignField,
    typography: textOverrideField("Label text"),
    ...boxFields,
  },
  defaultProps: {
    label: "Get tickets",
    url: "https://example.com",
    backgroundColor: "#000000",
    textColor: "#ffffff",
    align: "center",
    typography: noOverride,
    ...boxDefaults(8, 16),
  },
  render: ({ label, url, backgroundColor, textColor, align, typography, puck, box }) => {
    // Bold label in the button's text color, unless the Label text settings say otherwise.
    const base = { ...styleOf(puck).text.normal, bold: true, underline: false, color: colorOr(textColor, "#ffffff") };
    const css = {
      ...textCss(applyOverride(base, typography)),
      backgroundColor: colorOr(backgroundColor, "#000000"),
      borderRadius: "4px",
      padding: "12px 24px",
      display: "inline-block",
    };
    const href = safeHref(url);
    return (
      <Box {...box}>
        <div style={{ textAlign: align }}>
          {href ? (
            <EmailButton href={href} style={css}>
              {label}
            </EmailButton>
          ) : (
            // No safe link: show the button shape without making it clickable.
            <Text style={{ ...css, margin: 0 }}>{label}</Text>
          )}
        </div>
      </Box>
    );
  },
};
