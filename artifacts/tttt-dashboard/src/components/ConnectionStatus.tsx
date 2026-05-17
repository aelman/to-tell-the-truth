import { cn } from "@/lib/utils";
import type { ConnectionStatus as ConnectionStatusType } from "@/hooks/useGameSocket";

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  return (
    <div
      data-testid="status-connection"
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border shadow-sm text-xs font-bold tracking-wider"
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          status === "connected"
            ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"
            : status === "reconnecting"
            ? "bg-amber-400 animate-pulse"
            : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        )}
      />
      <span
        className={cn(
          status === "connected"
            ? "text-green-500"
            : status === "reconnecting"
            ? "text-amber-400"
            : "text-red-500"
        )}
      >
        {status === "connected"
          ? "LIVE"
          : status === "reconnecting"
          ? "RECONNECTING…"
          : "DISCONNECTED"}
      </span>
    </div>
  );
}
