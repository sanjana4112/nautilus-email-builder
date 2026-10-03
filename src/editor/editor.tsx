"use client";

import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { blocksConfig } from "@/blocks";
import type { EmailData } from "@/email/render";
import { SendPanel } from "./send-panel";

const emptyEmail: EmailData = { content: [], root: { props: { title: "", subject: "" } } };

export function Editor() {
  return (
    <Puck
      config={blocksConfig}
      data={emptyEmail}
      // Swap Puck's Publish button for our Send button and popup.
      overrides={{ headerActions: () => <SendPanel /> }}
    />
  );
}
