import type { WebSocket } from "ws";

export let lastEvent: string | null = null;
export const clients = new Set<WebSocket>();

export function broadcast(data: string): void {
  lastEvent = data;
  let sent = 0;
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(data);
      sent++;
    }
  }
  console.log(`[broadcast] clients=${clients.size} sent=${sent} phase=${JSON.parse(data).phase}`);
}
