"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trophy, Medal, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  score: number;
  created_at: string;
}

export default function LeaderboardPanel() {
  const [selectedGame, setSelectedGame] = useState<"math-blitz" | "code-racer" | "subway">("math-blitz");
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async (gameId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/scores?game_id=${gameId}`);
      const data = await res.json();
      if (data.leaderboard) {
        setLeaders(data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(selectedGame);
  }, [selectedGame]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-[#D4AF37]" />; // Gold
      case 2:
        return <Medal className="w-5 h-5 text-[#C0C0C0]" />; // Silver
      case 3:
        return <Medal className="w-5 h-5 text-[#CD7F32]" />; // Bronze
      default:
        return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <Card className="bg-card border-2 border-border shadow-hard-xl rounded-xl transition-colors duration-200">
      <CardHeader className="border-b-2 border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold font-heading text-foreground">Global Hall of Fame 🏆</CardTitle>
            <CardDescription className="text-sm font-medium font-body text-muted-foreground">
              See the absolute highest scoring scholars competing in our training games
            </CardDescription>
          </div>

          {/* Scored Game Selector Toggle */}
          <div className="flex flex-wrap gap-2 bg-muted/30 p-1.5 border-2 border-border rounded-xl">
            <button
              onClick={() => setSelectedGame("math-blitz")}
              className={`px-3 py-1.5 text-xs font-bold font-body transition-all cursor-pointer rounded-lg ${
                selectedGame === "math-blitz"
                  ? "bg-primary text-primary-foreground border border-border shadow-hard-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent border border-transparent"
              }`}
            >
              ⚡ Math Blitz
            </button>
            <button
              onClick={() => setSelectedGame("code-racer")}
              className={`px-3 py-1.5 text-xs font-bold font-body transition-all cursor-pointer rounded-lg ${
                selectedGame === "code-racer"
                  ? "bg-primary text-primary-foreground border border-border shadow-hard-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent border border-transparent"
              }`}
            >
              🏎️ Code Racer
            </button>
            <button
              onClick={() => setSelectedGame("subway")}
              className={`px-3 py-1.5 text-xs font-bold font-body transition-all cursor-pointer rounded-lg ${
                selectedGame === "subway"
                  ? "bg-primary text-primary-foreground border border-border shadow-hard-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent border border-transparent"
              }`}
            >
              🏃 Subway Surfer
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Star className="w-12 h-12 text-muted/40 mx-auto animate-pulse" />
            <p className="text-muted-foreground font-bold font-body text-sm">No recorded high scores yet</p>
            <p className="text-xs text-muted-foreground font-medium font-body">Be the first to play and claim your rank!</p>
          </div>
        ) : (
          <div className="border-2 border-border rounded-xl overflow-hidden shadow-hard-sm bg-background">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-card">
                  <th className="py-3 px-4 font-bold text-muted-foreground text-center w-16">Rank</th>
                  <th className="py-3 px-4 font-bold text-muted-foreground">Scholar</th>
                  <th className="py-3 px-4 font-bold text-muted-foreground text-right w-28">Score</th>
                  <th className="py-3 px-4 font-bold text-muted-foreground text-right w-36">Achieved</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((entry, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={entry.user_id}
                      className={`border-b border-border/40 last:border-b-0 hover:bg-muted/30 transition-colors font-bold ${
                        rank <= 3 ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center items-center">
                          {getRankBadge(rank)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground font-heading text-base">
                        {entry.full_name}
                      </td>
                      <td className="py-3 px-4 text-right text-primary text-base font-heading">
                        {entry.score}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
