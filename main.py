import json

import requests

from src.agent.capability import MatchingCapability
from src.agent.capability_worker import CapabilityWorker
from src.main import AgentWorker

NUM_QUESTIONS = 5

SCORE_DIMENSIONS = ("accuracy", "depth", "confidence")

QUESTION_SYSTEM_PROMPT = (
    "You are a game show question writer for 'To Tell The Truth'. "
    "Return ONLY a JSON array of exactly 5 question strings — no prose, no keys, just the array."
)

EVAL_SYSTEM_PROMPT = (
    "You are an expert evaluator for 'To Tell The Truth'. "
    "Return ONLY a valid JSON object — no prose, no markdown fences."
)


class ToTellTheTruthCapability(MatchingCapability):
    worker: AgentWorker = None
    capability_worker: CapabilityWorker = None

    # Accumulated question feed — rebuilt each game, sent in full on every update
    _question_feed: list = []

    #{{register capability}}

    def call(self, worker: AgentWorker):
        self.worker = worker
        self.capability_worker = CapabilityWorker(self)
        self._question_feed = []
        self.worker.session_tasks.create(self._run())

    # ------------------------------------------------------------------ helpers

    def _ui(self, phase: str, **kwargs):
        """POST a game-state update to the Replit relay server."""
        url = self.capability_worker.get_api_keys("replit_webhook_url")
        secret = self.capability_worker.get_api_keys("replit_webhook_secret")
        if not url:
            self.worker.editor_logging_handler.warning(
                "tttt: replit_webhook_url API key is not set — skipping UI update"
            )
            return
        try:
            response = requests.post(
                url,
                json={"phase": phase, **kwargs},
                headers={"x-webhook-secret": secret or ""},
                timeout=5,
            )
            if not response.ok:
                self.worker.editor_logging_handler.warning(
                    f"tttt: Replit relay returned {response.status_code} for phase={phase}"
                )
        except Exception as exc:
            self.worker.editor_logging_handler.warning(
                f"tttt: failed to POST phase={phase} to Replit — {exc}"
            )

    def _llm(self, prompt: str, system: str = "") -> str:
        return self.capability_worker.text_to_text_response(
            prompt, system_prompt=system
        )

    # --------------------------------------------------------------- game logic

    async def _run(self):
        try:
            await self._play_game()
        finally:
            self.capability_worker.resume_normal_flow()

    async def _play_game(self):
        # ── Intro ──────────────────────────────────────────────────────────────
        await self.capability_worker.speak(
            "Welcome to To Tell The Truth! "
            "I'll ask two contestants the same five questions about a topic of expertise, "
            "then decide who is the real expert based on their answers. "
            "What topic should today's expert know about?"
        )
        self._ui("intro")

        topic = await self.capability_worker.user_response()
        self._ui("topic_chosen", topic=topic)

        # ── Generate questions ─────────────────────────────────────────────────
        await self.capability_worker.speak(
            f"Great — {topic}. Let me put together five questions."
        )
        self._ui("generating_questions", topic=topic)

        questions = self._generate_questions(topic)

        # Seed the question feed with empty answer slots
        self._question_feed = [
            {"questionIndex": i, "questionText": q, "answers": []}
            for i, q in enumerate(questions)
        ]
        self._ui("questions_ready", topic=topic, questions=questions,
                 questionFeed=self._question_feed)

        # ── Interview Player 1 ─────────────────────────────────────────────────
        await self.capability_worker.speak(
            f"Here we go! Contestant One, I'll ask you five questions about {topic}. "
            "Answer as fully as you can."
        )
        self._ui("player_intro", activeContestant=1, topic=topic)

        p1_answers = await self._interview(contestant=1, questions=questions)

        # ── Interview Player 2 ─────────────────────────────────────────────────
        await self.capability_worker.speak(
            "Thank you, Contestant One. "
            "Contestant Two, you'll now get the very same five questions. Ready?"
        )
        self._ui("player_intro", activeContestant=2, topic=topic)

        p2_answers = await self._interview(contestant=2, questions=questions)

        # ── Evaluation ────────────────────────────────────────────────────────
        await self.capability_worker.speak(
            "Excellent! Let me study both sets of answers and reach a verdict."
        )
        self._ui("evaluating", topic=topic)

        scores = self._evaluate(topic, questions, p1_answers, p2_answers)
        winner = scores.get("winner", 1)
        explanation = scores.get(
            "explanation",
            f"Contestant {winner} demonstrated deeper expertise on {topic}.",
        )

        self._ui(
            "verdict",
            topic=topic,
            questionFeed=self._question_feed,
            contestants=scores.get("contestants"),
            winner=winner,
            explanation=explanation,
        )

        # ── Dramatic reveal ───────────────────────────────────────────────────
        await self.capability_worker.speak(
            f"Will the real expert on {topic} — please stand up!"
        )
        await self.worker.session_tasks.sleep(2)
        await self.capability_worker.speak(
            f"Contestant {winner}, you are the real expert! "
            f"{explanation} "
            "Thanks for playing To Tell The Truth!"
        )

    async def _interview(self, contestant: int, questions: list) -> list:
        """Ask all five questions to one contestant and return their answers."""
        answers = []
        for idx, question in enumerate(questions):
            await self.capability_worker.speak(f"Question {idx + 1}: {question}")
            self._ui(
                "question_asked",
                activeContestant=contestant,
                currentQuestionIndex=idx,
                questionFeed=self._question_feed,
            )

            answer = await self.capability_worker.user_response()
            answers.append(answer)
            await self.worker.session_tasks.sleep(2)

            # Append to the feed entry for this question
            self._question_feed[idx]["answers"].append(
                {"contestant": contestant, "text": answer}
            )
            self._ui(
                "answer_received",
                activeContestant=contestant,
                currentQuestionIndex=idx,
                questionFeed=self._question_feed,
            )
        return answers

    # -------------------------------------------------------------------- LLM

    def _generate_questions(self, topic: str) -> list:
        raw = self._llm(
            f"Generate exactly {NUM_QUESTIONS} clear, accessible questions "
            f"that test solid knowledge of: {topic}. "
            "Avoid obscure trivia — prefer questions a knowledgeable enthusiast could answer. "
            "Return a JSON array of strings only.",
            system=QUESTION_SYSTEM_PROMPT,
        )
        try:
            questions = json.loads(raw.strip())
            if isinstance(questions, list) and len(questions) >= NUM_QUESTIONS:
                return [str(q) for q in questions[:NUM_QUESTIONS]]
        except (json.JSONDecodeError, ValueError):
            pass

        # Graceful fallback: split on newlines
        lines = [l.strip(" -•\t") for l in raw.splitlines() if l.strip()]
        questions = [l for l in lines if len(l) > 10][:NUM_QUESTIONS]
        while len(questions) < NUM_QUESTIONS:
            questions.append(f"What is the most important principle in {topic}?")
        return questions

    def _evaluate(
        self,
        topic: str,
        questions: list,
        p1_answers: list,
        p2_answers: list,
    ) -> dict:
        qa_block = lambda answers: "\n".join(
            f"Q{i+1}: {questions[i]}\nA: {answers[i]}" for i in range(NUM_QUESTIONS)
        )

        prompt = f"""You are judging a "To Tell The Truth" game show.
Topic of expertise: {topic}

Contestant 1's answers:
{qa_block(p1_answers)}

Contestant 2's answers:
{qa_block(p2_answers)}

Score each contestant on three dimensions (each 0–10):
- accuracy: factual correctness
- depth: detail and insight beyond surface knowledge
- confidence: specificity and command of subject

Then decide who is the real expert.

Return ONLY this JSON (fill in numbers and strings):
{{
  "contestants": {{
    "1": {{
      "scores": {{"accuracy": <int>, "depth": <int>, "confidence": <int>}},
      "reasoning": "<one sentence>"
    }},
    "2": {{
      "scores": {{"accuracy": <int>, "depth": <int>, "confidence": <int>}},
      "reasoning": "<one sentence>"
    }}
  }},
  "winner": <1 or 2>,
  "explanation": "<one sentence naming the expert and why>"
}}"""

        raw = self._llm(prompt, system=EVAL_SYSTEM_PROMPT)

        try:
            result = json.loads(raw.strip())
            # Ensure integer keys match what React expects (contestants[1], contestants[2])
            contestants = result.get("contestants", {})
            result["contestants"] = {
                int(k): v for k, v in contestants.items()
            }
            return result
        except (json.JSONDecodeError, KeyError, ValueError):
            return {
                "contestants": {
                    1: {"scores": {d: 5 for d in SCORE_DIMENSIONS}, "reasoning": ""},
                    2: {"scores": {d: 5 for d in SCORE_DIMENSIONS}, "reasoning": ""},
                },
                "winner": 1,
                "explanation": f"Contestant 1 appeared to be the real expert on {topic}.",
            }
