import type { ReactNode } from "react";
import { Container, Section } from "@react-email/components";
import type { PageSettings } from "./theme";

// The page background and the content column. Used both on the editor canvas
// and in the sent email, so the two always match. Content fills the email by
// default; a narrower width lets the background show at the sides.
export function EmailFrame({ page, children }: { page: PageSettings; children?: ReactNode }) {
  return (
    <Section style={{ backgroundColor: page.background }}>
      <Container style={{ width: "100%", maxWidth: `${page.contentWidth}px`, margin: "0 auto" }}>{children}</Container>
    </Section>
  );
}
