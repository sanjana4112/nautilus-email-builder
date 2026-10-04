"use client";

import { useMemo, useState } from "react";
import { Puck, type Plugin, type Viewport } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import type { EmailData } from "@/email/render";
import { defaultPage, defaultStyle, EMAIL_WIDTH, resolveStyle } from "@/email/theme";
import { FieldGroup } from "./field-group";
import { PreviewPanel } from "./preview";
import { editorConfig } from "./puck-config";
import { SendPanel } from "./send-panel";
import { StylePanel } from "./style-panel";

const emptyEmail: EmailData = {
  content: [],
  root: { props: { title: "", subject: "", ...defaultPage, style: defaultStyle } },
};

// Defined once, outside the component: Puck rebuilds its internal state
// whenever these objects change identity.
const overrides = {
  headerActions: () => (
    <>
      <PreviewPanel />
      <SendPanel />
    </>
  ),
  // Grouped fields become collapsible sections in the right tab.
  fieldTypes: { object: FieldGroup },
};

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

// Canvas widths. "Email" (the default) is the 600px email filling the canvas;
// "Inbox" shows it centered in a wide pane, the way Gmail displays it; Tablet
// and Mobile show phone-sized wrapping (Columns stack on Mobile).
const viewports: Viewport[] = [
  { width: EMAIL_WIDTH, label: "Email", icon: <EnvelopeIcon /> },
  { width: 1000, label: "Inbox", icon: <InboxIcon /> },
  { width: 768, label: "Tablet", icon: "Tablet" },
  { width: 375, label: "Mobile", icon: "Smartphone" },
];

// Start on the Email view; otherwise Puck picks the width closest to the
// browser window, which would usually be Inbox.
const initialUi = {
  viewports: { current: { width: EMAIL_WIDTH, height: "auto" as const }, controlsVisible: true, options: viewports },
};

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
      ui={initialUi}
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

function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
