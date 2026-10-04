import type { ComponentConfig } from "@puckeditor/core";
import { Fragment } from "react";
import { Text } from "@react-email/components";
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
    typography: textOverrideField(),
    ...boxFields,
  },
  defaultProps: {
    text: "Write your message here.",
    textStyle: "normal",
    align: "left",
    typography: noOverride,
    ...boxDefaults(0, 16),
  },
  render: ({ text, textStyle, align, typography, puck, spaceAbove, spaceBelow, background }) => {
    const style = styleOf(puck).text[textStyle] ?? styleOf(puck).text.normal;
    // <br> instead of CSS white-space, which some inboxes ignore.
    const lines = (text ?? "").split("\n");
    return (
      <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
        <Text style={{ ...textCss(applyOverride(style, typography)), lineHeight: 1.5, textAlign: align, margin: 0 }}>
          {lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </Text>
      </Box>
    );
  },
};
