"use client";

import { useState } from "react";
import Link from "next/link";
import { GameCard } from "@/components/fun/game-card";
import { GamePlayer } from "@/components/fun/game-player";
import { GAMES, Game } from "@/lib/games/games-config";
import { ArrowLeft } from "lucide-react";
import LeaderboardPanel from "@/components/fun/leaderboard-panel";

export default function FunPage() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handlePlayGame = (game: Game) => {
    setSelectedGame(game);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    // Don't clear selectedGame immediately to allow smooth closing animation
    setTimeout(() => setSelectedGame(null), 300);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors group cursor-pointer">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium font-body">Back</span>
        </Link>

        <div className="space-y-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading">
            Fun Zone
          </h1>
          <p className="text-muted-foreground font-medium font-body">
            Take a break and enjoy some interactive activities and games!
          </p>
        </div>

        {/* Game List Grid */}
        <div className="space-y-8 mb-10">
          {/* Competitive Leaderboard Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground font-heading flex items-center gap-2">
              🏆 Competitive Leaderboard Challenges
            </h2>
            <p className="text-sm text-muted-foreground font-bold font-body">
              These games score your performance. Save your score and compete on the global student leaderboards!
            </p>
            <div className="grid gap-6">
              {GAMES.filter(g => g.isLeaderboardEligible).map((game) => (
                <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
              ))}
            </div>
          </div>

          {/* Creative Sandbox Section */}
          <div className="space-y-4 pt-4 border-t-2 border-dashed border-border">
            <h2 className="text-xl font-bold text-foreground font-heading flex items-center gap-2">
              💡 Creative Sandbox & AI Toys
            </h2>
            <p className="text-sm text-muted-foreground font-bold font-body">
              Explore interactives like hand trackers and AI mood readers. Play freely without scoring!
            </p>
            <div className="grid gap-6">
              {GAMES.filter(g => !g.isLeaderboardEligible).map((game) => (
                <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboards Panel Grid */}
        <div className="mt-8">
          <LeaderboardPanel />
        </div>

        <GamePlayer
          game={selectedGame}
          isOpen={isPlayerOpen}
          onClose={handleClosePlayer}
        />
      </div>
    </div>
  );
}
