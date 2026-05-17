import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ContestantCardProps {
  contestantNumber: 1 | 2;
  isActive: boolean;
  phase: string;
  scores?: { accuracy: number; depth: number; confidence: number };
  reasoning?: string;
}

export function ContestantCard({ contestantNumber, isActive, phase, scores, reasoning }: ContestantCardProps) {
  const isVerdict = phase === "verdict";
  const [animatedScores, setAnimatedScores] = useState({ accuracy: 0, depth: 0, confidence: 0 });
  const totalScore = scores ? scores.accuracy + scores.depth + scores.confidence : 0;
  
  useEffect(() => {
    if (isVerdict && scores) {
      // Small delay before starting animation
      const timer = setTimeout(() => {
        setAnimatedScores(scores);
      }, 500);
      return () => clearTimeout(timer);
    } else if (!isVerdict) {
      setAnimatedScores({ accuracy: 0, depth: 0, confidence: 0 });
    }
  }, [isVerdict, scores]);

  const colorClass = contestantNumber === 1 ? "bg-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-purple-500 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]";
  const borderColorClass = contestantNumber === 1 ? "border-blue-500" : "border-purple-500";

  return (
    <div 
      data-testid={`card-contestant-${contestantNumber}`}
      className={cn(
        "flex flex-col p-6 rounded-xl border bg-card transition-all duration-500",
        isActive ? "opacity-100 shadow-[0_0_20px_rgba(245,197,24,0.5)] border-primary scale-[1.02]" : "opacity-50 border-card-border"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn("text-xl font-black tracking-widest", contestantNumber === 1 ? "text-blue-500" : "text-purple-500")}>
          CONTESTANT {contestantNumber}
        </h2>
        {isVerdict && (
          <div className={cn("text-2xl font-black font-playfair", contestantNumber === 1 ? "text-blue-400" : "text-purple-400")}>
            {totalScore} / 30
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6 flex-grow">
        {[
          { label: "Accuracy", value: animatedScores.accuracy },
          { label: "Depth", value: animatedScores.depth },
          { label: "Confidence", value: animatedScores.confidence }
        ].map((stat) => (
          <div key={stat.label} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              <span>{stat.label}</span>
              {isVerdict && <span>{stat.value}/10</span>}
            </div>
            <div className="h-2 w-full bg-background rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-1000 ease-out rounded-full", colorClass)}
                style={{ width: `${(stat.value / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {isVerdict && reasoning && (
        <div className="mt-auto p-4 rounded-lg bg-background/50 border border-white/5">
          <p className="text-sm italic text-muted-foreground font-playfair leading-relaxed">
            "{reasoning}"
          </p>
        </div>
      )}
    </div>
  );
}
