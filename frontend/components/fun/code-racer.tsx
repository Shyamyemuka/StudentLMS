"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const CODE_SNIPPETS = [
  "const calculateEAR = (landmarks) => { return (leftEAR + rightEAR) / 2; };",
  "function processFrame() { if (!faceMesh || !video) return; requestAnimationFrame(processFrame); }",
  "create table public.game_scores ( id uuid primary key, user_id uuid, score integer );",
  "import { useState, useEffect } from 'react'; export default function Dashboard() { return <div />; }",
  "const channel = supabase.channel('notices').on('postgres_changes', () => { refetch(); }).subscribe();",
];

export default function CodeRacer() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [snippet, setSnippet] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(45);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Score/GameState Refs for unmount auto-save
  const scoreRef = useRef(0);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    scoreRef.current = Math.round(wpm * (accuracy / 100));
  }, [wpm, accuracy]);

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
            game_id: "code-racer",
            score: finalScore,
          }),
        }).catch((err) => console.error("Auto-save score failed:", err));
      }
    };
  }, []);

  const handleStart = () => {
    const randomSnippet = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
    setSnippet(randomSnippet);
    setTypedInput("");
    setGameState("playing");
    setTimeLeft(45);
    setWpm(0);
    setAccuracy(100);
    setStartTime(Date.now());
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

  // Calculate live stats
  useEffect(() => {
    if (gameState !== "playing" || !startTime || !typedInput) return;

    const timeSpentMin = (Date.now() - startTime) / 60000;
    if (timeSpentMin === 0) return;

    // Words = Typed characters / 5
    const wordCount = typedInput.length / 5;
    const computedWpm = Math.round(wordCount / timeSpentMin);
    setWpm(computedWpm);

    // Accuracy
    let correctCount = 0;
    const typedArr = typedInput.split("");
    const snippetArr = snippet.split("");
    
    typedArr.forEach((char, i) => {
      if (char === snippetArr[i]) {
        correctCount++;
      }
    });

    const computedAccuracy = Math.round((correctCount / typedInput.length) * 100) || 100;
    setAccuracy(computedAccuracy);

    // Completion check
    if (typedInput === snippet) {
      handleGameOver(computedWpm, computedAccuracy);
    }
  }, [typedInput, gameState, startTime, snippet]);

  const handleGameOver = async (finalWpm = wpm, finalAcc = accuracy) => {
    setGameState("gameover");
    if (timerRef.current) clearInterval(timerRef.current);

    const score = Math.round(finalWpm * (finalAcc / 100));

    // Save score to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch("/api/games/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: "code-racer",
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

  const renderSnippetChars = () => {
    const chars = snippet.split("");
    const typedChars = typedInput.split("");

    return chars.map((char, index) => {
      let colorClass = "text-foreground opacity-60";
      if (index < typedChars.length) {
        colorClass = typedChars[index] === char ? "text-green-500 font-bold" : "text-red-500 font-bold bg-red-100 dark:bg-red-900/30";
      }
      return (
        <span key={index} className={colorClass}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border-2 border-border rounded-xl text-center min-h-[400px]">
      {gameState === "idle" && (
        <div className="space-y-6">
          <div className="text-6xl animate-bounce">🏎️</div>
          <h2 className="text-2xl font-bold font-heading text-foreground">Code Racer Typing</h2>
          <p className="text-sm font-bold font-body text-muted-foreground max-w-md mx-auto">
            Test your programming typing speed! Type the highlighted snippet of code as accurately and quickly as possible. Score points based on WPM and typing accuracy!
          </p>
          <Button
            onClick={handleStart}
            className="w-full py-6 text-lg font-bold bg-primary text-primary-foreground border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all rounded-xl cursor-pointer"
          >
            Start Racer!
          </Button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="w-full max-w-2xl space-y-6">
          {/* Stats Bar */}
          <div className="flex justify-between items-center bg-background border-2 border-border rounded-xl p-3 font-bold font-heading shadow-hard-sm">
            <div className="text-lg text-primary">WPM: {wpm}</div>
            <div className="text-xs text-muted-foreground bg-primary/10 border border-primary/20 px-2 py-1 rounded">
              Accuracy: {accuracy}%
            </div>
            <div className="text-lg text-accent">Time Left: {timeLeft}s</div>
          </div>

          {/* Typing Area Code Display */}
          <div className="bg-background border-4 border-dashed border-border py-8 px-6 rounded-xl shadow-hard-md text-left select-none leading-relaxed font-mono break-all text-lg max-h-40 overflow-y-auto">
            {renderSnippetChars()}
          </div>

          {/* Hidden Input field mapped to full visual focus */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Type code exactly as shown above..."
              className="w-full bg-background border-2 border-border rounded-xl px-4 py-4 font-mono text-sm text-foreground focus:outline-none focus:border-primary shadow-hard-sm"
              autoFocus
            />
          </div>

          {/* Explicit Save & Exit Button during active play (normal & fullscreen) */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={() => handleGameOver()}
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
          <h2 className="text-3xl font-bold font-heading text-foreground">Race Completed!</h2>
          <div className="space-y-2 font-bold font-body">
            <p className="text-lg text-muted-foreground">
              Final Typing speed: <span className="text-primary text-xl font-extrabold">{wpm} WPM</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Accuracy rating: <span className="text-[#3b82f6]">{accuracy}%</span>
            </p>
            <p className="text-base text-foreground mt-2">
              Calculated competitive score: <span className="text-accent font-extrabold text-xl">{Math.round(wpm * (accuracy / 100))}</span>
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleStart}
              className="py-5 px-6 font-bold bg-primary text-primary-foreground border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all rounded-xl cursor-pointer"
            >
              Race Again
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
