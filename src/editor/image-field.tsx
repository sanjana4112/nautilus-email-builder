"use client";

import { useEffect, useState } from "react";
import { AutoField, createUsePuck, FieldLabel } from "@puckeditor/core";
import type { blocksConfig } from "@/blocks";
import { resolvePage } from "@/email/theme";

const usePuck = createUsePuck<typeof blocksConfig>();

type Check =
  | { state: "empty" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ok"; width: number; height: number };

// An image link with a live preview and a resolution check. The email always
// scales images to fit its width; this only warns when an image is narrower
// than twice the page's content width, which is what phones and high-res
// screens need to stay sharp. (Uploading replaces the link box once storage
// is set up.)
export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const contentWidth = usePuck((s) => resolvePage(s.appState.data.root.props).contentWidth);
  const minWidth = contentWidth * 2;
  const url = value.trim();
  const isHttps = /^https:\/\//i.test(url);
  // Only the result of loading the image is stored; the rest follows from the link.
  const [loaded, setLoaded] = useState<{ url: string; check: Check } | null>(null);

  useEffect(() => {
    if (!isHttps) return;
    const img = new window.Image();
    img.onload = () => setLoaded({ url, check: { state: "ok", width: img.naturalWidth, height: img.naturalHeight } });
    img.onerror = () => setLoaded({ url, check: { state: "error", message: "Couldn't load an image from this link" } });
    img.src = url;
    return () => {
      img.onload = img.onerror = null;
    };
  }, [url, isHttps]);

  const check: Check = !url
    ? { state: "empty" }
    : !isHttps
      ? { state: "error", message: "Use a link that starts with https://" }
      : loaded?.url === url
        ? loaded.check
        : { state: "loading" };

  return (
    <FieldLabel label={label} el="div">
      <div className="flex flex-col gap-2">
        <AutoField field={{ type: "text", placeholder: "https://…" }} value={value} onChange={onChange} />
        {check.state === "loading" && <p className="text-xs text-zinc-500">Checking image…</p>}
        {check.state === "error" && <p className="text-xs text-red-600">{check.message}</p>}
        {check.state === "ok" && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary external link */}
            <img src={url} alt="" className="h-12 w-20 rounded object-cover ring-1 ring-zinc-200" />
            <div className="text-xs leading-5">
              <div className="text-zinc-700">
                {check.width} × {check.height}px
              </div>
              {check.width < minWidth ? (
                <div className="text-amber-600">Low resolution. Use at least {minWidth}px wide for a sharp result.</div>
              ) : (
                <div className="text-emerald-600">Sharp on every screen</div>
              )}
            </div>
          </div>
        )}
      </div>
    </FieldLabel>
  );
}
