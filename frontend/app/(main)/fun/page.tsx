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
        <div className="grid gap-6 mb-10">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
          ))}

          {GAMES.length === 0 && (
            <div className="text-center py-12 text-[#B0B0B0]">
              <p>No games available yet. Check back soon!</p>
            </div>
          )}
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
