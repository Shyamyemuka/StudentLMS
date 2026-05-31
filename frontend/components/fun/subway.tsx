"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square,
  Trophy, 
  Volume2, 
  VolumeX,
  Keyboard,
  Coins
} from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const LANE_COUNT = 3;
const LANE_LEFT = 0;
const LANE_CENTER = 1;
const LANE_RIGHT = 2;

export default function Subway() {
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('lms_subway_high_score');
      return saved ? parseInt(saved, 10) : 1000;
    } catch {
      return 1000;
    }
  });
  const [coins, setCoins] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentGameState, setCurrentGameState] = useState<string>('menu'); // menu, running, paused, gameover

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastReportedScoreRef = useRef<number>(0);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const supabase = createClient();

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const gameRef = useRef({
    gameState: 'menu',
    playerLane: LANE_CENTER,
    targetLane: LANE_CENTER,
    playerXOffset: 0,
    playerY: 0,
    playerJumpVelocity: 0,
    isSliding: false,
    slideTimer: 0,
    score: 0,
    coinsCollected: 0,
    distance: 0,
    gameSpeed: 5,
    obstacles: [] as Array<{
      id: number;
      lane: number;
      type: 'train' | 'barrier_low' | 'barrier_high';
      z: number;
      passed: boolean;
    }>,
    coins: [] as Array<{
      id: number;
      lane: number;
      z: number;
      collected: boolean;
    }>,
    nextSpawnZ: 40,
    nextCoinSpawnZ: 20
  });

  const touchStart = useRef({ x: 0, y: 0 });
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStart.current.x;
    const diffY = e.changedTouches[0].clientY - touchStart.current.y;
    const minSwipe = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > minSwipe) handleMoveRight();
      else if (diffX < -minSwipe) handleMoveLeft();
    } else {
      if (diffY > minSwipe) handleSlide();
      else if (diffY < -minSwipe) handleJump();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameRef.current.gameState !== 'running') return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleMoveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleMoveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          handleJump();
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleSlide();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMoveLeft = () => {
    const current = gameRef.current;
    if (current.targetLane > LANE_LEFT) {
      current.targetLane -= 1;
      playBeep(440, 0.05);
    }
  };

  const handleMoveRight = () => {
    const current = gameRef.current;
    if (current.targetLane < LANE_RIGHT) {
      current.targetLane += 1;
      playBeep(520, 0.05);
    }
  };

  const handleJump = () => {
    const current = gameRef.current;
    if (current.playerY === 0 && !current.isSliding) {
      current.playerJumpVelocity = 12;
      playBeep(660, 0.08);
    }
  };

  const handleSlide = () => {
    const current = gameRef.current;
    if (current.playerY > 0) {
      current.playerJumpVelocity = -10;
    } else {
      current.isSliding = true;
      current.slideTimer = 25;
      playBeep(330, 0.1);
    }
  };

  const playBeep = (frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine') => {
    if (!soundEnabledRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context fallback
    }
  };

  const startGame = () => {
    const current = gameRef.current;
    current.gameState = 'running';
    setCurrentGameState('running');
    current.score = 0;
    current.distance = 0;
    current.coinsCollected = 0;
    current.playerLane = LANE_CENTER;
    current.targetLane = LANE_CENTER;
    current.playerXOffset = 0;
    current.playerY = 0;
    current.playerJumpVelocity = 0;
    current.isSliding = false;
    current.gameSpeed = 5;
    current.obstacles = [];
    current.coins = [];
    current.nextSpawnZ = 40;
    current.nextCoinSpawnZ = 20;

    lastReportedScoreRef.current = 0;
    setScore(0);
    setCoins(0);
    playBeep(587.33, 0.1);
    setTimeout(() => playBeep(880, 0.2), 100);
  };

  const pauseGame = () => {
    const current = gameRef.current;
    if (current.gameState === 'running') {
      current.gameState = 'paused';
      setCurrentGameState('paused');
      playBeep(400, 0.15);
    } else if (current.gameState === 'paused') {
      current.gameState = 'running';
      setCurrentGameState('running');
      playBeep(600, 0.1);
    }
  };

  const stopGame = () => {
    const current = gameRef.current;
    current.gameState = 'menu';
    setCurrentGameState('menu');
    current.score = 0;
    current.coinsCollected = 0;
    current.obstacles = [];
    current.coins = [];
    setScore(0);
    setCoins(0);
    playBeep(220, 0.3, 'sawtooth');
  };

  const saveScoreToLeaderboard = async (finalScore: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch("/api/games/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: "subway",
            score: finalScore,
          }),
        });
        toast.success(`Score of ${finalScore} saved to Leaderboards!`);
      } else {
        toast.info("Play logged-in to compete on global Leaderboards!");
      }
    } catch (err) {
      console.error("Failed to save score:", err);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      canvas.width = containerWidth;
      canvas.height = Math.min(containerWidth * 0.6, 480);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let obstacleIdSeq = 0;
    let coinIdSeq = 0;

    const gameLoop = () => {
      const current = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      const vanishingPointY = height * 0.35;
      const vanishingPointX = width * 0.5;

      const horizonGrad = ctx.createLinearGradient(0, vanishingPointY - 4, 0, vanishingPointY + 4);
      horizonGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
      horizonGrad.addColorStop(0.5, '#f59e0b');
      horizonGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, vanishingPointY - 2, width, 4);

      const getLaneXAtZ = (laneIdx: number, z: number) => {
        const normalizedZ = z / 100;
        const horizonSpacing = 15;
        const groundSpacing = width * 0.28;
        const currentSpacing = horizonSpacing + (groundSpacing - horizonSpacing) * normalizedZ;
        const centerOffset = (laneIdx - 1) * currentSpacing;
        return vanishingPointX + centerOffset;
      };

      const getLaneYAtZ = (z: number) => {
        const normalizedZ = z / 100;
        return vanishingPointY + (height - vanishingPointY) * normalizedZ;
      };

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.lineWidth = 2;
      for (let l = -0.5; l <= LANE_RIGHT + 0.5; l++) {
        ctx.beginPath();
        ctx.moveTo(getLaneXAtZ(l, 0), getLaneYAtZ(0));
        ctx.lineTo(getLaneXAtZ(l, 100), getLaneYAtZ(100));
        ctx.stroke();
      }

      const offsetSpeed = (Date.now() / 30) % 100;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 1.5;
      for (let zVal = offsetSpeed; zVal < 100; zVal += 20) {
        ctx.beginPath();
        ctx.moveTo(getLaneXAtZ(-0.5, zVal), getLaneYAtZ(zVal));
        ctx.lineTo(getLaneXAtZ(3.5, zVal), getLaneYAtZ(zVal));
        ctx.stroke();
      }

      if (current.gameState === 'running' || current.gameState === 'paused' || current.gameState === 'gameover') {
        
        if (current.gameState === 'running') {
          current.distance += current.gameSpeed * 0.05;
          current.score += Math.round(current.gameSpeed * 0.1);
          current.gameSpeed = 5 + Math.floor(current.distance / 150);

          current.nextSpawnZ -= current.gameSpeed * 0.15;
          if (current.nextSpawnZ <= 0) {
            const types: Array<'train' | 'barrier_low' | 'barrier_high'> = ['train', 'barrier_low', 'barrier_high'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const randomLane = Math.floor(Math.random() * LANE_COUNT);

            current.obstacles.push({
              id: obstacleIdSeq++,
              lane: randomLane,
              type: randomType,
              z: 0,
              passed: false
            });
            current.nextSpawnZ = 35 + Math.random() * 30;
          }

          current.nextCoinSpawnZ -= current.gameSpeed * 0.15;
          if (current.nextCoinSpawnZ <= 0) {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            for (let i = 0; i < 3; i++) {
              current.coins.push({
                id: coinIdSeq++,
                lane: lane,
                z: -i * 6,
                collected: false
              });
            }
            current.nextCoinSpawnZ = 20 + Math.random() * 20;
          }
        }

        current.coins.forEach(coin => {
          if (current.gameState === 'running' && !coin.collected) {
            coin.z += current.gameSpeed * 0.15;
          }

          if (coin.z > 0 && coin.z < 100 && !coin.collected) {
            const x = getLaneXAtZ(coin.lane, coin.z);
            const y = getLaneYAtZ(coin.z);
            const scale = coin.z / 100;
            const size = 11 * scale;

            ctx.shadowBlur = 8;
            ctx.shadowColor = '#fbbf24';
            ctx.beginPath();
            ctx.arc(x, y - (16 * scale), size, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1 * scale;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });

        current.obstacles.forEach(obs => {
          if (current.gameState === 'running') {
            obs.z += current.gameSpeed * 0.15;
          }

          if (obs.z > 0 && obs.z < 105) {
            const x = getLaneXAtZ(obs.lane, obs.z);
            const y = getLaneYAtZ(obs.z);
            const scale = obs.z / 100;
            const baseWidth = 52 * scale;

            if (obs.type === 'train') {
              const trainHeight = 80 * scale;
              ctx.shadowBlur = 12;
              ctx.shadowColor = '#ef4444';
              ctx.fillStyle = '#1e293b';
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2 * scale;
              ctx.beginPath();
              ctx.roundRect(x - baseWidth/2, y - trainHeight, baseWidth, trainHeight, 4 * scale);
              ctx.fill();
              ctx.stroke();

              const lightRadius = 4 * scale;
              ctx.fillStyle = '#f87171';
              ctx.beginPath();
              ctx.arc(x - (12 * scale), y - trainHeight + (18 * scale), lightRadius, 0, Math.PI * 2);
              ctx.arc(x + (12 * scale), y - trainHeight + (18 * scale), lightRadius, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;

            } else if (obs.type === 'barrier_low') {
              const barrierHeight = 28 * scale;
              ctx.fillStyle = '#475569';
              ctx.fillRect(x - baseWidth/2, y - barrierHeight, 5 * scale, barrierHeight);
              ctx.fillRect(x + baseWidth/2 - (5*scale), y - barrierHeight, 5 * scale, barrierHeight);

              ctx.fillStyle = '#fbbf24';
              ctx.fillRect(x - baseWidth/2, y - barrierHeight + (4*scale), baseWidth, 8 * scale);

            } else if (obs.type === 'barrier_high') {
              const crossbarY = 60 * scale;
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 3 * scale;
              ctx.beginPath();
              ctx.moveTo(x - baseWidth/2, y);
              ctx.lineTo(x - baseWidth/3, y - crossbarY);
              ctx.lineTo(x + baseWidth/3, y - crossbarY);
              ctx.lineTo(x + baseWidth/2, y);
              ctx.stroke();

              ctx.fillStyle = '#0f172a';
              ctx.fillRect(x - baseWidth*0.4, y - crossbarY, baseWidth*0.8, 12 * scale);
              ctx.strokeStyle = '#06b6d4';
              ctx.strokeRect(x - baseWidth*0.4, y - crossbarY, baseWidth*0.8, 12 * scale);
            }
          }
        });

        const targetXOffset = (current.targetLane - 1) * (width * 0.28);
        current.playerXOffset += (targetXOffset - current.playerXOffset) * 0.25;

        if (current.playerY > 0 || current.playerJumpVelocity !== 0) {
          current.playerY += current.playerJumpVelocity;
          current.playerJumpVelocity -= 0.65;
          if (current.playerY <= 0) {
            current.playerY = 0;
            current.playerJumpVelocity = 0;
          }
        }

        if (current.isSliding) {
          current.slideTimer--;
          if (current.slideTimer <= 0) {
            current.isSliding = false;
          }
        }

        const playerZ = 92;
        const playerBaseX = vanishingPointX + (current.playerXOffset * (playerZ / 100));
        const playerBaseY = getLaneYAtZ(playerZ);
        const playerScale = playerZ / 100;
        const finalPlayerY = playerBaseY - (current.playerY * playerScale);

        let playerHeight = 52 * playerScale;
        let playerWidth = 30 * playerScale;
        if (current.isSliding) {
          playerHeight = 24 * playerScale;
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(playerBaseX - (22 * playerScale), playerBaseY + (4 * playerScale), 44 * playerScale, 5 * playerScale, 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(playerBaseX - playerWidth/2, finalPlayerY - playerHeight, playerWidth, playerHeight, 6);
        ctx.fill();

        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(playerBaseX - (playerWidth*0.75)/2, finalPlayerY - playerHeight + (4*playerScale), playerWidth*0.75, playerHeight - (8*playerScale), 4);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(18 * playerScale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏃', playerBaseX, finalPlayerY - (playerHeight/2));
        ctx.shadowBlur = 0;

        if (current.gameState === 'running') {
          current.coins.forEach(coin => {
            if (!coin.collected && Math.abs(coin.z - playerZ) < 4) {
              const sameLane = coin.lane === current.targetLane;
              const lowY = current.playerY < 20;
              if (sameLane && lowY) {
                coin.collected = true;
                current.coinsCollected += 1;
                current.score += 100;
                setCoins(prev => prev + 1);
                playBeep(987.77, 0.08, 'sine');
              }
            }
          });

          current.obstacles.forEach(obs => {
            if (!obs.passed && Math.abs(obs.z - playerZ) < 5) {
              if (obs.lane === current.targetLane) {
                let hit = false;
                if (obs.type === 'train') {
                  hit = true;
                } else if (obs.type === 'barrier_low') {
                  if (current.playerY < 25) hit = true;
                } else if (obs.type === 'barrier_high') {
                  if (!current.isSliding) hit = true;
                }

                if (hit) {
                  current.gameState = 'gameover';
                  setCurrentGameState('gameover');
                  playBeep(180, 0.4, 'sawtooth');
                  saveScoreToLeaderboard(current.score);
                  
                  setHighScore(prev => {
                    const finalScore = current.score;
                    if (finalScore > prev) {
                      try {
                        localStorage.setItem('lms_subway_high_score', finalScore.toString());
                      } catch {}
                      return finalScore;
                    }
                    return prev;
                  });
                }
              }
            }
            if (obs.z >= playerZ + 5) {
              obs.passed = true;
            }
          });
        }

        current.obstacles = current.obstacles.filter(o => o.z < 110);
        current.coins = current.coins.filter(c => c.z < 110);

        if (lastReportedScoreRef.current !== current.score) {
          lastReportedScoreRef.current = current.score;
          setScore(current.score);
        }
      }

      if (current.gameState === 'menu') {
        ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CYBER SUBWAY SURFER', width / 2, height / 2 - 40);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText('Avoid trains & obstacles to set the absolute High Score', width / 2, height / 2 - 10);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('Press SPACEBAR or Click [START GAME] below to Run', width / 2, height / 2 + 35);
      } else if (current.gameState === 'paused') {
        ctx.fillStyle = 'rgba(9, 13, 22, 0.75)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', width / 2, height / 2);
      } else if (current.gameState === 'gameover') {
        ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ef4444';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', width / 2, height / 2 - 40);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`Final Points: ${current.score}`, width / 2, height / 2);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText('Press SPACEBAR to Try Again', width / 2, height / 2 + 35);
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    const handleLoopKeys = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        const current = gameRef.current;
        if (current.gameState === 'menu' || current.gameState === 'gameover') {
          startGame();
        } else if (current.gameState === 'running') {
          pauseGame();
        } else if (current.gameState === 'paused') {
          pauseGame();
        }
      }
    };
    window.addEventListener('keydown', handleLoopKeys);

    gameLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleLoopKeys);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border-2 border-border rounded-xl text-center min-h-[400px] text-[#2d2d2d] dark:text-[#EAEAEA]">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        
        {/* HUD Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background border-2 border-border rounded-xl p-3 flex items-center justify-between shadow-hard-sm">
            <div className="text-left">
              <span className="text-[10px] text-muted-foreground font-mono uppercase block font-bold">Points</span>
              <span className="text-xl font-black text-amber-500 font-mono">{score}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Coins className="w-4.5 h-4.5 text-amber-400" />
            </div>
          </div>

          <div className="bg-background border-2 border-border rounded-xl p-3 flex items-center justify-between shadow-hard-sm">
            <div className="text-left">
              <span className="text-[10px] text-muted-foreground font-mono uppercase block font-bold">Record</span>
              <span className="text-xl font-black text-emerald-500 font-mono">{highScore}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Trophy className="w-4.5 h-4.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          className="relative w-full rounded-2xl overflow-hidden border-2 border-border bg-slate-950 shadow-hard-md"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas 
            ref={canvasRef} 
            className="block w-full cursor-pointer"
          />

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
            title={soundEnabled ? "Mute Game" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Controls Deck */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            
            <button 
              onClick={startGame}
              className="bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl border-2 border-border flex items-center justify-center gap-2 shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="text-xs font-black uppercase">
                {currentGameState === 'gameover' ? 'Re-Run' : 'Start'}
              </span>
            </button>

            <button 
              onClick={pauseGame}
              disabled={currentGameState === 'menu' || currentGameState === 'gameover'}
              className={`py-3 px-4 rounded-xl border-2 border-border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Pause className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold uppercase">
                {currentGameState === 'paused' ? 'Resume' : 'Pause'}
              </span>
            </button>

            <button 
              onClick={stopGame}
              disabled={currentGameState === 'menu'}
              className="py-3 px-4 rounded-xl border-2 border-border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer bg-red-500/10 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold uppercase">Stop</span>
            </button>
          </div>

          <div className="bg-background p-3 rounded-xl border-2 border-border text-center text-xs text-muted-foreground font-mono flex items-center justify-center gap-2 shadow-hard-sm">
            <Keyboard className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold">Keys [←/→ Move, ↑ Jump, ↓ Slide] or SPACEBAR to pause</span>
          </div>
        </div>

      </div>
    </div>
  );
}
