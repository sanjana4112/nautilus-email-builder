import type { Config } from "@puckeditor/core";
import { createElement } from "react";
import { EmailFrame } from "@/email/frame";
import { LIMITS, resolvePage, type EmailStyle } from "@/email/theme";
import { BodyCopy, type BodyCopyProps } from "./basic/body-copy";
import { Button, type ButtonProps } from "./basic/button";
import { Heading, type HeadingProps } from "./basic/heading";
import { ImageBlock, type ImageProps } from "./basic/image";
import { Navigation, type NavigationProps } from "./basic/navigation";
import { Quote, type QuoteProps } from "./basic/quote";
import { SocialLinks, type SocialLinksProps } from "./basic/social-links";
import { Title, type TitleProps } from "./basic/title";
import { paletteColorField } from "./shared";

// Every block's props, keyed by the name Puck stores in the saved data.
export type BlockProps = {
  Title: TitleProps;
  Navigation: NavigationProps;
  Image: ImageProps;
  Heading: HeadingProps;
  BodyCopy: BodyCopyProps;
  Quote: QuoteProps;
  Button: ButtonProps;
  SocialLinks: SocialLinksProps;
};

// Settings for the whole email ("Page" in Puck's sidebar). `title` is Puck's
// own field, shown in the editor header; `subject` is the email's subject line;
// background and contentWidth only affect this email. `style` is the brand
// look from the Style tab, so it has no sidebar field here.
export type EmailRootProps = {
  title: string;
  subject: string;
  background?: string;
  contentWidth?: number;
  style?: EmailStyle;
};

// The full block list as a Puck config. Shared by the editor (browser) and
// the email renderer (server), which is why it lives here and not in editor/.
export const blocksConfig: Config<BlockProps, EmailRootProps> = {
  root: {
    fields: {
      title: { type: "text", label: "Title" },
      subject: { type: "text", label: "Subject" },
      background: paletteColorField("Page background"),
      contentWidth: {
        type: "number",
        label: "Content width",
        min: LIMITS.contentWidth.min,
        max: LIMITS.contentWidth.max,
      },
    },
    // Draws the canvas inside the same frame as the sent email.
    render: ({ children, ...page }) => createElement(EmailFrame, { page: resolvePage(page) }, children),
  },
  components: {
    Title,
    Navigation,
    Image: ImageBlock,
    Heading,
    BodyCopy,
    Quote,
    Button,
    SocialLinks,
  },
};
