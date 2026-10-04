import type { ReactNode } from "react";
import { Container, Section } from "@react-email/components";
import type { PageSettings } from "./theme";

// Shared CSS for the canvas and the email. Rich text: paragraph spacing and
// underlined links, matching the inline styles the email also gets.
// Screen-size rule for the Columns block: columns sit side by side, and on
// phones each one takes the full width. Inboxes that ignore this rule
// (older Outlook) keep the side-by-side layout from the inline styles.
// (Inboxes judge layout by screen width, not email width, so a tablet rule
// would also fire in the editor's 600px Email view.)
export const RESPONSIVE_CSS = `
@media (max-width: 480px) {
  .eb-col { max-width: 100% !important; }
}
.eb-rich p { margin: 0; }
.eb-rich p + p { margin-top: 1em; }
.eb-rich a { color: inherit; text-decoration: underline; }
`;

// The page background and the content column. Used both on the editor canvas
// and in the sent email, so the two always match. Content fills the email by
// default; a narrower width lets the background show at the sides.
export function EmailFrame({ page, children }: { page: PageSettings; children?: ReactNode }) {
  return (
    <Section style={{ backgroundColor: page.background || undefined }}>
      <style>{RESPONSIVE_CSS}</style>
      <Container style={{ width: "100%", maxWidth: `${page.contentWidth}px`, margin: "0 auto" }}>{children}</Container>
    </Section>
  );
}
