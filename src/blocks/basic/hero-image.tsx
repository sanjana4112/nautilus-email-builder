import type { ComponentConfig } from "@puckeditor/core";
import { Img, Link, Section, Text } from "@react-email/components";
import { safeHref, safeImageSrc } from "../shared";

export type HeroImageProps = {
  imageUrl: string;
  alt: string;
  linkUrl: string;
};

// A full-width image. Optional link makes the whole image clickable.
export const HeroImage: ComponentConfig<HeroImageProps> = {
  label: "Hero image",
  fields: {
    imageUrl: { type: "text", label: "Image URL (https)" },
    alt: { type: "text", label: "Alt text (shown if images are off)" },
    linkUrl: { type: "text", label: "Link (optional)" },
  },
  defaultProps: {
    imageUrl: "",
    alt: "Hero image",
    linkUrl: "",
  },
  render: ({ imageUrl, alt, linkUrl, puck }) => {
    const src = safeImageSrc(imageUrl);
    if (!src) {
      // Only the editor shows a hint; the sent email just leaves it out.
      return puck.isEditing ? (
        <Section style={{ background: "#f4f4f5", padding: "48px 16px", textAlign: "center" }}>
          <Text style={{ margin: 0, color: "#71717a" }}>Add an https image URL in the right panel</Text>
        </Section>
      ) : (
        <></>
      );
    }
    const image = <Img src={src} alt={alt} width="100%" style={{ display: "block", width: "100%", height: "auto" }} />;
    const href = safeHref(linkUrl);
    return <Section style={{ padding: "0 0 16px" }}>{href ? <Link href={href}>{image}</Link> : image}</Section>;
  },
};
