"use client";

import { useRef, useState } from "react";
import { Button, createUsePuck, useGetPuck } from "@puckeditor/core";
import type { blocksConfig } from "@/blocks";
import { renderEmailHtml, type EmailData } from "@/email/render";

const usePuck = createUsePuck<typeof blocksConfig>();

const WIDTHS = [
  // How a reader sees it: Desktop is an inbox pane with the email centered.
  { label: "Desktop", width: 1000 },
  { label: "Tablet", width: 768 },
  { label: "Mobile", width: 375 },
];
const ZOOMS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const PAGE_GUTTER = 64;

// "Preview email": the exact HTML that gets sent, shown at inbox widths with
// zoom and scroll bars. Built with the same renderEmailHtml the server uses.
export function PreviewPanel() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const getPuck = useGetPuck();
  const subject = usePuck((s) => s.appState.data.root.props?.subject?.trim() ?? "");
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [width, setWidth] = useState(WIDTHS[0].width);
  const [zoom, setZoom] = useState(1);
  const [height, setHeight] = useState(800);

  // Largest zoom that shows the full width without scrolling sideways.
  const fitZoom = (w: number) => Math.min(1, (window.innerWidth - PAGE_GUTTER) / w);

  async function open() {
    setHtml(null);
    setError("");
    setZoom(fitZoom(width));
    dialogRef.current?.showModal();
    try {
      setHtml(await renderEmailHtml(getPuck().appState.data as EmailData));
    } catch {
      setError("Couldn't build the preview. Check the blocks for missing content and try again.");
    }
  }

  function chooseWidth(w: number) {
    setWidth(w);
    setZoom(fitZoom(w));
  }

  const step = (dir: -1 | 1) => {
    const next = dir < 0 ? [...ZOOMS].reverse().find((z) => z < zoom - 0.001) : ZOOMS.find((z) => z > zoom + 0.001);
    if (next) setZoom(next);
  };

  return (
    <>
      <Button variant="secondary" onClick={open}>
        Preview email
      </Button>
      <dialog
        ref={dialogRef}
        className="m-0 h-screen max-h-none w-screen max-w-none bg-zinc-100 p-0 backdrop:bg-black/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-6 border-b border-zinc-200 bg-white px-6 py-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">Preview</div>
              <div className="truncate text-sm text-zinc-900">{subject || "No subject yet"}</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex rounded-md border border-zinc-200 p-0.5" role="group" aria-label="Screen width">
                {WIDTHS.map((w) => (
                  <button
                    key={w.width}
                    type="button"
                    onClick={() => chooseWidth(w.width)}
                    aria-pressed={width === w.width}
                    className={`rounded px-3 py-1 text-xs transition-colors ${
                      width === w.width ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1" role="group" aria-label="Zoom">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={zoom <= ZOOMS[0] + 0.001}
                  aria-label="Zoom out"
                  className="h-7 w-7 rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                >
                  −
                </button>
                <select
                  value={ZOOMS.includes(zoom) ? zoom : "fit"}
                  onChange={(e) => setZoom(e.target.value === "fit" ? fitZoom(width) : Number(e.target.value))}
                  aria-label="Zoom level"
                  className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs"
                >
                  {!ZOOMS.includes(zoom) && <option value="fit">{Math.round(zoom * 100)}% · Fit</option>}
                  {ZOOMS.map((z) => (
                    <option key={z} value={z}>
                      {z * 100}%
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={zoom >= ZOOMS[ZOOMS.length - 1] - 0.001}
                  aria-label="Zoom in"
                  className="h-7 w-7 rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
                Close
              </Button>
            </div>
          </div>

          {/* Scrolls in both directions when zoomed past the window size. */}
          <div className="flex-1 overflow-auto p-8">
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {!error && !html && <p className="text-center text-sm text-zinc-500">Building preview…</p>}
            {html && (
              // The outer box takes the zoomed size so scroll bars match what you see.
              <div className="mx-auto shadow-sm" style={{ width: width * zoom, height: height * zoom }}>
                <iframe
                  key={width}
                  title="Email preview"
                  srcDoc={html}
                  // No scripts; same-origin only so we can measure the email's height.
                  sandbox="allow-same-origin"
                  onLoad={(e) => setHeight(e.currentTarget.contentDocument?.documentElement.scrollHeight ?? 800)}
                  style={{
                    width,
                    height,
                    border: 0,
                    background: "white",
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
