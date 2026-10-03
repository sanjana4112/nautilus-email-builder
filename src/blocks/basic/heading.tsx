import type { ComponentConfig } from "@puckeditor/core";
import { Heading as EmailHeading } from "@react-email/components";
import { theme } from "@/email/theme";

export type HeadingProps = {
  text: string;
  color: string;
};

// One block = its sidebar fields plus its React Email output. The same render
// runs in the editor canvas and on the server when sending, so they can't drift.
export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: { type: "text", label: "Text" },
    color: { type: "text", label: "Color (hex, e.g. #1a1a1a)" },
  },
  defaultProps: {
    text: "Your heading",
    color: theme.colors.text,
  },
  render: ({ text, color }) => (
    <EmailHeading as="h1" style={{ color, fontFamily: theme.fonts.heading, margin: "0 0 16px" }}>
      {text}
    </EmailHeading>
  ),
};
