import type { Data, PuckContext } from "@puckeditor/core";
import type { ComponentType } from "react";
import { Body, Html, render } from "@react-email/components";
import { blocksConfig, type BlockProps, type EmailRootProps } from "@/blocks";
import { EmailFrame } from "./frame";
import { resolveStyle } from "./theme";

export type EmailData = Data<BlockProps, EmailRootProps>;

type BlockRender = ComponentType<Record<string, unknown> & { puck: PuckContext }>;

// Turns the editor's saved design into the HTML string an inbox receives.
// We call each block's render ourselves instead of using Puck's <Render>,
// because Puck's version uses React hooks that crash inside React Email's
// render on the server.
export async function renderEmailHtml(data: EmailData): Promise<string> {
  const style = resolveStyle(data.root.props?.style);

  // The editor-only info Puck normally hands each block. Outside the editor
  // there is nothing to drag or drop into; metadata carries the Style tab.
  const puck: PuckContext = {
    renderDropZone: () => null,
    metadata: { style },
    isEditing: false,
    dragRef: null,
  };

  return render(
    <Html lang="en">
      <Body style={{ backgroundColor: style.background, margin: 0 }}>
        <EmailFrame style={style}>
          {data.content.map(({ type, props }) => {
            // Props come from the same saved block as `type`, so they always fit
            // this render; TypeScript can't link the two across 8 block types.
            const Block = blocksConfig.components[type]?.render as BlockRender | undefined;
            return Block ? <Block key={props.id} {...props} puck={puck} /> : null;
          })}
        </EmailFrame>
      </Body>
    </Html>,
  );
}
