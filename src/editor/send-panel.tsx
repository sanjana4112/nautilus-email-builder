"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button, createUsePuck, useGetPuck } from "@puckeditor/core";
import type { blocksConfig } from "@/blocks";
import type { EmailData } from "@/email/render";

const usePuck = createUsePuck<typeof blocksConfig>();

// Replaces Puck's Publish button: opens a popup that shows the subject and
// asks for one recipient, then sends the current design to /api/send.
export function SendPanel() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const subject = usePuck((s) => s.appState.data.root.props?.subject?.trim() ?? "");
  const getPuck = useGetPuck();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  function open() {
    setStatus("");
    dialogRef.current?.showModal();
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const to = new FormData(event.currentTarget).get("to");
    const data = getPuck().appState.data as EmailData;

    setSending(true);
    setStatus("Sending...");
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, data }),
      });
      // A crashed server replies with an HTML error page, not JSON, so parsing can fail.
      const result: { error?: string } | null = await response.json().catch(() => null);
      setStatus(response.ok ? "Sent!" : `Could not send: ${result?.error ?? `server error (${response.status})`}`);
    } catch {
      setStatus("Could not reach the server. Check that it is running.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button onClick={open}>Send</Button>
      <dialog ref={dialogRef} className="m-auto w-96 rounded-lg p-6 shadow-xl backdrop:bg-black/40">
        <form onSubmit={send} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Send email</h2>
          <p className="text-sm">
            <span className="text-zinc-500">Subject: </span>
            {subject || <span className="text-red-600">Add a subject in Page settings first</span>}
          </p>
          <label className="flex flex-col gap-1 text-sm">
            To
            <input
              name="to"
              type="email"
              required
              autoFocus
              placeholder="name@example.com"
              className="rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          {status && <p className="text-sm">{status}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" disabled={!subject || sending} loading={sending}>
              Send
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
