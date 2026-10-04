"use client";

import dynamic from "next/dynamic";

// Render the editor only in the browser. When the server pre-renders it,
// Puck's drag-and-drop IDs come out different from the browser's, React
// keeps the server's, and dragging stops working.
const Editor = dynamic(() => import("@/editor/editor").then((m) => m.Editor), { ssr: false });

export default function Home() {
  return <Editor />;
}
