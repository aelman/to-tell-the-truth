import type { WebSocket } from "ws";

export let lastEvent: string | null = null;
export const clients = new Set<WebSocket>();

export function broadcast(data: string): void {
  lastEvent = data;
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(data);
    }
  }
}
