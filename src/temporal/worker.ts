import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";
import { TASK_QUEUE } from "./shared";

// The worker runs scheduled sends: it waits on Temporal for work, runs the
// workflow's timer, and calls the send step when it's time.
// Start it with `npm run worker`, next to `temporal server start-dev`.
async function run() {
  const connection = await NativeConnection.connect({ address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233" });
  const worker = await Worker.create({
    connection,
    taskQueue: TASK_QUEUE,
    workflowsPath: require.resolve("./workflows"),
    activities,
  });
  console.log(`Worker ready on task queue "${TASK_QUEUE}".`);
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
