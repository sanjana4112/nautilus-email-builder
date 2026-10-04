import { NextResponse } from "next/server";
import { MAX_CSV_BYTES, readContacts, toContactsCsv } from "@/lib/contacts-csv";
import { resend } from "@/lib/resend";

const MAX_NAME_LENGTH = 100;

// GET /api/segments: your saved lists (Resend "segments").
export async function GET() {
  const { data, error } = await resend.segments.list();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ segments: (data?.data ?? []).map(({ id, name }) => ({ id, name })) });
}

// POST /api/segments (form data: name, file): creates a list from a CSV.
// The file is checked again here, since anyone can call this route, and only
// a clean CSV (email, first_name, last_name) is handed to Resend's importer.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Send the list as a form with a name and a CSV file." }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const file = form.get("file");
  if (!name) return NextResponse.json({ error: "Give the list a name." }, { status: 400 });
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Keep the name under ${MAX_NAME_LENGTH} characters.` }, { status: 400 });
  }
  if (!(file instanceof Blob)) return NextResponse.json({ error: "Add a CSV file." }, { status: 400 });
  if (file.size > MAX_CSV_BYTES) return NextResponse.json({ error: "That file is over 5 MB." }, { status: 400 });

  const { contacts, skipped, error: readError } = readContacts(await file.text());
  if (readError) return NextResponse.json({ error: readError }, { status: 400 });
  if (contacts.length === 0) return NextResponse.json({ error: "No valid email addresses found." }, { status: 400 });

  const segment = await resend.segments.create({ name });
  if (segment.error || !segment.data) {
    return NextResponse.json({ error: segment.error?.message ?? "Couldn't create the list." }, { status: 502 });
  }

  const csv = new Blob([toContactsCsv(contacts)], { type: "text/csv" });
  const imported = await resend.contacts.imports.create({
    file: csv,
    columnMap: { email: "email", firstName: "first_name", lastName: "last_name" },
    // Already-known contacts join the list too. People who unsubscribed stay
    // unsubscribed: the CSV has no unsubscribe column, so Resend keeps theirs.
    onConflict: "upsert",
    segments: [{ id: segment.data.id }],
  });
  if (imported.error || !imported.data) {
    return NextResponse.json({ error: imported.error?.message ?? "Couldn't import the contacts." }, { status: 502 });
  }

  return NextResponse.json({
    segment: { id: segment.data.id, name },
    importId: imported.data.id,
    contacts: contacts.length,
    skipped: skipped.length,
  });
}
