"use client";

import { useEffect, useRef, useState } from "react";
import { AutoField, Button, createUsePuck, FieldLabel } from "@puckeditor/core";
import { upload } from "@vercel/blob/client";
import type { blocksConfig } from "@/blocks";
import { resolvePage } from "@/email/theme";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/image-rules";

const usePuck = createUsePuck<typeof blocksConfig>();

type Check =
  | { state: "empty" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ok"; width: number; height: number };

type UploadState = { state: "idle" } | { state: "working"; message: string } | { state: "error"; message: string };

function readSize(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file couldn't be read as an image."));
    };
    img.src = url;
  });
}

// Shrinks an image wider than maxWidth, keeping its shape and file type, so
// emails stay fast. GIFs are left alone: redrawing would drop their animation.
async function shrinkIfHuge(file: File, maxWidth: number): Promise<File> {
  if (file.type === "image/gif") return file;
  const img = await readSize(file);
  if (img.naturalWidth <= maxWidth) return file;

  const canvas = document.createElement("canvas");
  canvas.width = maxWidth;
  canvas.height = Math.round((img.naturalHeight * maxWidth) / img.naturalWidth);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.9));
  return blob ? new File([blob], file.name, { type: file.type }) : file;
}

// An image field: upload a file, or paste a link. Shows a preview and warns
// when the image is narrower than twice the page's content width, which is
// what phones and high-res screens need to stay sharp. The email always
// scales images to fit its width.
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
  const sharpWidth = contentWidth * 2;
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ state: "idle" });

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

  async function uploadFile(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return setUploadState({ state: "error", message: "Use a JPEG, PNG, or GIF." });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return setUploadState({ state: "error", message: "That file is over 10 MB." });
    }
    try {
      setUploadState({ state: "working", message: "Preparing…" });
      const ready = await shrinkIfHuge(file, sharpWidth);
      const blob = await upload(ready.name, ready, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: ready.type,
        onUploadProgress: ({ percentage }) =>
          setUploadState({ state: "working", message: `Uploading ${Math.round(percentage)}%` }),
      });
      onChange(blob.url);
      setUploadState({ state: "idle" });
    } catch (err) {
      setUploadState({
        state: "error",
        message: err instanceof Error ? err.message : "Upload failed. Try again.",
      });
    }
  }

  return (
    <FieldLabel label={label} el="div">
      <div className="flex flex-col gap-2">
        <input
          ref={fileInput}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // so choosing the same file again still triggers
            if (file) void uploadFile(file);
          }}
        />
        <Button
          variant="secondary"
          fullWidth
          disabled={uploadState.state === "working"}
          loading={uploadState.state === "working"}
          onClick={() => fileInput.current?.click()}
        >
          {uploadState.state === "working" ? uploadState.message : url ? "Replace image" : "Upload image"}
        </Button>
        {uploadState.state === "error" && <p className="text-xs text-red-600">{uploadState.message}</p>}

        <AutoField
          field={{ type: "text", placeholder: "or paste an https:// link" }}
          value={value}
          onChange={onChange}
        />

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
              {check.width < sharpWidth ? (
                <div className="text-amber-600">
                  Low resolution. Use at least {sharpWidth}px wide for a sharp result.
                </div>
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
