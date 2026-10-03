import type { Config } from "@puckeditor/core";
import { Heading, type HeadingProps } from "./basic/heading";

// Every block's props, keyed by the name Puck stores in the saved data.
export type BlockProps = {
  Heading: HeadingProps;
};

// Settings for the whole email ("Page" in Puck's sidebar). `title` is Puck's
// own field, shown in the editor header; `subject` is the email's subject line.
export type EmailRootProps = {
  title: string;
  subject: string;
};

// The full block list as a Puck config. Shared by the editor (browser) and
// the email renderer (server), which is why it lives here and not in editor/.
export const blocksConfig: Config<BlockProps, EmailRootProps> = {
  root: {
    fields: {
      title: { type: "text", label: "Title" },
      subject: { type: "text", label: "Subject" },
    },
  },
  components: {
    Heading,
  },
};
