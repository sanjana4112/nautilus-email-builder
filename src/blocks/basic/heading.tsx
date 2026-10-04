import type { ComponentConfig } from "@puckeditor/core";
import { Heading as EmailHeading } from "@react-email/components";
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

const HEADING_STYLES = ["title", "heading1", "heading2", "subtitle"] as const;
type HeadingStyle = (typeof HEADING_STYLES)[number];

// Which HTML tag each style uses, for screen readers and email clients.
const TAGS = { title: "h1", heading1: "h1", heading2: "h2", subtitle: "h3" } as const;

export type HeadingProps = BoxProps & {
  text: string;
  textStyle: HeadingStyle;
  align: Align;
  typography: TextOverride;
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
    align: alignField,
    typography: textOverrideField(),
    ...boxFields,
  },
  defaultProps: {
    text: "Your heading",
    textStyle: "heading1",
    align: "left",
    typography: noOverride,
    ...boxDefaults(0, 16),
  },
  render: ({ text, textStyle, align, typography, puck, spaceAbove, spaceBelow, background }) => {
    const { text: styles } = styleOf(puck);
    return (
      <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
        <EmailHeading
          as={TAGS[textStyle] ?? "h1"}
          style={{
            ...textCss(applyOverride(styles[textStyle] ?? styles.heading1, typography)),
            lineHeight: 1.25,
            textAlign: align,
            margin: 0,
          }}
        >
          {text}
        </EmailHeading>
      </Box>
    );
  },
};
