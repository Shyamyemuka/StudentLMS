"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Question {
  text: string;
  answer: number;
}

export default function MathBlitz() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [question, setQuestion] = useState<Question>({ text: "2 + 2", answer: 4 });
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [scorePopups, setScorePopups] = useState<{ id: number; text: string }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const popupIdRef = useRef(0);
  const supabase = createClient();

  // Score/GameState Refs for unmount auto-save
  const scoreRef = useRef(score);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Unmount auto-save hook
  useEffect(() => {
    return () => {
      if (gameStateRef.current === "playing" && scoreRef.current > 0) {
        const finalScore = scoreRef.current;
        fetch("/api/games/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: "math-blitz",
            score: finalScore,
          }),
        }).catch((err) => console.error("Auto-save score failed:", err));
      }
    };
  }, []);

  // Mount auto-start trigger (direct play)
  useEffect(() => {
    handleStart();
  }, []);

  const generateQuestion = (): Question => {
    const topics = ["derivative", "modulo", "binary", "determinant", "power", "log"];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    let text = "";
    let answer = 0;

    switch (topic) {
      case "derivative": {
        const coef = Math.floor(Math.random() * 8) + 2; // 2 to 9
        const pow = Math.floor(Math.random() * 3) + 2;  // 2 to 4
        text = `d/dx(${coef}x^${pow}) at x=2`;
        answer = coef * pow * Math.pow(2, pow - 1);
        break;
      }
      case "modulo": {
        const num1 = Math.floor(Math.random() * 80) + 20; // 20 to 99
        const num2 = Math.floor(Math.random() * 7) + 3;   // 3 to 9
        text = `${num1} mod ${num2}`;
        answer = num1 % num2;
        break;
      }
      case "binary": {
        const val = Math.floor(Math.random() * 30) + 2; // 2 to 31
        text = `${val.toString(2)} in bin`;
        answer = val;
        break;
      }
      case "determinant": {
        const a = Math.floor(Math.random() * 5) + 1;
        const b = Math.floor(Math.random() * 4) + 1;
        const c = Math.floor(Math.random() * 4) + 1;
        const d = Math.floor(Math.random() * 5) + 1;
        text = `det([${a}, ${b}; ${c}, ${d}])`;
        answer = (a * d) - (b * c);
        break;
      }
      case "power": {
        const p = Math.floor(Math.random() * 6) + 3; // 2^3 to 2^8
        text = `2^${p}`;
        answer = Math.pow(2, p);
        break;
      }
      default: { // log
        const p = Math.floor(Math.random() * 5) + 2; // 2 to 6
        const base = Math.random() > 0.5 ? 2 : 10;
        const val = Math.pow(base, p);
        text = `log${base}(${val})`;
        answer = p;
        break;
      }
    }

    return { text, answer };
  };

  const handleStart = () => {
    setGameState("playing");
    setScore(0);
    setTimeLeft(60);
    setStreak(0);
    setMultiplier(1);
    setQuestion(generateQuestion());
    setUserAnswer("");
    setScorePopups([]);
  };

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleGameOver = async () => {
    setGameState("gameover");
    if (timerRef.current) clearInterval(timerRef.current);

    // Save score to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch("/api/games/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: "math-blitz",
            score: score,
          }),
        });
        toast.success(`Score of ${score} saved to Leaderboards!`);
      } else {
        toast.info("Play logged-in to compete on global Leaderboards!");
      }
    } catch (err) {
      console.error("Failed to save score:", err);
    }
  };

  const addScorePopup = (text: string) => {
    const id = popupIdRef.current++;
    setScorePopups((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setScorePopups((prev) => prev.filter((p) => p.id !== id));
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameState !== "playing" || !userAnswer.trim()) return;

    const numericAnswer = parseInt(userAnswer.trim(), 10);
    if (numericAnswer === question.answer) {
      const basePoints = 100;
      const gained = basePoints * multiplier;
      setScore((prev) => prev + gained);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Adjust multiplier based on answer streak
      const newMultiplier = Math.min(5, Math.floor(newStreak / 5) + 1);
      setMultiplier(newMultiplier);

      addScorePopup(`+${gained} ${newMultiplier > 1 ? `(${newMultiplier}x Combo!)` : ""}`);
      setQuestion(generateQuestion());
      setUserAnswer("");
    } else {
      setStreak(0);
      setMultiplier(1);
      setUserAnswer("");
      addScorePopup("❌ Incorrect!");
      toast.error(`Incorrect! Answer was ${question.answer}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border-2 border-border rounded-xl text-center min-h-[400px] text-[#2d2d2d] dark:text-[#EAEAEA]">
      {gameState === "idle" && (
        <div className="space-y-6">
          <div className="text-6xl animate-bounce">⚡</div>
          <h2 className="text-2xl font-bold font-heading text-[#2d2d2d] dark:text-[#EAEAEA]">Math Blitz Solver</h2>
          <p className="text-sm font-bold font-body text-[#706b60] dark:text-[#B0B0B0] max-w-md mx-auto">
            Solve basic equations as quickly as possible. Every streak of 5 correct answers increases your score multiplier! Can you conquer the whiteboard?
          </p>
          <Button
            onClick={handleStart}
            className="w-full py-6 text-lg font-bold bg-primary text-primary-foreground border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all rounded-xl cursor-pointer"
          >
            Start Arithmetic Blitz!
          </Button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="w-full max-w-md space-y-6 relative">
          {/* Score & Timer Dashboard */}
          <div className="flex justify-between items-center bg-background border-2 border-border rounded-xl p-3 font-bold font-heading shadow-hard-sm">
            <div className="text-lg text-[#2d2d2d] dark:text-[#EAEAEA] font-extrabold">Score: {score}</div>
            <div className="text-xs text-[#706b60] dark:text-[#B0B0B0] bg-muted border border-border px-2 py-1 rounded font-bold">
              Combo: {multiplier}x ({streak} streak)
            </div>
            <div className="text-lg text-red-600 dark:text-red-400 font-extrabold">Time: {timeLeft}s</div>
          </div>

          {/* Big Equation Box */}
          <div className="bg-background border-4 border-dashed border-border py-10 px-4 rounded-xl shadow-hard-md relative overflow-hidden">
            <div className="text-5xl font-extrabold font-heading text-[#2d2d2d] dark:text-[#EAEAEA] select-none">
              {question.text} = ?
            </div>

            {/* Score Float Animation Popups */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {scorePopups.map((popup) => (
                <div
                  key={popup.id}
                  className="animate-bounce text-xl font-bold font-heading text-[#2d2d2d] dark:text-[#EAEAEA] bg-background border-2 border-border rounded-xl px-3 py-1.5 shadow-hard-md"
                >
                  {popup.text}
                </div>
              ))}
            </div>
          </div>

          {/* User Answer Submit Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type answer..."
              autoFocus
              className="bg-background border-2 border-border rounded-xl text-center text-xl font-bold py-6 text-[#2d2d2d] dark:text-[#EAEAEA] placeholder:text-[#706b60]/50"
            />
            <Button
              type="submit"
              className="px-6 bg-accent text-accent-foreground border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all rounded-xl cursor-pointer"
            >
              Submit
            </Button>
          </form>

          {/* Explicit Save & Exit Button during active play (normal & fullscreen) */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleGameOver}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all rounded-xl cursor-pointer py-3 text-xs"
            >
              💾 Save Current Score & Exit Game
            </Button>
          </div>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="space-y-6">
          <div className="text-6xl">🏆</div>
          <h2 className="text-3xl font-bold font-heading text-[#2d2d2d] dark:text-[#EAEAEA]">Time's Up!</h2>
          <p className="text-lg text-[#706b60] dark:text-[#B0B0B0] font-bold font-body">
            You scored a blitzing <span className="text-primary text-xl font-extrabold">{score}</span> points!
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleStart}
              className="py-5 px-6 font-bold bg-primary text-primary-foreground border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all rounded-xl cursor-pointer"
            >
              Play Again
            </Button>
            <Button
              onClick={() => setGameState("idle")}
              variant="outline"
              className="py-5 px-6 font-bold border-2 border-border rounded-xl cursor-pointer"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
