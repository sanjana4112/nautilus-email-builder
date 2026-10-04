"use client";

import { useMemo, useState } from "react";
import { Puck, type Plugin, type Viewport } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import type { EmailData } from "@/email/render";
import { defaultPage, defaultStyle, resolveStyle } from "@/email/theme";
import { FieldGroup } from "./field-group";
import { editorConfig } from "./puck-config";
import { LinkDialog } from "./rich-text-menu";
import { ScheduledPanel } from "./scheduled-panel";
import { SendPanel } from "./send-panel";
import { StylePanel } from "./style-panel";

const emptyEmail: EmailData = {
  content: [],
  root: { props: { title: "", subject: "", ...defaultPage, style: defaultStyle } },
};

// Defined once, outside the component: Puck rebuilds its internal state
// whenever these objects change identity.
const overrides = {
  headerActions: () => <SendPanel />,
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
  {
    name: "scheduled",
    label: "Scheduled",
    icon: <ClockIcon />,
    render: () => <ScheduledPanel />,
  },
];

// Canvas widths: the screens an email is read on. The canvas draws the same
// HTML the email sends, so each view matches what that reader sees.
const DESKTOP_WIDTH = 1000;
const viewports: Viewport[] = [
  { width: DESKTOP_WIDTH, label: "Desktop", icon: "Monitor" },
  { width: 768, label: "Tablet", icon: "Tablet" },
  { width: 375, label: "Mobile", icon: "Smartphone" },
];

// Start on Desktop; otherwise Puck picks the width closest to the browser window.
const initialUi = {
  viewports: { current: { width: DESKTOP_WIDTH, height: "auto" as const }, controlsVisible: true, options: viewports },
};

export function Editor() {
  // The saved style, kept here so Puck can hand it to every block as metadata.
  const [rawStyle, setRawStyle] = useState<unknown>(emptyEmail.root.props?.style);
  const metadata = useMemo(() => ({ style: resolveStyle(rawStyle) }), [rawStyle]);

  return (
    <>
      <LinkDialog />
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
    </>
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

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
