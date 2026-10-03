import type { Config } from "@puckeditor/core";
import { Heading, type HeadingProps } from "./basic/heading";

// Every block's props, keyed by the name Puck stores in the saved data.
export type BlockProps = {
  Heading: HeadingProps;
};

// The full block list as a Puck config. Shared by the editor (browser) and
// the email renderer (server), which is why it lives here and not in editor/.
export const blocksConfig: Config<BlockProps> = {
  components: {
    Heading,
  },
};
