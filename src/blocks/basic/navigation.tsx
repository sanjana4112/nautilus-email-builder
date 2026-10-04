import type { ComponentConfig } from "@puckeditor/core";
import { Fragment } from "react";
import { Link } from "@react-email/components";
import { applyOverride, noOverride, textCss, type TextOverride } from "@/email/theme";
import {
  Box,
  boxDefaults,
  boxFields,
  colorOr,
  fillOr,
  paletteColorField,
  safeHref,
  styleOf,
  textOverrideField,
  type BoxProps,
} from "../shared";

type NavLook = "plain" | "separators" | "boxes" | "bar";

type NavStyle = {
  arrangement: "spread" | "grouped";
  look: NavLook;
  separatorColor: string;
  barColor: string;
  linkSpacing: number;
};

export type NavigationProps = BoxProps & {
  links: { label: string; url: string; boxColor: string; linkColor: string }[];
  style: NavStyle;
  typography: TextOverride;
};

const DEFAULT_BOX = "#f4f4f5";
const defaultNavStyle: NavStyle = {
  arrangement: "spread",
  look: "plain",
  separatorColor: "#000000",
  barColor: "#000000",
  linkSpacing: 24,
};

// A row of links spread evenly across the full width. Each link can have its
// own box and link color; Typography applies to all links.
export const Navigation: ComponentConfig<NavigationProps> = {
  fields: {
    links: {
      type: "array",
      label: "Links",
      arrayFields: {
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "Link" },
        boxColor: paletteColorField("Box color", { allowNone: true, noneLabel: "Default box" }),
        linkColor: paletteColorField("Link color", { allowNone: true, noneLabel: "Default color" }),
      },
      defaultItemProps: { label: "Link", url: "https://", boxColor: "", linkColor: "" },
      getItemSummary: (item) => item.label || "Link",
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        arrangement: {
          type: "radio",
          label: "Arrangement",
          options: [
            { value: "spread", label: "Spread across width" },
            { value: "grouped", label: "Grouped in center" },
          ],
        },
        look: {
          type: "select",
          label: "Look",
          options: [
            { value: "plain", label: "Plain links" },
            { value: "separators", label: "Separator bars" },
            { value: "boxes", label: "Colored box per link" },
            { value: "bar", label: "One solid bar" },
          ],
        },
        separatorColor: paletteColorField("Separator color"),
        barColor: paletteColorField("Bar color", { allowNone: true }),
        linkSpacing: { type: "number", label: "Link spacing", min: 0, max: 48 },
      },
    },
    typography: textOverrideField(),
    ...boxFields,
  },
  defaultProps: {
    links: [
      { label: "Menu", url: "https://example.com/menu", boxColor: "", linkColor: "" },
      { label: "Reservations", url: "https://example.com/reservations", boxColor: "", linkColor: "" },
      { label: "Private events", url: "https://example.com/private-events", boxColor: "", linkColor: "" },
    ],
    style: defaultNavStyle,
    typography: noOverride,
    ...boxDefaults(8, 8),
  },
  render: ({ links, style, typography, puck, box }) => {
    const { arrangement, look, separatorColor, barColor, linkSpacing } = { ...defaultNavStyle, ...style };
    const spread = arrangement !== "grouped";
    const items = (links ?? []).flatMap((link) => {
      const href = safeHref(link.url);
      return href && link.label ? [{ ...link, href }] : [];
    });
    if (items.length === 0) return <></>;

    const allLinks = applyOverride(styleOf(puck).text.normal, typography);
    const gap = Math.max(0, Math.min(48, Number(linkSpacing) || 0));
    return (
      // The solid bar is the block's own background, so it runs edge to edge.
      <Box {...box} background={look === "bar" ? (fillOr(barColor, "#000000") ?? "") : box?.background}>
        {/* Spread: equal slots across the full width. Grouped: links sit
            together in the center, with Link spacing between them. */}
        <table
          role="presentation"
          align="center"
          width={spread ? "100%" : undefined}
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={spread ? { width: "100%", tableLayout: "fixed" } : { margin: "0 auto" }}
        >
          <tbody>
            <tr>
              {items.map((link, i) => (
                <Fragment key={i}>
                  {look === "separators" && i > 0 && (
                    // A short line floating between links, about the height of the text.
                    <td width="1" style={{ width: 1, padding: 0, verticalAlign: "middle" }}>
                      <div
                        style={{
                          width: 1,
                          height: Math.round(allLinks.size * 1.1),
                          backgroundColor: colorOr(separatorColor, "#000000"),
                        }}
                      />
                    </td>
                  )}
                  <td
                    width={spread ? `${100 / items.length}%` : undefined}
                    style={{ padding: `0 ${gap / 2}px`, textAlign: "center", verticalAlign: "middle" }}
                  >
                    <Link
                      href={link.href}
                      style={{
                        ...textCss({ ...allLinks, color: colorOr(link.linkColor, allLinks.color) }),
                        display: "block",
                        lineHeight: 1.4,
                        // Boxes and the solid bar need room around the text for their color.
                        padding: look === "boxes" || look === "bar" ? "8px 4px" : "2px 4px",
                        backgroundColor: look === "boxes" ? colorOr(link.boxColor, DEFAULT_BOX) : undefined,
                      }}
                    >
                      {link.label}
                    </Link>
                  </td>
                </Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </Box>
    );
  },
};
