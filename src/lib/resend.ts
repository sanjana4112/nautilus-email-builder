import { Resend } from "resend";

// Server only: never import this from editor/ code, it reads the API key.
// Read settings lazily so a missing key fails the request with a clear
// message instead of crashing the whole app at startup.
export function getResendSettings() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_TO_EMAIL;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set in .env.local");
  if (!to) throw new Error("RESEND_TO_EMAIL is not set in .env.local");

  return {
    resend: new Resend(apiKey),
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to,
  };
}
