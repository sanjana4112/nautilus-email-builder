import type { ComponentConfig } from "@puckeditor/core";
import { Fragment } from "react";
import { Text } from "@react-email/components";
import { textCss, TEXT_STYLE_LABELS } from "@/email/theme";
import { alignField, styleOf, type Align } from "../shared";

const BODY_STYLES = ["normal", "caption"] as const;

export type BodyCopyProps = {
  text: string;
  textStyle: (typeof BODY_STYLES)[number];
  align: Align;
};

// A paragraph of text. Line breaks typed in the editor are kept.
export const BodyCopy: ComponentConfig<BodyCopyProps> = {
  label: "Body copy",
  fields: {
    text: { type: "textarea", label: "Text" },
    textStyle: {
      type: "select",
      label: "Text style",
      options: BODY_STYLES.map((value) => ({ value, label: TEXT_STYLE_LABELS[value] })),
    },
    align: alignField,
  },
  defaultProps: {
    text: "Write your message here.",
    textStyle: "normal",
    align: "left",
  },
  render: ({ text, textStyle, align, puck }) => {
    const style = styleOf(puck).text[textStyle] ?? styleOf(puck).text.normal;
    // <br> instead of CSS white-space, which some inboxes ignore.
    const lines = (text ?? "").split("\n");
    return (
      <Text style={{ ...textCss(style), lineHeight: 1.5, textAlign: align, margin: "0 0 16px" }}>
        {lines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </Text>
    );
  },
};
