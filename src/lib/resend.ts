import { Resend } from "resend";

// Server only: never import this from editor/ code, it reads the API key.
export const resend = new Resend(process.env.RESEND_API_KEY);
