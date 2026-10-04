import type { ComponentConfig } from "@puckeditor/core";
import { Img, Link, Text } from "@react-email/components";
import { EMAIL_WIDTH } from "@/email/theme";
import { Box, boxDefaults, boxFields, safeHref, safeImageSrc, type BoxProps } from "../shared";

export type ImageProps = BoxProps & {
  imageUrl: string;
  alt: string;
  linkUrl: string;
};

// Hero-image proportions (2:1) for the editor placeholder.
const PLACEHOLDER_HEIGHT = EMAIL_WIDTH / 2;

// A full-width image that scales to the email width. Optional link makes it clickable.
export const ImageBlock: ComponentConfig<ImageProps> = {
  label: "Image",
  fields: {
    imageUrl: { type: "text", label: "Image link" },
    alt: { type: "text", label: "Alt text" },
    linkUrl: { type: "text", label: "Link" },
    ...boxFields,
  },
  defaultProps: {
    imageUrl: "",
    alt: "Image",
    linkUrl: "",
    ...boxDefaults(0, 16, 0),
  },
  render: ({ imageUrl, alt, linkUrl, puck, box }) => {
    const src = safeImageSrc(imageUrl);
    // Only the editor shows a placeholder; the sent email just leaves it out.
    if (!src && !puck.isEditing) return <></>;
    const image = src ? (
      <Img src={src} alt={alt} width="100%" style={{ display: "block", width: "100%", height: "auto" }} />
    ) : (
      <div
        style={{
          height: PLACEHOLDER_HEIGHT,
          background: "#f4f4f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ margin: 0, color: "#71717a" }}>Add an image link in the right panel</Text>
      </div>
    );
    const href = safeHref(linkUrl);
    return <Box {...box}>{href && src ? <Link href={href}>{image}</Link> : image}</Box>;
  },
};
