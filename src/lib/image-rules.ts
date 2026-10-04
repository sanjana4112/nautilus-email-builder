// Upload rules shared by the editor (checks before uploading) and the upload
// route (enforces them). No secrets here, so the browser can import it.

// Image types every inbox can show. WebP and SVG are left out: Outlook and
// Gmail don't display them reliably.
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
