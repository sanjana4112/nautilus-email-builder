import type { Config } from "@puckeditor/core";
import { createElement } from "react";
import { EmailFrame } from "@/email/frame";
import { resolveStyle, type EmailStyle } from "@/email/theme";
import { Heading, type HeadingProps } from "./basic/heading";

// Every block's props, keyed by the name Puck stores in the saved data.
export type BlockProps = {
  Heading: HeadingProps;
};

// Settings for the whole email ("Page" in Puck's sidebar). `title` is Puck's
// own field, shown in the editor header; `subject` is the email's subject line.
// `style` is edited in the Style tab, so it has no sidebar field here.
export type EmailRootProps = {
  title: string;
  subject: string;
  style?: EmailStyle;
};

// The full block list as a Puck config. Shared by the editor (browser) and
// the email renderer (server), which is why it lives here and not in editor/.
export const blocksConfig: Config<BlockProps, EmailRootProps> = {
  root: {
    fields: {
      title: { type: "text", label: "Title" },
      subject: { type: "text", label: "Subject" },
    },
    // Draws the canvas inside the same frame as the sent email.
    render: ({ children, style }) => createElement(EmailFrame, { style: resolveStyle(style) }, children),
  },
  components: {
    Heading,
  },
};
