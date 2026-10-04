import type { ComponentConfig } from "@puckeditor/core";
import { Link } from "@react-email/components";
import { textCss } from "@/email/theme";
import { alignField, Box, boxDefaults, boxFields, safeHref, styleOf, type Align, type BoxProps } from "../shared";

export type NavigationProps = BoxProps & {
  links: { label: string; url: string }[];
  align: Align;
};

// A row of text links, e.g. Shop · Events · About. Links without a safe URL are skipped.
export const Navigation: ComponentConfig<NavigationProps> = {
  fields: {
    links: {
      type: "array",
      label: "Links",
      arrayFields: {
        label: { type: "text", label: "Label" },
        url: { type: "text", label: "URL (https:// or mailto:)" },
      },
      defaultItemProps: { label: "Link", url: "https://" },
      getItemSummary: (item) => item.label || "Link",
    },
    align: alignField,
    ...boxFields,
  },
  defaultProps: {
    links: [
      { label: "Shop", url: "https://example.com/shop" },
      { label: "Events", url: "https://example.com/events" },
      { label: "About", url: "https://example.com/about" },
    ],
    align: "center",
    ...boxDefaults(8, 8),
  },
  render: ({ links, align, puck, spaceAbove, spaceBelow, background }) => {
    const items = (links ?? []).flatMap(({ label, url }) => {
      const href = safeHref(url);
      return href && label ? [{ label, href }] : [];
    });
    if (items.length === 0) return <></>;
    const normal = styleOf(puck).text.normal;
    return (
      <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
        <div style={{ textAlign: align }}>
          {items.map(({ label, href }, i) => (
            <Link key={i} href={href} style={{ ...textCss(normal), display: "inline-block", padding: "0 12px" }}>
              {label}
            </Link>
          ))}
        </div>
      </Box>
    );
  },
};
