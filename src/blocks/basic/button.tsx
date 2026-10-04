import type { ComponentConfig } from "@puckeditor/core";
import { Button as EmailButton, Section, Text } from "@react-email/components";
import { textCss } from "@/email/theme";
import { alignField, colorOr, paletteColorField, safeHref, styleOf, type Align } from "../shared";

export type ButtonProps = {
  label: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  align: Align;
};

// A call-to-action button. React Email's Button handles Outlook's padding quirks.
export const Button: ComponentConfig<ButtonProps> = {
  fields: {
    label: { type: "text", label: "Label" },
    url: { type: "text", label: "Link (https:// or mailto:)" },
    backgroundColor: paletteColorField("Button color"),
    textColor: paletteColorField("Text color"),
    align: alignField,
  },
  defaultProps: {
    label: "Get tickets",
    url: "https://example.com",
    backgroundColor: "#000000",
    textColor: "#ffffff",
    align: "center",
  },
  render: ({ label, url, backgroundColor, textColor, align, puck }) => {
    const normal = styleOf(puck).text.normal;
    const css = {
      ...textCss(normal),
      color: colorOr(textColor, "#ffffff"),
      backgroundColor: colorOr(backgroundColor, "#000000"),
      fontWeight: 700,
      textDecoration: "none",
      borderRadius: "4px",
      padding: "12px 24px",
      display: "inline-block",
    };
    const href = safeHref(url);
    return (
      <Section style={{ textAlign: align, padding: "8px 0 16px" }}>
        {href ? (
          <EmailButton href={href} style={css}>
            {label}
          </EmailButton>
        ) : (
          // No safe link: show the button shape without making it clickable.
          <Text style={{ ...css, margin: 0 }}>{label}</Text>
        )}
      </Section>
    );
  },
};
