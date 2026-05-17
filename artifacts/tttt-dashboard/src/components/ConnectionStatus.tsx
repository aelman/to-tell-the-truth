import React from "react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  status: "connected" | "disconnected" | "connecting";
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  return (
    <div 
      data-testid="status-connection"
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border shadow-sm text-xs font-bold tracking-wider"
    >
      <div 
        className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          status === "connected" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : 
          status === "connecting" ? "bg-yellow-500" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        )} 
      />
      <span className={cn(
        status === "connected" ? "text-green-500" : 
        status === "connecting" ? "text-yellow-500" : "text-red-500"
      )}>
        {status === "connected" ? "LIVE" : status === "connecting" ? "CONNECTING" : "DISCONNECTED"}
      </span>
    </div>
  );
}
