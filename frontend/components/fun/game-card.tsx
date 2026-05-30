"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Image from "next/image";
import { Game } from "@/lib/games/games-config";

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          {/* Game Image */}
          <div className="relative w-full md:w-48 h-48 md:h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {game.image ? (
              <Image
                src={game.image}
                alt={game.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            ) : null}
            {/* Fallback gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#4CAF8F]/20 flex items-center justify-center">
              <Play className="w-12 h-12 text-[#D4AF37]/50" />
            </div>
          </div>

          {/* Game Info */}
          <div className="flex-1 flex flex-col justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-bold font-heading text-foreground">{game.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold font-body">
                  {game.type === "python" ? "🐍 Python" : "⚡ JS"}
                </span>
                {game.isLeaderboardEligible ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 font-bold font-body">
                    🏆 LEADERBOARD ELIGIBLE
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-bold font-body">
                    💡 Creative Sandbox
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {game.description}
              </p>
            </div>

            {/* Play Button */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onPlay(game)}
                className="bg-[#D4AF37] text-[#0B0D10] hover:bg-[#E6C76A] gap-2">
                <Play className="w-4 h-4" />
                Play Game
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
