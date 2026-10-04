# Email Builder with Drag & Drop

**Nautilus Engineering · Full-Stack Engineer Take-Home**

## Overview

A visual email builder that lets users compose, preview, and send emails using a drag-and-drop interface.

- I chose to create an email builder specifically designed for pop-up dinner series and supper clubs. It's not very different from a standard email builder, but I added relevant templates and block options. I also made sure the style tab in the editor made brand style guide adherence as easy as possible.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Application framework |
| TypeScript (strict) | Type safety |
| React Email | Email-safe components and HTML rendering |
| Resend | Sending, contact lists (Segments), Broadcasts, unsubscribes |
| Puck Editor | Drag & drop builder, sidebar fields, rich text |
| Temporal | Durable scheduling |
| Vercel Blob | Image uploads |
| Vitest | Tests |

## Setup

Requires Node 20.9+ (built with Node 22).

```bash
# Install dependencies
npm install
# If npm stops with "Cannot read properties of null (reading 'edgesOut')" (an npm 10 bug), run:
# npm install --legacy-peer-deps

# Copy env vars, then fill them in (see below)
cp .env.example .env.local

# Run tests
npm test

# Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scheduled sends (Temporal)

Scheduling needs two more processes, each in its own terminal:

```bash
# 1. Install the Temporal CLI once: https://docs.temporal.io/cli  (macOS: brew install temporal)
temporal server start-dev      # local Temporal server; dashboard at http://localhost:8233

# 2. The worker that runs scheduled sends
npm run worker                 # ready when it prints: Worker ready on task queue "email-sends"
```

Everything else works without them; scheduling explains what to start if they aren't running.

### Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Sender address (default `onboarding@resend.dev`). Without a verified domain, Resend only delivers to your own account email. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for image uploads (Vercel project → Storage → Blob → `.env.local` tab) |
| `TEMPORAL_ADDRESS` | Temporal server address (default `localhost:7233`) |

## Features

### Tier 1
- **Drag & drop builder** with 13 blocks in four groups: **Layout** (Section, Container, Columns), **Header** (Title, Banner, Navigation), **Content** (Heading, Body copy, Image, Quote, Button), **Social & footer** (Social links, Footer).
- **Property editing** in the right sidebar: text, links, images, colors from the brand palette (or hex), typography, spacing, and backgrounds. Groups collapse to keep the panel clean.
- **Live preview, WYSIWYG:** the canvas renders the same React Email components and frame that get sent.
- **Sending** through Resend with recipient, subject, and status in the popup.

### Tier 2
- **Scheduled sends** with Temporal: date/time picker in the reader's time zone, a **Scheduled** tab listing upcoming sends, and **Cancel**.
- **Desktop, Tablet, and Mobile** canvas widths. Columns stack on phones.

### Tier 3

- Undo/redo button
- Image upload with resolution check and auto-resize
- Color palette
- Multiple recipients
- CSV contac import/broadcast
- CTRL+K link creation

Also built: brand **Style tab** (palette + six text styles), per-block text overrides, **image upload** with resolution check and auto-resize, **CSV contact import**, **unsubscribe** handling, and **rich text links** in body copy.

## Architecture Decisions

### Bridging Puck and React Email
- One definition per block. Each block is a Puck `ComponentConfig` whose `render` returns React Email components (`src/blocks/basic/*.tsx`). The editor canvas and the sent email run the same `render`, so they can't drift.
- Our own server renderer instead of Puck's `<Render>`. Puck's `<Render>` uses React hooks; inside React Email's `render()` in a Next route handler it crashed (`useMemo` on a null dispatcher: two React copies). `src/email/render.tsx` walks Puck's saved data itself and calls each block's `render`, including blocks nested in **slots** (Section, Container, Columns), with a depth limit.
- Blocks are server-safe; editor-only UI is layered on. Blocks contain no browser code. Fields that need a richer editor UI carry a marker (`metadata.palette`, `metadata.image`) or a type (`richtext`), and `src/editor/puck-config.tsx` swaps in palette swatches, the image uploader, and the rich text toolbar. The server keeps the plain config.

### Styling model
- Brand style vs. page settings. The palette and six text styles (Title … Caption) are brand-wide and live in the Style tab; page background and content width are per email and live under Page. Both are saved in the design's root props.
- Blocks get the style through Puck `metadata`, not React context, so blocks stay plain functions on both the canvas and the server. `resolveStyle` / `resolvePage` treat saved data as untrusted: hex-only colors, clamped sizes, email-safe fonts only.
- Per-block overrides (font, size, B/I/U, color) sit on top of the Style tab via `applyOverride`; "Default" means "use the Style tab".
- Email-safe HTML: inline styles only; padding and borders on `<td>` (inboxes ignore them on `<table>`); content is fluid up to a cap (default 1000px). Columns use inline-block widths plus one `@media` rule in `<head>` (Gmail only reads it there).

### Sending
- Shared send path (`src/lib/send.ts`) used by "send now" and by the Temporal worker.
- Lists use Resend Segments + Broadcasts, not BCC. BCC can't give each reader their own unsubscribe link (required for marketing email), hurts deliverability, and Resend caps it at 50. Broadcasts send each person their own copy, add one-click unsubscribe headers, and skip people who unsubscribed, with no database on our side.
- CSV import is parsed and checked in the browser for a preview, checked again on the server, and handed to Resend's bulk importer as a clean `email,first_name,last_name` file (spreadsheet formulas defused).
- Unsubscribe is never missing: list sends replace the Footer's link with Resend's per-reader link and add a Footer if the design has none.

### Scheduling
- A Temporal workflow `sleep`s until the send time, then runs one activity that sends. The HTML is rendered when scheduling, so later edits don't change a scheduled email. The Scheduled tab reads running workflows' memos; Cancel cancels the workflow. Resend refusals are non-retryable; network errors retry.

### Other decisions
- Rich text uses Puck's Tiptap field with only bold, italic, underline, and links. Saved HTML is cleaned to an allowlist (`src/email/rich-text.ts`) before sending.
- Images upload straight from the browser to Vercel Blob with a short-lived token from `/api/upload`, so the storage key never reaches the browser. Images are resized in the browser to 2× the content width and limited to JPEG, PNG, and GIF (WebP and SVG aren't reliable in Outlook and Gmail).
- The editor renders only in the browser (`next/dynamic`, `ssr: false`): server and browser renders produced different drag-and-drop IDs and broke dragging.
- Tests: 178 Vitest tests covering rendering, every block, validation, the rich text cleaner, CSV parsing, and every API route. Resend, Vercel Blob, and Temporal are mocked.

## Assumptions

- Assuming this email builder would be part of a larger environment (web app, etc) that would offer draft saving, draft editing, etc. Limiting scope to anything that would happen within the builder itself.
- Building this with a specific customer in mind--pop-up dinners and supper clubs.
- No sign-in. Anyone who can reach the app can send, import lists, and upload images. Type, size, and count limits contain the damage; a real product needs authentication.
- No verified sending domain. With Resend's test sender, email only reaches the account owner, and Broadcasts may be refused until a domain is verified.

## Known Limitations

- Temporal doesn't run on Vercel. Scheduling is complete in the code and runs locally; the deployed demo has everything except scheduled sends.
- Social links are text, not icons: icon images need public hosting, which comes with deploying.
- Undo history records each keystroke or color drag as its own step.
- Starter repo issues found: the original lockfile pinned a broken Tiptap release (3.20.3, missing its built files), fixed by reinstalling; and npm 10 crashed installing Vitest, worked around with `--legacy-peer-deps`.

## Time Spent

Start time--6:15pm ish

--6:30pm--
- Got repo running. Drag and drop editor working.
- Made a plan to create an email builder for supper clubs/pop-up dinners.

--7:00pm--
- Email sending: sending via Resend with recipient input, subject line, status. Made the subject line and page title equivalent.
- Live email preview working on dektop, tablet, mobile.

--7:30pm--
- Added a style tab to the editor sidebar. Intakes brand colors and allows various color, font defaults to be adjusted.

--8:00pm--
- Added new blocks.

--8:30pm--
- Made things more gorgeous and reasonable. UI adjustments

--9:00pm--
- Add image handling with Vercel

--9:30pm--
- Added schedule send and multiple recipients.
- Hungry! Time for dinner :-D.

--If I spent more time--
- I'd love to add an "upload palette" feature where the user can upload a picture of a color palette and the email builder populates the style palette.
- "Save this style guide" to save the colors, fonts, etc used.
- Upload custom fonts
- Image library sorted by banner, icon, or image
- AI copy recommendations based on prompt
- Add social media icon images
- More style options for navigation block
- Fancier default options for text and style etc. Templates that focus on style.
- Templates that focus on substance: "dinner this month", "tickets are live", "thanks for coming to dinner"
- Saved, separated email lists: Guests who attended the most recent dinner, overall email list, guests who have purchased tickets to the next dinner.
- Adjust font, color, etc by selection rather than by block only.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Puck Editor](https://puckeditor.com)
- [React Email](https://react.email)
- [Resend](https://resend.com)
- [Temporal](https://temporal.io)
- [Vercel Blob](https://vercel.com/docs/vercel-blob)
