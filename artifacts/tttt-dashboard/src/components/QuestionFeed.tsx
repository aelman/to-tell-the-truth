import React, { useEffect, useRef } from "react";
import { QuestionFeedEntry } from "@/hooks/useOpenHomeSocket";
import { cn } from "@/lib/utils";

interface QuestionFeedProps {
  feed?: QuestionFeedEntry[];
  currentQuestionIndex?: number;
  phase: string;
}

export function QuestionFeed({ feed = [], currentQuestionIndex = 0, phase }: QuestionFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feed]);

  if (!feed || feed.length === 0) return null;

  return (
    <div 
      className="flex flex-col h-[40vh] md:h-[40vh] max-h-[50vh] overflow-y-auto bg-card rounded-xl border border-card-border p-4 md:p-6 space-y-8"
      ref={scrollRef}
      data-testid="section-questions"
    >
      {feed.map((item, idx) => (
        <div key={`q-${item.questionIndex}-${idx}`} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 text-primary">
            <span className="font-bold text-lg">Q{item.questionIndex + 1}</span>
            <div className="h-px flex-1 bg-primary/20" />
          </div>
          <div className="text-lg md:text-xl font-medium text-foreground px-4 md:px-8">
            {item.questionText}
          </div>
          
          <div className="space-y-3 px-4 md:px-8 font-mono text-sm md:text-base">
            <div className="flex">
              <span className="text-blue-500 mr-2">╔ C1 ▸</span>
              <span className="text-blue-200">
                {item.answers.find(a => a.contestant === 1)?.text || (
                  <span className="opacity-50">
                    [awaiting answer...]<span className="animate-cursor-blink ml-1 bg-blue-500 w-2 h-4 inline-block align-middle" />
                  </span>
                )}
              </span>
            </div>
            <div className="flex">
              <span className="text-purple-500 mr-2">╚ C2 ▸</span>
              <span className="text-purple-200">
                {item.answers.find(a => a.contestant === 2)?.text || (
                  <span className="opacity-50">
                    [awaiting answer...]<span className="animate-cursor-blink ml-1 bg-purple-500 w-2 h-4 inline-block align-middle" />
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
