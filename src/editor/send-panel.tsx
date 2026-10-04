"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, createUsePuck, useGetPuck } from "@puckeditor/core";
import type { blocksConfig } from "@/blocks";
import type { EmailData } from "@/email/render";
import { MAX_CSV_BYTES, readContacts, type SkippedRow } from "@/lib/contacts-csv";

const usePuck = createUsePuck<typeof blocksConfig>();

type List = { id: string; name: string };
type Recipients = "one" | "list";
type CsvPreview = { file: File; name: string; contacts: number; skipped: SkippedRow[] };
type ImportState = { state: "idle" } | { state: "working"; message: string } | { state: "error"; message: string };

const POLL_MS = 1500;
const MAX_POLLS = 400; // about 10 minutes

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  // A crashed server replies with an HTML error page, not JSON, so parsing can fail.
  return (await response.json().catch(() => ({ error: `Server error (${response.status})` }))) as T & {
    error?: string;
  };
}

// Replaces Puck's Publish button: a popup that shows the subject and sends
// the current design to one address or to a list (a Resend segment), with a
// way to create a list from a CSV.
export function SendPanel() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const subject = usePuck((s) => s.appState.data.root.props?.subject?.trim() ?? "");
  const getPuck = useGetPuck();
  const [recipients, setRecipients] = useState<Recipients>("one");
  const [lists, setLists] = useState<List[] | null>(null);
  const [listsError, setListsError] = useState("");
  const [listId, setListId] = useState("");
  const [csv, setCsv] = useState<CsvPreview | null>(null);
  const [csvError, setCsvError] = useState("");
  const [importState, setImportState] = useState<ImportState>({ state: "idle" });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const isOpen = useRef(false);

  useEffect(
    () => () => {
      isOpen.current = false; // stops any import polling if the editor goes away
    },
    [],
  );

  async function loadLists() {
    setListsError("");
    try {
      const result = await readJson<{ segments?: List[] }>(await fetch("/api/segments"));
      if (result.error || !result.segments) throw new Error(result.error);
      setLists(result.segments);
    } catch (err) {
      setListsError(err instanceof Error && err.message ? err.message : "Couldn't load your lists.");
    }
  }

  function open() {
    setStatus("");
    isOpen.current = true;
    dialogRef.current?.showModal();
    if (lists === null) void loadLists();
  }

  async function pickCsv(file: File) {
    setCsv(null);
    setCsvError("");
    if (file.size > MAX_CSV_BYTES) return setCsvError("That file is over 5 MB.");
    const { contacts, skipped, error } = readContacts(await file.text());
    if (error) return setCsvError(error);
    if (contacts.length === 0) return setCsvError("No valid email addresses found.");
    setCsv({ file, name: file.name.replace(/\.csv$/i, ""), contacts: contacts.length, skipped });
  }

  async function importCsv() {
    if (!csv) return;
    const form = new FormData();
    form.set("name", csv.name.trim());
    form.set("file", csv.file);
    setImportState({ state: "working", message: "Uploading…" });
    try {
      const created = await readJson<{ segment?: List; importId?: string }>(
        await fetch("/api/segments", { method: "POST", body: form }),
      );
      if (created.error || !created.segment || !created.importId) throw new Error(created.error);

      // Resend imports in the background; check until it's done.
      for (let polls = 0; ; polls++) {
        if (!isOpen.current) return;
        if (polls >= MAX_POLLS) throw new Error("Still importing. Reopen Send in a few minutes to find the list.");
        const progress = await readJson<{
          status?: string;
          counts?: { total: number; created: number; updated: number };
        }>(await fetch(`/api/segments/imports?id=${encodeURIComponent(created.importId)}`));
        if (progress.error) throw new Error(progress.error);
        if (progress.status === "failed") throw new Error("Resend couldn't import this file.");
        const done = (progress.counts?.created ?? 0) + (progress.counts?.updated ?? 0);
        if (progress.status === "completed") break;
        setImportState({ state: "working", message: `Importing… ${done} of ${csv.contacts}` });
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      }

      const segment = created.segment;
      setLists((current) => [...(current ?? []).filter((l) => l.id !== segment.id), segment]);
      setListId(segment.id);
      setCsv(null);
      setImportState({ state: "idle" });
    } catch (err) {
      setImportState({ state: "error", message: err instanceof Error && err.message ? err.message : "Import failed." });
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = getPuck().appState.data as EmailData;
    const list = lists?.find((l) => l.id === listId);
    const target =
      recipients === "one"
        ? { to: new FormData(event.currentTarget).get("to") }
        : { segmentId: listId, listName: list?.name };

    setSending(true);
    setStatus("Sending...");
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, data }),
      });
      const result = await readJson<{ id?: string }>(response);
      setStatus(
        response.ok
          ? recipients === "one"
            ? "Sent!"
            : `Sending to ${list?.name ?? "your list"}.`
          : `Could not send: ${result.error}`,
      );
    } catch {
      setStatus("Could not reach the server. Check that it is running.");
    } finally {
      setSending(false);
    }
  }

  const importing = importState.state === "working";
  const canSend = Boolean(subject) && !sending && !importing && (recipients === "one" || Boolean(listId));

  return (
    <>
      <Button onClick={open}>Send</Button>
      <dialog
        ref={dialogRef}
        onClose={() => (isOpen.current = false)}
        className="m-auto w-[28rem] rounded-lg p-6 shadow-xl backdrop:bg-black/40"
      >
        <form onSubmit={send} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Send email</h2>
          <p className="text-sm">
            <span className="text-zinc-500">Subject: </span>
            {subject || <span className="text-red-600">Add a subject in Page settings first</span>}
          </p>

          <div className="flex rounded-md border border-zinc-200 p-0.5 text-sm" role="radiogroup" aria-label="Send to">
            {(["one", "list"] as const).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={recipients === r}
                onClick={() => setRecipients(r)}
                className={`flex-1 rounded px-3 py-1.5 transition-colors ${recipients === r ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"}`}
              >
                {r === "one" ? "One address" : "A list"}
              </button>
            ))}
          </div>

          {recipients === "one" ? (
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
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <label className="flex flex-col gap-1">
                List
                <select
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  disabled={lists === null}
                  className="rounded border border-zinc-300 bg-white px-3 py-2"
                >
                  <option value="">
                    {lists === null ? "Loading lists…" : lists.length ? "Choose a list" : "No lists yet: add one below"}
                  </option>
                  {lists?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              {listsError && <p className="text-xs text-red-600">{listsError}</p>}

              <details className="rounded border border-zinc-200 px-3 py-2">
                <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                  New list from CSV
                </summary>
                <div className="flex flex-col gap-2 pt-3">
                  <p className="text-xs text-zinc-500">
                    One row per person, with an email column. First and last name columns are optional.
                  </p>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    disabled={importing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void pickCsv(file);
                    }}
                    className="text-xs"
                  />
                  {csvError && <p className="text-xs text-red-600">{csvError}</p>}
                  {csv && (
                    <>
                      <p className="text-xs text-zinc-700">
                        {csv.contacts.toLocaleString()} contacts
                        {csv.skipped.length > 0 && `, ${csv.skipped.length} skipped`}
                      </p>
                      {csv.skipped.length > 0 && (
                        <ul className="max-h-24 overflow-auto text-xs text-amber-700">
                          {csv.skipped.slice(0, 50).map((s) => (
                            <li key={s.line}>
                              Row {s.line}: {s.reason}
                            </li>
                          ))}
                        </ul>
                      )}
                      <label className="flex flex-col gap-1 text-xs">
                        List name
                        <input
                          value={csv.name}
                          onChange={(e) => setCsv({ ...csv, name: e.target.value })}
                          maxLength={100}
                          className="rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </label>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={importing || !csv.name.trim()}
                        loading={importing}
                        onClick={() => void importCsv()}
                      >
                        Create list
                      </Button>
                    </>
                  )}
                  {importState.state !== "idle" && (
                    <p className={`text-xs ${importState.state === "error" ? "text-red-600" : "text-zinc-600"}`}>
                      {importState.message}
                    </p>
                  )}
                </div>
              </details>

              <p className="text-xs text-zinc-500">
                Each person gets their own copy with an unsubscribe link. People who unsubscribed are skipped.
              </p>
            </div>
          )}

          {status && <p className="text-sm">{status}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSend} loading={sending}>
              Send
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
