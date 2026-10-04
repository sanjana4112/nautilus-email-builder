import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/image-rules";

// The browser uploads images straight to Vercel Blob. This route only hands
// out a short-lived upload pass, so the storage token never leaves the server.
// Note: there is no sign-in yet, so anyone who can reach the site can upload;
// the type and size limits keep that contained.
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage isn't set up (BLOB_READ_WRITE_TOKEN is missing)." },
      { status: 500 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_IMAGE_TYPES,
        maximumSizeInBytes: MAX_IMAGE_BYTES,
        // Two uploads of "banner.jpg" get different links instead of overwriting.
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
