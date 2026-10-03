"use client";

import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { blocksConfig } from "@/blocks";
import type { EmailData } from "@/email/render";

const emptyEmail: EmailData = { content: [], root: { props: {} } };

// Sends the design (not HTML) to the server, which renders and sends it.
async function sendEmail(data: EmailData) {
  try {
    const response = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) return alert("Email sent!");
    // A crashed server replies with an HTML error page, not JSON, so parsing can fail.
    const result: { error?: string } | null = await response.json().catch(() => null);
    alert(`Could not send: ${result?.error ?? `server error (${response.status})`}`);
  } catch {
    alert("Could not reach the server. Check that it is running.");
  }
}

export function Editor() {
  return <Puck config={blocksConfig} data={emptyEmail} onPublish={sendEmail} />;
}
