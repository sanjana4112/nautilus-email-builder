"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Button, RichTextMenu, type Field } from "@puckeditor/core";
import { safeHref } from "@/blocks/shared";

// The Tiptap editor Puck hands to rich text menus (taken from Puck's own types,
// so we don't depend on Tiptap directly).
type RichtextField = Extract<Field, { type: "richtext" }>;
type MenuProps = Parameters<NonNullable<RichtextField["renderMenu"]>>[0];
type Editor = NonNullable<MenuProps["editor"]>;

// --- One link dialog for the whole editor ----------------------------------
// The canvas toolbar and the sidebar toolbar can both point at the same text,
// so the dialog lives once in the editor (see editor.tsx) and either toolbar,
// or Ctrl/Cmd-K, just tells it which text to link.

let linkTarget: Editor | null = null;
const listeners = new Set<() => void>();

function openLinkDialog(editor: Editor) {
  linkTarget = editor;
  listeners.forEach((notify) => notify());
}

function closeLinkDialog() {
  linkTarget = null;
  listeners.forEach((notify) => notify());
}

function useLinkTarget() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => linkTarget,
    () => null,
  );
}

// Ctrl/Cmd-K on a rich text field opens the link dialog. Both toolbars may be
// showing for one editor, so the key listener is shared and counted.
const shortcuts = new Map<Editor, { count: number; onKey: (e: KeyboardEvent) => void }>();

function useLinkShortcut(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return;
    let entry = shortcuts.get(editor);
    if (!entry) {
      const onKey = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          openLinkDialog(editor);
        }
      };
      entry = { count: 0, onKey };
      shortcuts.set(editor, entry);
      editor.view.dom.addEventListener("keydown", onKey);
    }
    entry.count++;
    return () => {
      const current = shortcuts.get(editor);
      if (!current || --current.count > 0) return;
      editor.view.dom.removeEventListener("keydown", current.onKey);
      shortcuts.delete(editor);
    };
  }, [editor]);
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function LinkControl({ editor }: { editor: Editor | null }) {
  useLinkShortcut(editor);
  return (
    <RichTextMenu.Control
      icon={<LinkIcon />}
      title="Link (Ctrl/Cmd-K)"
      active={Boolean(editor?.isActive("link"))}
      disabled={!editor}
      onClick={() => editor && openLinkDialog(editor)}
    />
  );
}

// Toolbar for rich text: only what email does well. Used for both the
// canvas toolbar and the sidebar toolbar.
export function renderRichTextMenu({ editor }: MenuProps): ReactNode {
  return (
    <RichTextMenu>
      <RichTextMenu.Group>
        <RichTextMenu.Bold />
        <RichTextMenu.Italic />
        <RichTextMenu.Underline />
        <LinkControl editor={editor} />
      </RichTextMenu.Group>
    </RichTextMenu>
  );
}

// The link dialog. Opens with the current link filled in (if the cursor is on
// one), accepts https://, http://, or mailto:, and can remove a link.
export function LinkDialog() {
  const editor = useLinkTarget();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const current = editor ? String(editor.getAttributes("link").href ?? "") : "";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (editor && dialog && !dialog.open) dialog.showModal();
    if (!editor && dialog?.open) dialog.close();
  }, [editor]);

  if (!editor) return <dialog ref={dialogRef} />;

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const typed = String(new FormData(event.currentTarget).get("url") ?? "").trim();
    // Accept "example.com" by assuming https.
    const href = safeHref(typed) ?? safeHref(`https://${typed}`);
    if (!typed || !href || /^https:\/\/(javascript|data|vbscript):/i.test(href)) {
      return setError("Use a web address (https://…) or an email (mailto:…).");
    }
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !editor.isActive("link")) {
      // Nothing selected: insert the address itself as the link text.
      chain.insertContent({ type: "text", text: typed, marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      chain.setLink({ href }).run();
    }
    setError("");
    closeLinkDialog();
  }

  function remove() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setError("");
    closeLinkDialog();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        setError("");
        closeLinkDialog();
      }}
      className="m-auto w-96 rounded-lg p-6 shadow-xl backdrop:bg-black/40"
    >
      <form onSubmit={apply} className="flex flex-col gap-4">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          {current ? "Edit link" : "Add link"}
        </h2>
        <input
          key={current}
          name="url"
          defaultValue={current}
          autoFocus
          placeholder="https://example.com or mailto:hi@example.com"
          aria-invalid={Boolean(error)}
          className={`rounded border px-3 py-2 text-sm ${error ? "border-red-500" : "border-zinc-300"}`}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-between gap-2">
          <div>
            {current && (
              <Button type="button" variant="secondary" onClick={remove}>
                Remove link
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit">{current ? "Save" : "Add link"}</Button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
