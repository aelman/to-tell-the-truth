import { useState, useEffect, useRef, useCallback } from "react";

export type GamePhase =
  | "intro"
  | "topic_chosen"
  | "generating_questions"
  | "questions_ready"
  | "player_intro"
  | "question_asked"
  | "answer_received"
  | "evaluating"
  | "verdict";

export type QuestionFeedEntry = {
  questionIndex: number;
  questionText: string;
  answers: {
    contestant: 1 | 2;
    text: string;
  }[];
};

export type GameState = {
  phase: GamePhase;
  topic?: string;
  questions?: string[];
  activeContestant?: 1 | 2;
  currentQuestionIndex?: number;
  questionFeed?: QuestionFeedEntry[];
  contestants?: {
    1: { scores?: { accuracy: number; depth: number; confidence: number }; reasoning?: string };
    2: { scores?: { accuracy: number; depth: number; confidence: number }; reasoning?: string };
  };
  winner?: 1 | 2;
  explanation?: string;
};

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

const initialState: GameState = { phase: "intro" };

function getWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws`;
}

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("reconnecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus("reconnecting");

    try {
      const ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        if (!isMounted.current) return;
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const data = JSON.parse(event.data as string) as GameState & { data_type?: string };
          setGameState((prev) => {
            if (data.phase === "intro") {
              return initialState;
            }
            return { ...prev, ...data };
          });
        } catch (e) {
          console.error("Failed to parse WebSocket message", e);
        }
      };

      ws.onclose = () => {
        if (!isMounted.current) return;
        setConnectionStatus("disconnected");
        wsRef.current = null;

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) connect();
        }, delay);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("WebSocket creation error:", e);
      setConnectionStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const resetGame = useCallback(() => {
    setGameState(initialState);
  }, []);

  return { gameState, connectionStatus, resetGame };
}
