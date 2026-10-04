import type { ComponentConfig } from "@puckeditor/core";
import { Fragment } from "react";
import { Link, Text } from "@react-email/components";
import { textCss } from "@/email/theme";
import { alignField, Box, boxDefaults, boxFields, safeHref, styleOf, type Align, type BoxProps } from "../shared";

// The set list of networks. Shown as text links for now; icons come after
// deploy, since icon images need a public URL inboxes can load.
const NETWORKS = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
} as const;
type Network = keyof typeof NETWORKS;

export type SocialLinksProps = BoxProps & {
  links: { network: Network; url: string }[];
  align: Align;
};

export const SocialLinks: ComponentConfig<SocialLinksProps> = {
  label: "Social links",
  fields: {
    links: {
      type: "array",
      label: "Networks",
      arrayFields: {
        network: {
          type: "select",
          label: "Network",
          options: (Object.keys(NETWORKS) as Network[]).map((value) => ({ value, label: NETWORKS[value] })),
        },
        url: { type: "text", label: "Profile URL" },
      },
      defaultItemProps: { network: "instagram", url: "https://" },
      getItemSummary: (item) => NETWORKS[item.network as Network] ?? "Network",
    },
    align: alignField,
    ...boxFields,
  },
  defaultProps: {
    links: [
      { network: "instagram", url: "https://instagram.com/" },
      { network: "facebook", url: "https://facebook.com/" },
    ],
    align: "center",
    ...boxDefaults(8, 16),
  },
  render: ({ links, align, puck, spaceAbove, spaceBelow, background }) => {
    // Skip unknown networks and missing or unsafe links.
    const items = (links ?? []).flatMap(({ network, url }) => {
      const href = safeHref(url);
      return href && network in NETWORKS ? [{ label: NETWORKS[network], href }] : [];
    });
    if (items.length === 0) return <></>;
    const normal = textCss(styleOf(puck).text.normal);
    return (
      <Box spaceAbove={spaceAbove} spaceBelow={spaceBelow} background={background}>
        <Text style={{ ...normal, textAlign: align, margin: 0 }}>
          {items.map(({ label, href }, i) => (
            <Fragment key={i}>
              {i > 0 && " · "}
              <Link href={href} style={normal}>
                {label}
              </Link>
            </Fragment>
          ))}
        </Text>
      </Box>
    );
  },
};
