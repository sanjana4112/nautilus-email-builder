import type { ComponentConfig } from "@puckeditor/core";
import { Link } from "@react-email/components";
import { applyOverride, noOverride, textCss, type TextOverride } from "@/email/theme";
import {
  Box,
  boxDefaults,
  boxFields,
  colorOr,
  paletteColorField,
  safeHref,
  styleOf,
  textOverrideField,
  type BoxProps,
} from "../shared";

type NavLook = "plain" | "separators" | "boxes" | "bar";

export type NavigationProps = BoxProps & {
  links: { label: string; url: string; boxColor: string; typography: TextOverride }[];
  look: NavLook;
  separatorColor: string;
  barColor: string;
  linkSpacing: number;
  typography: TextOverride;
};

const DEFAULT_BOX = "#f4f4f5";

// A row of links spread evenly across the full width. Each link can have its
// own box color and text settings; the block's Text settings apply to all.
export const Navigation: ComponentConfig<NavigationProps> = {
  fields: {
    links: {
      type: "array",
      label: "Links",
      arrayFields: {
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "URL (https:// or mailto:)" },
        boxColor: paletteColorField("Box color (Boxes look)", { allowNone: true, noneLabel: "Default box" }),
        typography: textOverrideField("Text (this link only)"),
      },
      defaultItemProps: { label: "Link", url: "https://", boxColor: "", typography: noOverride },
      getItemSummary: (item) => item.label || "Link",
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
    barColor: paletteColorField("Bar color"),
    linkSpacing: { type: "number", label: "Link spacing (px)", min: 0, max: 48 },
    typography: textOverrideField("Text (all links)"),
    ...boxFields,
  },
  defaultProps: {
    links: [
      { label: "Menu", url: "https://example.com/menu", boxColor: "", typography: noOverride },
      { label: "Reservations", url: "https://example.com/reservations", boxColor: "", typography: noOverride },
      { label: "Private events", url: "https://example.com/private-events", boxColor: "", typography: noOverride },
    ],
    look: "plain",
    separatorColor: "#000000",
    barColor: "#000000",
    linkSpacing: 8,
    typography: noOverride,
    ...boxDefaults(8, 8),
  },
  render: ({
    links,
    look,
    separatorColor,
    barColor,
    linkSpacing,
    typography,
    puck,
    spaceAbove,
    spaceBelow,
    background,
  }) => {
    const items = (links ?? []).flatMap((link) => {
      const href = safeHref(link.url);
      return href && link.label ? [{ ...link, href }] : [];
    });
    if (items.length === 0) return <></>;

    const allLinks = applyOverride(styleOf(puck).text.normal, typography);
    const gap = Math.max(0, Math.min(48, Number(linkSpacing) || 0));
    return (
      <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={{
            width: "100%",
            tableLayout: "fixed",
            backgroundColor: look === "bar" ? colorOr(barColor, "#000000") : undefined,
          }}
        >
          <tbody>
            <tr>
              {items.map((link, i) => (
                <td
                  key={i}
                  width={`${100 / items.length}%`}
                  style={{
                    padding: `0 ${gap / 2}px`,
                    textAlign: "center",
                    verticalAlign: "middle",
                    borderLeft:
                      look === "separators" && i > 0 ? `1px solid ${colorOr(separatorColor, "#000000")}` : undefined,
                  }}
                >
                  <Link
                    href={link.href}
                    style={{
                      ...textCss(applyOverride(allLinks, link.typography)),
                      display: "block",
                      padding: "10px 4px",
                      backgroundColor: look === "boxes" ? colorOr(link.boxColor, DEFAULT_BOX) : undefined,
                    }}
                  >
                    {link.label}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Box>
    );
  },
};
