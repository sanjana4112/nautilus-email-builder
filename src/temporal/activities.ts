import { ApplicationFailure } from "@temporalio/activity";
import { deliver } from "@/lib/send";
import type { ScheduledSendInput } from "./shared";

// The step that actually sends, run by the worker at the scheduled time.
// Uses the same delivery code as "send now".
export async function deliverScheduledEmail({ html, subject, target }: ScheduledSendInput): Promise<string> {
  const result = await deliver(html, subject, target);
  if ("error" in result) {
    // Resend answered and said no: retrying won't help.
    throw ApplicationFailure.nonRetryable(result.error, "ResendRejected");
  }
  return result.id;
}
