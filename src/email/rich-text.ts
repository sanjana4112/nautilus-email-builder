import { safeHref } from "@/blocks/shared";

// Turns rich text saved by the editor into HTML that is safe to put in an
// email. Rich text arrives as an HTML string from the browser, so treat it as
// untrusted: only a short allowlist of tags survives, no attributes are kept
// except a checked link address, and inline styles are added for inboxes.

// Allowed tags, and the name each one is written out as.
const ALLOWED: Record<string, string> = {
  p: "p",
  br: "br",
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
  u: "u",
  s: "s",
  a: "a",
};
// Tags whose contents are dropped entirely, not just the tag itself.
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "template",
  "noscript",
  "textarea",
  "title",
  "head",
]);

function escapeText(text: string): string {
  // Keep entities the editor already wrote (e.g. &amp;), escape everything else.
  return text
    .replace(/&(?!(?:[a-z][a-z0-9]*|#\d+|#x[0-9a-f]+);)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readHref(attrs: string): string | undefined {
  const match = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs);
  const raw = match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
  return safeHref(decodeEntities(raw));
}

const looksLikeHtml = (value: string) => /<\/?[a-z][^>]*>/i.test(value);

// linkStyle is the inline CSS for links, e.g. "color:#000000;text-decoration:underline".
export function richTextToEmailHtml(value: unknown, linkStyle: string): string {
  if (typeof value !== "string" || value.trim() === "") return "";

  // Older plain-text content: keep its line breaks.
  if (!looksLikeHtml(value)) {
    return `<p style="margin:0">${escapeText(value).replace(/\r?\n/g, "<br>")}</p>`;
  }

  const out: string[] = [];
  const open: string[] = []; // tags written out and not yet closed
  const linkStack: boolean[] = []; // for each <a> seen: was it kept?
  let dropDepth = 0;
  let paragraphs = 0;

  // A tag starts with "<" right before a letter (or "/" + letter); comments are
  // tokens too, so they can be dropped. Anything else is text, so a stray "<"
  // in "1 < 2" is kept (escaped) rather than mistaken for a tag.
  for (const token of value.split(/(<\/?[a-z][^>]*>|<!--[\s\S]*?-->)/i)) {
    if (!token) continue;
    const tag = /^<\s*(\/)?\s*([a-z][a-z0-9-]*)([^>]*)>$/i.exec(token);

    if (!tag) {
      // Text (escaped), or a comment (dropped).
      if (dropDepth === 0 && !token.startsWith("<!--")) out.push(escapeText(token));
      continue;
    }

    const [, closing, rawName, attrs] = tag;
    const name = rawName.toLowerCase();

    if (DROP_WITH_CONTENT.has(name)) {
      if (!/\/\s*$/.test(attrs)) dropDepth = Math.max(0, dropDepth + (closing ? -1 : 1));
      continue;
    }
    if (dropDepth > 0) continue;

    const outName = ALLOWED[name];
    if (!outName) continue; // unknown tag: drop the tag, keep its text

    if (outName === "br") {
      if (!closing) out.push("<br>");
      continue;
    }

    if (!closing) {
      if (outName === "a") {
        const href = readHref(attrs);
        linkStack.push(Boolean(href));
        if (!href) continue; // unsafe or missing link: keep the words, drop the link
        out.push(`<a href="${escapeAttr(href)}" style="${escapeAttr(linkStyle)}" target="_blank">`);
      } else if (outName === "p") {
        // No gap above the first paragraph; one line of space between the rest.
        out.push(`<p style="margin:${paragraphs++ === 0 ? "0" : "1em 0 0"}">`);
      } else {
        out.push(`<${outName}>`);
      }
      open.push(outName);
      continue;
    }

    // Closing tag: only close what we actually opened.
    if (outName === "a" && linkStack.length > 0 && !linkStack.pop()) continue;
    const at = open.lastIndexOf(outName);
    if (at === -1) continue;
    while (open.length > at) out.push(`</${open.pop()}>`);
  }

  while (open.length > 0) out.push(`</${open.pop()}>`);
  return out.join("");
}
