"use client";

import { useMemo, useState } from "react";
import { Puck, type Plugin } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import type { EmailData } from "@/email/render";
import { defaultPage, defaultStyle, EMAIL_WIDTH, resolveStyle } from "@/email/theme";
import { editorConfig } from "./puck-config";
import { SendPanel } from "./send-panel";
import { StylePanel } from "./style-panel";

const emptyEmail: EmailData = {
  content: [],
  root: { props: { title: "", subject: "", ...defaultPage, style: defaultStyle } },
};

// Defined once, outside the component: Puck rebuilds its internal state
// whenever these objects change identity.
const overrides = { headerActions: () => <SendPanel /> };

// Puck always adds its own "Blocks" and "Outline" tabs. A plugin with the
// same name replaces a built-in one, so naming ours "outline" swaps the
// Outline tab for Style in the same spot.
const plugins: Plugin[] = [
  {
    name: "outline",
    label: "Style",
    icon: <PaletteIcon />,
    render: () => <StylePanel />,
  },
];

// Preview widths: a standard 600px email and a typical phone. Puck zooms the
// canvas so the chosen width fills the editor.
const viewports = [
  { width: EMAIL_WIDTH, label: "Desktop", icon: "Monitor" as const },
  { width: 375, label: "Mobile", icon: "Smartphone" as const },
];

export function Editor() {
  // The saved style, kept here so Puck can hand it to every block as metadata.
  const [rawStyle, setRawStyle] = useState<unknown>(emptyEmail.root.props?.style);
  const metadata = useMemo(() => ({ style: resolveStyle(rawStyle) }), [rawStyle]);

  return (
    <Puck
      config={editorConfig}
      data={emptyEmail}
      plugins={plugins}
      viewports={viewports}
      overrides={overrides}
      metadata={metadata}
      // Only the style reference matters here; React skips the update when it hasn't changed.
      onChange={(data) => setRawStyle(data.root.props?.style)}
    />
  );
}

function PaletteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}
