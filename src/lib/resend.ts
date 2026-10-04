import { Resend } from "resend";

// Server only: never import this from editor/ code, it reads the API key.

let client: Resend | null = null;

// The Resend client, created on first use rather than when this file loads:
// `next build` loads every route without secrets (e.g. on Vercel before the
// key is added), and Resend throws on creation when the key is missing.
export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set.");
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}
