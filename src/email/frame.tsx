import type { ReactNode } from "react";
import { Container, Section } from "@react-email/components";
import type { EmailStyle } from "./theme";

// The email's background and centered content column. Used both on the
// editor canvas and in the sent email, so the two always match.
export function EmailFrame({ style, children }: { style: EmailStyle; children?: ReactNode }) {
  return (
    <Section style={{ backgroundColor: style.background, padding: "24px 0" }}>
      <Container style={{ maxWidth: `${style.contentWidth}px`, padding: "0 24px" }}>{children}</Container>
    </Section>
  );
}
