import { proxyActivities, sleep } from "@temporalio/workflow";
import type * as activities from "./activities";
import type { ScheduledSendInput } from "./shared";

const { deliverScheduledEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
  // Resend hiccups get retried; a refusal (bad address, unverified domain)
  // is marked non-retryable in the activity, so it fails right away.
  retry: { maximumAttempts: 5, initialInterval: "10 seconds" },
});

// Waits until the send time, then sends. Temporal keeps the timer durable:
// if the server or worker restarts, the wait picks up where it left off.
// Cancelling the workflow during the wait stops it before anything is sent.
export async function scheduledSend(input: ScheduledSendInput): Promise<string> {
  const wait = new Date(input.sendAt).getTime() - Date.now();
  if (wait > 0) await sleep(wait);
  return deliverScheduledEmail(input);
}
