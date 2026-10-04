import type { Data, Field, PuckContext } from "@puckeditor/core";
import type { ComponentType, ReactNode } from "react";
import { Body, Head, Html, render } from "@react-email/components";
import { blocksConfig, type BlockProps, type EmailRootProps } from "@/blocks";
import { EmailFrame, RESPONSIVE_CSS } from "./frame";
import { resolvePage, resolveStyle } from "./theme";

const defaultFooter = { type: "Footer", props: { id: "auto-footer", ...blocksConfig.components.Footer.defaultProps } };

export type EmailData = Data<BlockProps, EmailRootProps>;

type BlockRender = ComponentType<Record<string, unknown> & { puck: PuckContext }>;

// How deep blocks can sit inside each other (e.g. Section > Container >
// Columns > Button). Stops a malformed design from looping forever.
const MAX_DEPTH = 8;

// Draws a list of saved blocks. Layout blocks (Section, Container, Columns)
// keep their inner blocks in "slot" props; the editor turns those into drop
// zones, so here we turn each into a small component that draws its blocks.
function renderBlocks(items: unknown, puck: PuckContext, depth: number): ReactNode {
  if (!Array.isArray(items) || depth > MAX_DEPTH) return null;
  return items.map((item: { type?: string; props?: Record<string, unknown> }, i) => {
    const config = item?.type ? blocksConfig.components[item.type as keyof BlockProps] : undefined;
    if (!config) return null;
    const props: Record<string, unknown> = { ...item.props };
    for (const [name, field] of Object.entries((config.fields ?? {}) as Record<string, Field>)) {
      if (field.type === "slot") {
        const children = props[name];
        props[name] = () => renderBlocks(children, puck, depth + 1);
      }
    }
    // Props come from the same saved block as `type`, so they always fit this
    // render; TypeScript can't link the two across every block type.
    const Block = config.render as BlockRender;
    return <Block key={String(props.id ?? i)} {...props} puck={puck} />;
  });
}

// Resend swaps this for each reader's own unsubscribe link in Broadcasts.
export const LIST_UNSUBSCRIBE_URL = "{{{RESEND_UNSUBSCRIBE_URL}}}";

type RenderOptions = {
  // Sending to a list: the Footer's link becomes each reader's unsubscribe
  // link, and a Footer is added if the design doesn't have one.
  forList?: boolean;
};

function hasFooter(items: unknown, depth = 0): boolean {
  if (!Array.isArray(items) || depth > MAX_DEPTH) return false;
  return items.some(
    (item: { type?: string; props?: Record<string, unknown> }) =>
      item?.type === "Footer" ||
      Object.values(item?.props ?? {}).some((value) => Array.isArray(value) && hasFooter(value, depth + 1)),
  );
}

// Turns the editor's saved design into the HTML string an inbox receives.
// We call each block's render ourselves instead of using Puck's <Render>,
// because Puck's version uses React hooks that crash inside React Email's
// render on the server.
export async function renderEmailHtml(data: EmailData, { forList = false }: RenderOptions = {}): Promise<string> {
  const style = resolveStyle(data.root.props?.style);
  const page = resolvePage(data.root.props);

  // The editor-only info Puck normally hands each block. Outside the editor
  // there is nothing to drag or drop into; metadata carries the Style tab.
  const puck: PuckContext = {
    renderDropZone: () => null,
    metadata: { style, unsubscribeUrl: forList ? LIST_UNSUBSCRIBE_URL : undefined },
    isEditing: false,
    dragRef: null,
  };

  return render(
    <Html lang="en">
      {/* Gmail only reads screen-size rules from <head>. */}
      <Head>
        <style>{RESPONSIVE_CSS}</style>
      </Head>
      <Body style={{ backgroundColor: page.background || undefined, margin: 0 }}>
        <EmailFrame page={page}>
          {renderBlocks(data.content, puck, 0)}
          {/* Marketing email must always offer an unsubscribe link. */}
          {forList && !hasFooter(data.content) && renderBlocks([defaultFooter], puck, 0)}
        </EmailFrame>
      </Body>
    </Html>,
  );
}
