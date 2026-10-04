// Reading a contacts CSV, shared by the send popup (preview before upload)
// and the segments route (checks again, since anyone can call the server).
// No secrets here, so the browser can import it.

export type ContactRow = { email: string; firstName: string; lastName: string };
export type SkippedRow = { line: number; reason: string };

export const MAX_CONTACTS = 10_000;
export const MAX_CSV_BYTES = 5 * 1024 * 1024;

// One address: no spaces, commas, or second "@".
const SINGLE_EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export function isEmail(value: string): boolean {
  return SINGLE_EMAIL.test(value.trim());
}

// Splits CSV text into rows of cells. Handles quoted cells ("Smith, Jr."),
// doubled quotes inside them, and both Windows and Mac line endings.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^﻿/, ""); // Excel's invisible marker at the start

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const HEADERS = {
  email: ["email", "e-mail", "email address", "emailaddress"],
  firstName: ["first_name", "first name", "firstname", "first"],
  lastName: ["last_name", "last name", "lastname", "last", "surname"],
};

const normalize = (h: string) => h.trim().toLowerCase();

// Finds the email and name columns, checks every row, and drops bad rows and
// duplicates, reporting each one with its line number.
export function readContacts(text: string): { contacts: ContactRow[]; skipped: SkippedRow[]; error?: string } {
  // Keep each row's line number in the file before dropping blank rows.
  const numbered = parseCsv(text)
    .map((cells, i) => ({ cells, line: i + 1 }))
    .filter(({ cells }) => cells.some((c) => c.trim() !== ""));
  const rows = numbered.map((r) => r.cells);
  if (rows.length === 0) return { contacts: [], skipped: [], error: "The file is empty." };

  const header = rows[0].map(normalize);
  const col = (names: string[]) => header.findIndex((h) => names.includes(h));
  let emailCol = col(HEADERS.email);
  const hasHeader = emailCol !== -1;
  // No header row: use the first column that looks like an email address.
  if (!hasHeader) emailCol = rows[0].findIndex((c) => isEmail(c));
  if (emailCol === -1) return { contacts: [], skipped: [], error: "Couldn't find an email column." };
  const firstCol = hasHeader ? col(HEADERS.firstName) : -1;
  const lastCol = hasHeader ? col(HEADERS.lastName) : -1;

  const contacts: ContactRow[] = [];
  const skipped: SkippedRow[] = [];
  const seen = new Set<string>();
  const body = hasHeader ? numbered.slice(1) : numbered;

  body.forEach(({ cells, line }) => {
    const email = (cells[emailCol] ?? "").trim();
    if (!email) return skipped.push({ line, reason: "no email" });
    if (!isEmail(email)) return skipped.push({ line, reason: `"${email}" isn't a valid email` });
    const key = email.toLowerCase();
    if (seen.has(key)) return skipped.push({ line, reason: `${email} is a duplicate` });
    seen.add(key);
    contacts.push({
      email,
      firstName: firstCol === -1 ? "" : (cells[firstCol] ?? "").trim(),
      lastName: lastCol === -1 ? "" : (cells[lastCol] ?? "").trim(),
    });
  });

  if (contacts.length > MAX_CONTACTS) {
    return { contacts: [], skipped, error: `That's over ${MAX_CONTACTS.toLocaleString()} contacts. Split the file.` };
  }
  return { contacts, skipped };
}

function csvCell(value: string): string {
  // Quote cells with commas, quotes, or line breaks. Also neutralize cells
  // starting with = + - @, which spreadsheets would run as formulas.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// A clean CSV with just the columns Resend needs.
export function toContactsCsv(contacts: ContactRow[]): string {
  const lines = contacts.map((c) => [c.email, c.firstName, c.lastName].map(csvCell).join(","));
  return ["email,first_name,last_name", ...lines].join("\n");
}
