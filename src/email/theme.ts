// Brand colors and fonts in one place, so blocks share the same look.
// Font stacks use email-safe fallbacks because most inboxes can't load web fonts.
export const theme = {
  colors: {
    text: "#1a1a1a",
    background: "#ffffff",
  },
  fonts: {
    heading: "Georgia, 'Times New Roman', serif",
    body: "Helvetica, Arial, sans-serif",
  },
} as const;
