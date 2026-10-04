"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@puckeditor/core";
import { SCHEDULED_EVENT } from "./send-panel";

type Scheduled = { id: string; subject: string; recipient: string; sendAt: string };
type State = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; items: Scheduled[] };

const REFRESH_MS = 30_000;

const formatWhen = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

// The "Scheduled" tab in the left sidebar: sends waiting to go out, with
// Cancel. Refreshes when opened, after a new send is scheduled, and every 30
// seconds (so sends that went out drop off the list).
export function ScheduledPanel() {
  const [list, setList] = useState<State>({ state: "loading" });
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/schedule");
      const result = (await response.json().catch(() => ({}))) as { scheduled?: Scheduled[]; error?: string };
      if (!response.ok || !result.scheduled) throw new Error(result.error ?? `Server error (${response.status})`);
      setList({ state: "ready", items: result.scheduled });
    } catch (err) {
      setList({ state: "error", message: err instanceof Error ? err.message : "Couldn't load scheduled sends." });
    }
  }, []);

  useEffect(() => {
    // Initial load runs after mount; the setState calls happen once the fetch settles.
    const first = setTimeout(load, 0);
    const timer = setInterval(load, REFRESH_MS);
    window.addEventListener(SCHEDULED_EVENT, load);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener(SCHEDULED_EVENT, load);
    };
  }, [load]);

  async function cancel(item: Scheduled) {
    if (!window.confirm(`Cancel "${item.subject}" to ${item.recipient}?`)) return;
    setCancelling(item.id);
    setNotice("");
    try {
      const response = await fetch(`/api/schedule?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setNotice(response.ok ? `Cancelled "${item.subject}".` : (result.error ?? "Couldn't cancel."));
    } catch {
      setNotice("Couldn't reach the server.");
    } finally {
      setCancelling(null);
      void load();
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Scheduled sends</h3>
        <button type="button" onClick={() => void load()} className="text-xs text-zinc-500 hover:text-zinc-900">
          Refresh
        </button>
      </div>

      {notice && <p className="text-xs text-zinc-600">{notice}</p>}
      {list.state === "loading" && <p className="text-xs text-zinc-500">Loading…</p>}
      {list.state === "error" && <p className="text-xs text-red-600">{list.message}</p>}
      {list.state === "ready" && list.items.length === 0 && (
        <p className="text-xs text-zinc-500">Nothing scheduled. Choose Schedule in the Send popup.</p>
      )}
      {list.state === "ready" &&
        list.items.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 border-t border-zinc-200 pt-3 first:border-t-0 first:pt-0">
            <div>
              <div className="font-medium text-zinc-900">{item.subject}</div>
              <div className="text-xs text-zinc-500">To {item.recipient}</div>
              <div className="text-xs text-zinc-700">{formatWhen(item.sendAt)}</div>
            </div>
            <Button
              variant="secondary"
              size="medium"
              disabled={cancelling === item.id}
              loading={cancelling === item.id}
              onClick={() => void cancel(item)}
            >
              Cancel send
            </Button>
          </div>
        ))}
    </div>
  );
}
