import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Mic } from "lucide-react";
import { useGameSocket } from "@/hooks/useGameSocket";

import { ShowTitle } from "@/components/ShowTitle";
import { TopicPill } from "@/components/TopicPill";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ContestantCard } from "@/components/ContestantCard";
import { QuestionFeed } from "@/components/QuestionFeed";
import { VerdictPanel } from "@/components/VerdictPanel";

const queryClient = new QueryClient();

function DebugPanel({ state }: { state: object }) {
  return (
    <pre className="fixed bottom-0 left-0 right-0 max-h-40 overflow-auto bg-black/80 text-green-400 text-xs p-2 z-50 border-t border-green-800">
      {JSON.stringify(state, null, 2)}
    </pre>
  );
}

function Dashboard() {
  const { gameState, connectionStatus, resetGame } = useGameSocket();
  const {
    phase,
    topic,
    activeContestant,
    contestants,
    questionFeed,
    currentQuestionIndex,
    winner,
    explanation,
  } = gameState;

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background relative">
        <ConnectionStatus status={connectionStatus} />
        <ShowTitle />
        <DebugPanel state={gameState} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <ConnectionStatus status={connectionStatus} />

      {/* Header Bar */}
      <header
        data-testid="section-header"
        className="flex-none p-4 md:p-6 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-playfair font-black text-primary tracking-widest uppercase">
              To Tell The Truth
            </h1>
          </div>

          <TopicPill topic={topic} isGenerating={phase === "generating_questions"} />

          <div className="hidden md:block w-8" />
        </div>
      </header>

      {/* Main Content Area */}
      {phase !== "topic_chosen" && phase !== "generating_questions" && (
        <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6 md:gap-8 overflow-hidden">
          {/* Contestants Row */}
          <section
            data-testid="section-contestants"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-none"
          >
            <ContestantCard
              contestantNumber={1}
              isActive={
                activeContestant === 1 ||
                phase === "evaluating" ||
                phase === "verdict"
              }
              phase={phase}
              scores={contestants?.[1]?.scores}
              reasoning={contestants?.[1]?.reasoning}
            />
            <ContestantCard
              contestantNumber={2}
              isActive={
                activeContestant === 2 ||
                phase === "evaluating" ||
                phase === "verdict"
              }
              phase={phase}
              scores={contestants?.[2]?.scores}
              reasoning={contestants?.[2]?.reasoning}
            />
          </section>

          {/* Question Feed */}
          <section
            data-testid="section-questions"
            className="flex-grow min-h-0 flex flex-col"
          >
            <QuestionFeed
              feed={questionFeed}
              currentQuestionIndex={currentQuestionIndex}
              phase={phase}
            />
          </section>
        </main>
      )}

      {/* Topic-only phase */}
      {(phase === "topic_chosen" || phase === "generating_questions") && (
        <main className="flex-grow flex items-center justify-center p-6 text-center">
          <div className="max-w-2xl space-y-6">
            <p className="text-xl text-muted-foreground font-inter">
              Tonight's topic is
            </p>
            <h2 className="text-4xl md:text-6xl font-playfair font-black text-white drop-shadow-md">
              {topic}
            </h2>
          </div>
        </main>
      )}

      <DebugPanel state={gameState} />

      {/* Verdict / Evaluating Overlay */}
      <VerdictPanel
        phase={phase}
        winner={winner}
        explanation={explanation}
        contestants={contestants}
        onPlayAgain={resetGame}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Dashboard />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
