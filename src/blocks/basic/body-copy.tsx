import type { ComponentConfig } from "@puckeditor/core";
import type { ReactNode } from "react";
import { richTextToEmailHtml } from "@/email/rich-text";
import { applyOverride, noOverride, textCss, TEXT_STYLE_LABELS, type TextOverride } from "@/email/theme";
import {
  alignField,
  Box,
  boxDefaults,
  boxFields,
  styleOf,
  textOverrideField,
  type Align,
  type BoxProps,
} from "../shared";

const BODY_STYLES = ["normal", "caption"] as const;

export type BodyCopyProps = BoxProps & {
  text: string;
  textStyle: (typeof BODY_STYLES)[number];
  align: Align;
  typography: TextOverride;
};

// Rich text formatting kept for email: bold, italic, underline, and links.
// Headings, lists, and the rest are off: the Heading block and Style tab
// cover those, and they're less reliable in inboxes. The toolbar (with the
// Link button and Ctrl/Cmd-K) is added in editor/puck-config.tsx.
export const EMAIL_RICH_TEXT_OPTIONS = {
  heading: false,
  bulletList: false,
  orderedList: false,
  listItem: false,
  listKeymap: false,
  blockquote: false,
  code: false,
  codeBlock: false,
  horizontalRule: false,
  strike: false,
  textAlign: false,
  // Clicking a link while editing should place the cursor, not open the page.
  link: { openOnClick: false, autolink: false, linkOnPaste: true },
} as const;

// Paragraphs of text with bold, italic, underline, and links. Edit it on the
// canvas or in the right tab.
export const BodyCopy: ComponentConfig<BodyCopyProps> = {
  label: "Body copy",
  fields: {
    text: { type: "richtext", label: "Text", contentEditable: true, options: EMAIL_RICH_TEXT_OPTIONS },
    textStyle: {
      type: "select",
      label: "Text style",
      options: BODY_STYLES.map((value) => ({ value, label: TEXT_STYLE_LABELS[value] })),
    },
    align: alignField,
    typography: textOverrideField(),
    ...boxFields,
  },
  defaultProps: {
    text: "<p>Write your message here.</p>",
    textStyle: "normal",
    align: "left",
    typography: noOverride,
    ...boxDefaults(0, 16),
  },
  render: ({ text, textStyle, align, typography, puck, box }) => {
    const base = styleOf(puck).text[textStyle] ?? styleOf(puck).text.normal;
    const css = textCss(applyOverride(base, typography));
    // Links: the paragraph's color, underlined (the email norm).
    const linkStyle = `${css.color ? `color:${css.color};` : ""}text-decoration:underline`;
    return (
      <Box {...box}>
        {/* On the canvas Puck passes a live editor; when sending, the saved HTML,
            which is cleaned to an email-safe allowlist first. */}
        <div className="eb-rich" style={{ ...css, lineHeight: 1.5, textAlign: align }}>
          {typeof text === "string" ? (
            <div dangerouslySetInnerHTML={{ __html: richTextToEmailHtml(text, linkStyle) }} />
          ) : (
            (text as ReactNode)
          )}
        </div>
      </Box>
    );
  },
};
