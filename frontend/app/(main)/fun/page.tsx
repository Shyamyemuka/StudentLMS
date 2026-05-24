"use client";

import { useState } from "react";
import Link from "next/link";
import { GameCard } from "@/components/fun/game-card";
import { GamePlayer } from "@/components/fun/game-player";
import { GAMES, Game } from "@/lib/games/games-config";
import { ArrowLeft } from "lucide-react";

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
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B0D10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[#B0B0B0] hover:text-[#D4AF37] mb-6 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </Link>

        <div className="space-y-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#D4AF37]">
            Fun Zone
          </h1>
          <p className="text-[#B0B0B0]">
            Take a break and enjoy some interactive activities and games!
          </p>
        </div>

        <div className="grid gap-4">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
          ))}

          {GAMES.length === 0 && (
            <div className="text-center py-12 text-[#B0B0B0]">
              <p>No games available yet. Check back soon!</p>
            </div>
          )}
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
