import type { Data, PuckContext } from "@puckeditor/core";
import { Body, Container, Html, render } from "@react-email/components";
import { blocksConfig, type BlockProps } from "@/blocks";
import { theme } from "./theme";

export type EmailData = Data<BlockProps>;

// The editor-only info Puck normally hands each block. Outside the editor
// there is nothing to drag or drop into, so it is all empty.
const notEditing: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

// Turns the editor's saved design into the HTML string an inbox receives.
// We call each block's render ourselves instead of using Puck's <Render>,
// because Puck's version uses React hooks that crash inside React Email's
// render on the server.
export async function renderEmailHtml(data: EmailData): Promise<string> {
  return render(
    <Html lang="en">
      <Body style={{ backgroundColor: theme.colors.background, fontFamily: theme.fonts.body }}>
        <Container>
          {data.content.map(({ type, props }) => {
            const Block = blocksConfig.components[type]?.render;
            return Block ? <Block key={props.id} {...props} puck={notEditing} /> : null;
          })}
        </Container>
      </Body>
    </Html>,
  );
}
