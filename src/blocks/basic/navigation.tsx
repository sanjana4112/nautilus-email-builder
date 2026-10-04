import type { ComponentConfig } from "@puckeditor/core";
import { Link, Section } from "@react-email/components";
import { textCss } from "@/email/theme";
import { alignField, safeHref, styleOf, type Align } from "../shared";

export type NavigationProps = {
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
  },
  defaultProps: {
    links: [
      { label: "Shop", url: "https://example.com/shop" },
      { label: "Events", url: "https://example.com/events" },
      { label: "About", url: "https://example.com/about" },
    ],
    align: "center",
  },
  render: ({ links, align, puck }) => {
    const items = (links ?? []).flatMap(({ label, url }) => {
      const href = safeHref(url);
      return href && label ? [{ label, href }] : [];
    });
    if (items.length === 0) return <></>;
    const normal = styleOf(puck).text.normal;
    return (
      <Section style={{ textAlign: align, padding: "8px 0" }}>
        {items.map(({ label, href }, i) => (
          <Link key={i} href={href} style={{ ...textCss(normal), display: "inline-block", padding: "0 12px" }}>
            {label}
          </Link>
        ))}
      </Section>
    );
  },
};
