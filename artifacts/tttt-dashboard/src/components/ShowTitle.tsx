import React from "react";
import { Mic } from "lucide-react";

export function ShowTitle() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full text-center space-y-8 bg-background px-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="relative p-6 rounded-full border border-primary/30 bg-card shadow-[0_0_40px_rgba(245,197,24,0.1)]">
          <Mic className="w-16 h-16 text-primary animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-black text-primary tracking-wider drop-shadow-lg">
          TO TELL<br />THE TRUTH
        </h1>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        <p className="text-muted-foreground text-lg md:text-xl font-inter tracking-widest uppercase">
          Waiting for topic...
        </p>
      </div>
    </div>
  );
}
