import { Client, Connection } from "@temporalio/client";

// One Temporal connection for the app's server routes, made on first use.
let client: Promise<Client> | null = null;

export function getTemporalClient(): Promise<Client> {
  client ??= Connection.connect({ address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233" })
    .then((connection) => new Client({ connection }))
    .catch((err) => {
      client = null; // try again next time, e.g. once Temporal is started
      throw err;
    });
  return client;
}
