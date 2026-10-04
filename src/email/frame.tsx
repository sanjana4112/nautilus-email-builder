import type { ReactNode } from "react";
import { Container, Section } from "@react-email/components";
import type { PageSettings } from "./theme";

// Screen-size rules for the Columns block. Columns sit side by side by
// default; on tablets 3 or 4 columns wrap to two per row, and on phones
// every column stacks. Inboxes that ignore these rules (older Outlook) keep
// the side-by-side layout from the inline styles.
export const RESPONSIVE_CSS = `
@media (max-width: 820px) {
  .eb-cols-3 > .eb-col, .eb-cols-4 > .eb-col { max-width: 50% !important; }
}
@media (max-width: 480px) {
  .eb-col { max-width: 100% !important; }
}
`;

// The page background and the content column. Used both on the editor canvas
// and in the sent email, so the two always match. Content fills the email by
// default; a narrower width lets the background show at the sides.
export function EmailFrame({ page, children }: { page: PageSettings; children?: ReactNode }) {
  return (
    <Section style={{ backgroundColor: page.background }}>
      <style>{RESPONSIVE_CSS}</style>
      <Container style={{ width: "100%", maxWidth: `${page.contentWidth}px`, margin: "0 auto" }}>{children}</Container>
    </Section>
  );
}
