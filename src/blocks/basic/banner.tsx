import type { ComponentConfig } from "@puckeditor/core";
import { Img, Link, Text } from "@react-email/components";
import { applyOverride, EMAIL_WIDTH, noOverride, textCss, type TextOverride } from "@/email/theme";
import {
  Box,
  boxDefaults,
  boxFields,
  Cell,
  colorOr,
  imageField,
  paletteColorField,
  safeHref,
  safeImageSrc,
  styleOf,
  textOverrideField,
  type BoxProps,
} from "../shared";

export type BannerProps = BoxProps & {
  kind: "strip" | "image";
  text: string;
  imageUrl: string;
  alt: string;
  linkUrl: string;
  strip: { color: string; textColor: string; height: number };
  typography: TextOverride;
};

// Wide promo-banner proportions (4:1) for the editor placeholder.
const PLACEHOLDER_HEIGHT = EMAIL_WIDTH / 4;

// A full-width banner: a colored strip with one line of text (for brands
// without banner art), or a wide image that scales to the email width.
export const Banner: ComponentConfig<BannerProps> = {
  fields: {
    kind: {
      type: "radio",
      label: "Type",
      options: [
        { value: "strip", label: "Text strip" },
        { value: "image", label: "Image" },
      ],
    },
    text: { type: "text", label: "Text" },
    imageUrl: imageField("Banner image"),
    alt: { type: "text", label: "Alt text" },
    linkUrl: { type: "text", label: "Link" },
    strip: {
      type: "object",
      label: "Strip",
      objectFields: {
        color: paletteColorField("Strip color"),
        textColor: paletteColorField("Text color"),
        height: { type: "number", label: "Height", min: 32, max: 160 },
      },
    },
    typography: textOverrideField(),
    ...boxFields,
  },
  defaultProps: {
    kind: "strip",
    text: "Reservations open Friday",
    imageUrl: "",
    alt: "",
    linkUrl: "",
    strip: { color: "#000000", textColor: "#ffffff", height: 64 },
    typography: noOverride,
    ...boxDefaults(0, 16, 0),
  },
  // Only show the fields that apply to the chosen type.
  resolveFields: (data, { fields }) => {
    const isImage = data.props.kind === "image";
    return {
      ...fields,
      text: { ...fields.text, visible: !isImage },
      strip: { ...fields.strip, visible: !isImage },
      typography: { ...fields.typography, visible: !isImage },
      imageUrl: { ...fields.imageUrl, visible: isImage },
      alt: { ...fields.alt, visible: isImage },
    };
  },
  render: ({ kind, text, imageUrl, alt, linkUrl, strip, typography, puck, box }) => {
    const href = safeHref(linkUrl);

    if (kind === "image") {
      const src = safeImageSrc(imageUrl);
      if (!src) {
        // Only the editor shows a placeholder; the sent email leaves it out.
        if (!puck.isEditing) return <></>;
        return (
          <Box {...box}>
            <div
              style={{
                height: PLACEHOLDER_HEIGHT,
                background: "#f4f4f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ margin: 0, color: "#71717a" }}>Add a banner image in the right panel</Text>
            </div>
          </Box>
        );
      }
      const image = (
        <Img src={src} alt={alt} width="100%" style={{ display: "block", width: "100%", height: "auto" }} />
      );
      return <Box {...box}>{href ? <Link href={href}>{image}</Link> : image}</Box>;
    }

    // Text strip: center the line vertically within the chosen height.
    const base = { ...styleOf(puck).text.normal, bold: true, color: colorOr(strip?.textColor, "#ffffff") };
    const css = { ...textCss(applyOverride(base, typography)), margin: 0, textAlign: "center" as const };
    const height = Math.max(32, Math.min(160, Number(strip?.height) || 64));
    return (
      <Box {...box}>
        <Cell
          background={colorOr(strip?.color, "#000000")}
          style={{ height, padding: "0 24px", textAlign: "center", verticalAlign: "middle" }}
        >
          {href ? (
            <Link href={href} style={css}>
              {text}
            </Link>
          ) : (
            <Text style={css}>{text}</Text>
          )}
        </Cell>
      </Box>
    );
  },
};
