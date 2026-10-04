// Names and data shared by the app (which starts and cancels scheduled sends),
// the workflow, and the worker. Only type imports, so Temporal's workflow
// sandbox can load it.
import type { Target } from "@/lib/send";

export const TASK_QUEUE = "email-sends";
export const WORKFLOW_TYPE = "scheduledSend";

// Same as the "send now" target (a type-only import, so the sandbox never loads lib/send).
export type ScheduledTarget = Target;

// Everything needed to send later. The HTML is built when the send is
// scheduled, so editing the design afterwards doesn't change it.
export type ScheduledSendInput = {
  html: string;
  subject: string;
  target: ScheduledTarget;
  sendAt: string; // ISO date and time
};

// Shown in the Scheduled tab (stored as the workflow's memo).
export type ScheduledSendMemo = {
  subject: string;
  recipient: string;
  sendAt: string;
};
