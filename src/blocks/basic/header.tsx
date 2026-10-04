import type { ComponentConfig } from "@puckeditor/core";
import { Img, Section, Text } from "@react-email/components";
import { textCss } from "@/email/theme";
import { alignField, safeImageSrc, styleOf, type Align } from "../shared";

export type HeaderProps = {
  logoUrl: string;
  logoAlt: string;
  logoWidth: number;
  brandName: string;
  align: Align;
};

// Top of the email: brand logo and/or name, in the Title text style.
export const Header: ComponentConfig<HeaderProps> = {
  label: "Title / header",
  fields: {
    logoUrl: { type: "text", label: "Logo image URL (https)" },
    logoAlt: { type: "text", label: "Logo alt text" },
    logoWidth: { type: "number", label: "Logo width (px)", min: 24, max: 600 },
    brandName: { type: "text", label: "Brand name" },
    align: alignField,
  },
  defaultProps: {
    logoUrl: "",
    logoAlt: "Logo",
    logoWidth: 120,
    brandName: "Your brand",
    align: "center",
  },
  render: ({ logoUrl, logoAlt, logoWidth, brandName, align, puck }) => {
    const src = safeImageSrc(logoUrl);
    const title = styleOf(puck).text.title;
    return (
      <Section style={{ textAlign: align, padding: "8px 0 16px" }}>
        {src && (
          <Img
            src={src}
            alt={logoAlt}
            width={logoWidth}
            style={{ display: "inline-block", maxWidth: "100%", height: "auto" }}
          />
        )}
        {brandName && <Text style={{ ...textCss(title), margin: src ? "8px 0 0" : 0 }}>{brandName}</Text>}
      </Section>
    );
  },
};
