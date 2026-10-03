import type { Data } from "@puckeditor/core";
// The /rsc entry is Puck's renderer with no editor or browser code in it.
import { Render } from "@puckeditor/core/rsc";
import { Body, Container, Html } from "@react-email/components";
import { render } from "@react-email/components";
import { blocksConfig, type BlockProps } from "@/blocks";
import { theme } from "./theme";

export type EmailData = Data<BlockProps>;

// Turns the editor's saved design into the HTML string an inbox receives.
export async function renderEmailHtml(data: EmailData): Promise<string> {
  return render(
    <Html lang="en">
      <Body style={{ backgroundColor: theme.colors.background, fontFamily: theme.fonts.body }}>
        <Container>
          <Render config={blocksConfig} data={data} />
        </Container>
      </Body>
    </Html>,
  );
}
