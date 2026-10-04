import type { ComponentConfig } from "@puckeditor/core";
import { Fragment } from "react";
import { Link, Text } from "@react-email/components";
import { applyOverride, noOverride, textCss, type TextOverride } from "@/email/theme";
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

export type FooterProps = BoxProps & {
  note: string;
  address: string;
  unsubscribeText: string;
  align: Align;
  typography: TextOverride;
};

// The bottom of a marketing email: why they're getting it, the business
// address (US law requires one), and an unsubscribe link. When the email goes
// to a list, the link is each reader's own unsubscribe link, handled by
// Resend; the renderer passes it in as puck.metadata.unsubscribeUrl.
export const Footer: ComponentConfig<FooterProps> = {
  fields: {
    note: { type: "textarea", label: "Note" },
    address: { type: "textarea", label: "Business address" },
    unsubscribeText: { type: "text", label: "Unsubscribe text" },
    align: alignField,
    typography: textOverrideField(),
    ...boxFields,
  },
  defaultProps: {
    note: "You're receiving this because you joined our list.",
    address: "Your Business · 123 Main Street · City, ST 00000",
    unsubscribeText: "Unsubscribe",
    align: "center",
    typography: noOverride,
    ...boxDefaults(32, 24),
  },
  render: ({ note, address, unsubscribeText, align, typography, puck, box }) => {
    const css = { ...textCss(applyOverride(styleOf(puck).text.caption, typography)), lineHeight: 1.6, margin: 0 };
    const unsubscribeUrl = typeof puck.metadata.unsubscribeUrl === "string" ? puck.metadata.unsubscribeUrl : undefined;
    const lines = (text: string) =>
      text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ));
    return (
      <Box {...box}>
        <div style={{ textAlign: align }}>
          {note && <Text style={css}>{lines(note)}</Text>}
          {address && <Text style={{ ...css, marginTop: note ? 8 : 0 }}>{lines(address)}</Text>}
          <Text style={{ ...css, marginTop: 8 }}>
            {/* Test sends to one address have no personal link, so it goes nowhere. */}
            <Link href={unsubscribeUrl ?? "#"} style={{ ...css, textDecoration: "underline" }}>
              {unsubscribeText || "Unsubscribe"}
            </Link>
          </Text>
          {puck.isEditing && (
            <Text style={{ ...css, marginTop: 4, fontStyle: "italic", opacity: 0.6 }}>
              The unsubscribe link works when you send to a list.
            </Text>
          )}
        </div>
      </Box>
    );
  },
};
