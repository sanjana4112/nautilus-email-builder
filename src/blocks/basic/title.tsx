import type { ComponentConfig } from "@puckeditor/core";
import { Img, Text } from "@react-email/components";
import { textCss } from "@/email/theme";
import { alignField, Box, boxDefaults, boxFields, safeImageSrc, styleOf, type Align, type BoxProps } from "../shared";

export type TitleProps = BoxProps & {
  logoUrl: string;
  logoAlt: string;
  logoWidth: number;
  brandName: string;
  align: Align;
};

// Top of the email: brand logo and/or name, in the Title text style.
export const Title: ComponentConfig<TitleProps> = {
  fields: {
    logoUrl: { type: "text", label: "Logo image URL (https)" },
    logoAlt: { type: "text", label: "Logo alt text" },
    logoWidth: { type: "number", label: "Logo width (px)", min: 24, max: 600 },
    brandName: { type: "text", label: "Brand name" },
    align: alignField,
    ...boxFields,
  },
  defaultProps: {
    logoUrl: "",
    logoAlt: "Logo",
    logoWidth: 120,
    brandName: "Your brand",
    align: "center",
    ...boxDefaults(24, 16),
  },
  render: ({ logoUrl, logoAlt, logoWidth, brandName, align, puck, spaceAbove, spaceBelow, background }) => {
    const src = safeImageSrc(logoUrl);
    const title = styleOf(puck).text.title;
    return (
      <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
        <div style={{ textAlign: align }}>
          {src && (
            <Img
              src={src}
              alt={logoAlt}
              width={logoWidth}
              style={{ display: "inline-block", maxWidth: "100%", height: "auto" }}
            />
          )}
          {brandName && <Text style={{ ...textCss(title), margin: src ? "8px 0 0" : 0 }}>{brandName}</Text>}
        </div>
      </Box>
    );
  },
};
