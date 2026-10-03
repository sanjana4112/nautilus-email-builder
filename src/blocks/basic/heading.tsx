import type { ComponentConfig } from "@puckeditor/core";
import { Heading as EmailHeading } from "@react-email/components";
import { resolveStyle, textCss, TEXT_STYLE_LABELS } from "@/email/theme";

const HEADING_STYLES = ["title", "heading1", "heading2", "subtitle"] as const;
type HeadingStyle = (typeof HEADING_STYLES)[number];

// Which HTML tag each style uses, for screen readers and email clients.
const TAGS = { title: "h1", heading1: "h1", heading2: "h2", subtitle: "h3" } as const;

export type HeadingProps = {
  text: string;
  textStyle: HeadingStyle;
};

// One block = its sidebar fields plus its React Email output. The same render
// runs in the editor canvas and on the server when sending, so they can't drift.
// Its look comes from the Style tab, which Puck passes in as metadata.
export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: { type: "text", label: "Text" },
    textStyle: {
      type: "select",
      label: "Text style",
      options: HEADING_STYLES.map((value) => ({ value, label: TEXT_STYLE_LABELS[value] })),
    },
  },
  defaultProps: {
    text: "Your heading",
    textStyle: "heading1",
  },
  render: ({ text, textStyle, puck }) => {
    const style = resolveStyle(puck.metadata.style).text[textStyle] ?? resolveStyle(null).text.heading1;
    return (
      <EmailHeading as={TAGS[textStyle] ?? "h1"} style={{ ...textCss(style), lineHeight: 1.25, margin: "0 0 16px" }}>
        {text}
      </EmailHeading>
    );
  },
};
