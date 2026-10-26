import Typesense from "typesense";
import { ENV } from "./env";

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: ENV.TYPESENSE.HOST,
      port: ENV.TYPESENSE.PORT,
      protocol: ENV.TYPESENSE.PROTOCOL,
    },
  ],
  apiKey: ENV.TYPESENSE.API_KEY,
  connectionTimeoutSeconds: 2,
});

export async function checkTypesenseHealth(): Promise<boolean> {
  try {
    const health = await typesenseClient.health.retrieve();
    return health.ok;
  } catch {
    return false;
  }
}
