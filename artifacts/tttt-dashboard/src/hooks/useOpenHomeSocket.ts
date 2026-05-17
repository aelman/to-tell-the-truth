import { useState, useEffect, useRef, useCallback } from 'react';

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

const initialState: GameState = { phase: "intro" };

export function useOpenHomeSocket() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus("connecting");
    const wsUrl = import.meta.env.VITE_OPENHOME_WS_URL;
    
    if (!wsUrl) {
      console.warn("VITE_OPENHOME_WS_URL is not set");
      setConnectionStatus("disconnected");
      return;
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.data_type === "tttt_state") {
            setGameState((prev) => {
              if (data.phase === "intro") {
                return initialState;
              }
              return { ...prev, ...data };
            });
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("disconnected");
        wsRef.current = null;
        
        // Reconnect with exponential backoff
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, timeout);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("WebSocket creation error:", e);
      setConnectionStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { gameState, connectionStatus };
}
