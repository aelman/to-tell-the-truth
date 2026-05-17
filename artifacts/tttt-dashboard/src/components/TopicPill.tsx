import React from "react";
import { Loader2 } from "lucide-react";

interface TopicPillProps {
  topic?: string;
  isGenerating?: boolean;
}

export function TopicPill({ topic, isGenerating }: TopicPillProps) {
  if (!topic) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="px-6 py-2 rounded-full border border-primary/50 bg-primary/10 text-primary font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(245,197,24,0.2)]">
        {topic}
      </div>
      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-primary/80">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating questions...</span>
        </div>
      )}
    </div>
  );
}
