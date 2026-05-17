import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { ContestantCard } from "./ContestantCard";
import { Button } from "@/components/ui/button";

interface VerdictPanelProps {
  winner?: 1 | 2;
  explanation?: string;
  contestants?: {
    1: { scores?: { accuracy: number; depth: number; confidence: number }; reasoning?: string };
    2: { scores?: { accuracy: number; depth: number; confidence: number }; reasoning?: string };
  };
  onPlayAgain: () => void;
  phase: string;
}

export function VerdictPanel({ winner, explanation, contestants, onPlayAgain, phase }: VerdictPanelProps) {
  const [revealWinner, setRevealWinner] = useState(false);

  useEffect(() => {
    if (phase === "verdict" && winner) {
      const timer = setTimeout(() => {
        setRevealWinner(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f5c518', '#ffffff', winner === 1 ? '#3b82f6' : '#a855f7']
        });
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setRevealWinner(false);
    }
  }, [phase, winner]);

  if (phase === "evaluating") {
    return (
      <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary animate-spin-ring opacity-80" />
          <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-primary/50 animate-spin-ring" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
        </div>
        <h2 className="text-3xl md:text-5xl font-playfair font-black text-primary text-center tracking-wider">
          The panel is deliberating...
        </h2>
      </div>
    );
  }

  if (phase === "verdict") {
    return (
      <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md overflow-y-auto" data-testid="section-verdict">
        <div className="min-h-screen p-6 md:p-12 flex flex-col max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-8 duration-700">
            <h2 className="text-3xl font-inter text-muted-foreground uppercase tracking-[0.3em]">
              Final Verdict
            </h2>
            <div className="w-24 h-px bg-primary/50 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <ContestantCard 
              contestantNumber={1} 
              isActive={revealWinner ? winner === 1 : true} 
              phase={phase}
              scores={contestants?.[1]?.scores}
              reasoning={contestants?.[1]?.reasoning}
            />
            <ContestantCard 
              contestantNumber={2} 
              isActive={revealWinner ? winner === 2 : true} 
              phase={phase}
              scores={contestants?.[2]?.scores}
              reasoning={contestants?.[2]?.reasoning}
            />
          </div>

          {revealWinner && (
            <div className="text-center space-y-8 animate-in zoom-in fade-in duration-1000 flex-grow flex flex-col justify-center">
              <div className="space-y-4">
                <p className="text-xl md:text-2xl text-muted-foreground uppercase tracking-widest">
                  The Real Expert Is
                </p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-black text-primary drop-shadow-[0_0_30px_rgba(245,197,24,0.5)]">
                  CONTESTANT {winner}
                </h1>
              </div>
              
              {explanation && (
                <div className="max-w-3xl mx-auto bg-card p-6 md:p-8 rounded-xl border border-primary/20 shadow-xl">
                  <p className="text-lg md:text-xl text-white font-inter leading-relaxed">
                    {explanation}
                  </p>
                </div>
              )}

              <div className="pt-8 pb-12">
                <Button 
                  onClick={onPlayAgain}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-widest uppercase px-12 py-6 text-lg rounded-full shadow-[0_0_20px_rgba(245,197,24,0.3)] transition-all hover:scale-105"
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
