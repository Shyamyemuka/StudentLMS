"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

interface FocusCompanionProps {
  resourceId: number;
  subjectId: number;
  currentTime: number;
  isPlaying: boolean;
  onPauseVideo: () => void;
  onPlayVideo: () => void;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
}

export default function FocusCompanion({
  resourceId,
  subjectId,
  currentTime,
  isPlaying,
  onPauseVideo,
  onPlayVideo,
}: FocusCompanionProps) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [engagementLevel, setEngagementLevel] = useState(100);
  const [showAlert, setShowAlert] = useState(false);
  const [alertReason, setAlertReason] = useState<"fatigue" | "distraction">("fatigue");
  const [aiText, setAiText] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const blinkTimesRef = useRef<number[]>([]);
  const eyesClosedFramesRef = useRef<number>(0);
  const fatigueHistoryRef = useRef<number[]>([]);
  const lastLogTimeRef = useRef<number>(0);
  const lastFaceDetectedTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);

  // Constants
  const LANDMARKS = {
    leftEyeTop: 159,
    leftEyeBottom: 145,
    leftEyeLeft: 33,
    leftEyeRight: 133,
    rightEyeTop: 386,
    rightEyeBottom: 374,
    rightEyeLeft: 362,
    rightEyeRight: 263,
    upperLip: 13,
    lowerLip: 14,
    leftLipCorner: 61,
    rightLipCorner: 291,
    nose: 1,
    leftCheek: 234,
    rightCheek: 454,
  };

  const distance = useCallback((p1: Landmark, p2: Landmark): number => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }, []);

  const calculateEAR = useCallback(
    (landmarks: Landmark[], side: "left" | "right"): number => {
      const top = landmarks[side === "left" ? LANDMARKS.leftEyeTop : LANDMARKS.rightEyeTop];
      const bottom = landmarks[side === "left" ? LANDMARKS.leftEyeBottom : LANDMARKS.rightEyeBottom];
      const left = landmarks[side === "left" ? LANDMARKS.leftEyeLeft : LANDMARKS.rightEyeLeft];
      const right = landmarks[side === "left" ? LANDMARKS.leftEyeRight : LANDMARKS.rightEyeRight];

      const vertical = distance(top, bottom);
      const horizontal = distance(left, right);

      return horizontal > 0 ? vertical / horizontal : 0;
    },
    [distance]
  );

  const calculateHeadPose = useCallback((landmarks: Landmark[]): number => {
    const nose = landmarks[LANDMARKS.nose];
    const leftCheek = landmarks[LANDMARKS.leftCheek];
    const rightCheek = landmarks[LANDMARKS.rightCheek];

    const leftDist = Math.abs(nose.x - leftCheek.x);
    const rightDist = Math.abs(nose.x - rightCheek.x);

    if (leftDist + rightDist > 0) {
      return ((rightDist - leftDist) / (leftDist + rightDist)) * 45;
    }
    return 0;
  }, []);

  const onResults = useCallback(
    async (results: any) => {
      if (!canvasRef.current || !isActiveRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setIsFaceDetected(true);
        lastFaceDetectedTimeRef.current = Date.now();
        const landmarks: Landmark[] = results.multiFaceLandmarks[0];

        // EAR calculation
        const leftEAR = calculateEAR(landmarks, "left");
        const rightEAR = calculateEAR(landmarks, "right");
        const avgEAR = (leftEAR + rightEAR) / 2;

        // Blink and eye close tracking
        const blinkThreshold = 0.15;
        if (avgEAR < blinkThreshold) {
          eyesClosedFramesRef.current++;
        } else {
          if (eyesClosedFramesRef.current >= 2 && eyesClosedFramesRef.current <= 15) {
            blinkTimesRef.current.push(Date.now());
          }
          eyesClosedFramesRef.current = 0;
        }

        const now = Date.now();
        blinkTimesRef.current = blinkTimesRef.current.filter((t) => now - t < 60000);

        // Engagement and Fatigue calculations
        const headTurnValue = calculateHeadPose(landmarks);
        const eyeFatigue = Math.max(0, (0.25 - avgEAR) * 250);
        const blinkFatigue = blinkTimesRef.current.length > 20 ? (blinkTimesRef.current.length - 20) * 2 : 0;
        const closeFatigue = Math.min(40, eyesClosedFramesRef.current * 4);

        const calculatedFatigue = Math.min(100, Math.round(eyeFatigue + blinkFatigue + closeFatigue));
        const calculatedEngagement = Math.min(
          100,
          Math.round(Math.max(0, 100 - Math.abs(headTurnValue) * 2 - closeFatigue))
        );

        setFatigueLevel(calculatedFatigue);
        setEngagementLevel(calculatedEngagement);

        // Draw basic landmarks wireframe for sketchy chalkboard dashboard
        ctx.strokeStyle = "#D4AF37"; // Gold Chalk
        ctx.lineWidth = 1.5;
        
        // Face outline
        const faceOutlineIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
        ctx.beginPath();
        faceOutlineIndices.forEach((idx, i) => {
          const pt = landmarks[idx];
          const x = (1 - pt.x) * w;
          const y = pt.y * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();

        // Eyes
        const leftEyeIndices = [33, 133, 159, 145];
        const rightEyeIndices = [362, 263, 386, 374];
        [leftEyeIndices, rightEyeIndices].forEach((eye) => {
          ctx.beginPath();
          eye.forEach((idx, i) => {
            const pt = landmarks[idx];
            const x = (1 - pt.x) * w;
            const y = pt.y * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.stroke();
        });

        // Trigger fatigue warning if fatigue stays high
        fatigueHistoryRef.current.push(calculatedFatigue);
        if (fatigueHistoryRef.current.length > 8) {
          fatigueHistoryRef.current.shift();
        }

        const avgRecentFatigue = fatigueHistoryRef.current.reduce((a, b) => a + b, 0) / fatigueHistoryRef.current.length;
        
        if (avgRecentFatigue > 65 && isPlaying && !showAlert) {
          onPauseVideo();
          setAlertReason("fatigue");
          setShowAlert(true);
          fetchAIIntervention("fatigue");
        }
      } else {
        setIsFaceDetected(false);
      }

      // Trigger distraction warning if no face detected for 15 seconds
      const elapsedSinceLastFace = Date.now() - lastFaceDetectedTimeRef.current;
      if (elapsedSinceLastFace > 15000 && isPlaying && !showAlert) {
        onPauseVideo();
        setAlertReason("distraction");
        setShowAlert(true);
        fetchAIIntervention("fatigue"); // Warm intervention
      }
    },
    [isActive, isPlaying, calculateEAR, calculateHeadPose, showAlert, onPauseVideo]
  );

  const fetchAIIntervention = async (type: "fatigue" | "summary") => {
    setIsLoadingAi(true);
    setAiText("");
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          timestamp: currentTime,
          summaryType: type,
        }),
      });
      const data = await res.json();
      setAiText(data.summary || "Take a deep breath and rest your eyes for 2 minutes.");
    } catch (err) {
      setAiText("Let's take a quick stretch break to refresh your mind.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleLogData = useCallback(async () => {
    if (!isActiveRef.current || !isPlaying || showAlert) return;

    // Send payload every 5 seconds
    const nowSec = Math.floor(currentTime);
    if (nowSec - lastLogTimeRef.current >= 5) {
      lastLogTimeRef.current = nowSec;
      try {
        await fetch(`/api/resource/${resourceId}/attention-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectId,
            videoTimestampSec: nowSec,
            fatigueLevel,
            engagementLevel,
          }),
        });
      } catch (err) {
        console.error("Failed to log attention data:", err);
      }
    }
  }, [isActive, isPlaying, currentTime, resourceId, subjectId, fatigueLevel, engagementLevel, showAlert]);

  useEffect(() => {
    handleLogData();
  }, [currentTime, handleLogData]);

  const startCompanion = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // @ts-ignore
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      // Scan 1 frame every 1.5 seconds to protect CPU/GPU performance
      const processFrame = async () => {
        if (!faceMeshRef.current || !videoRef.current || !isActiveRef.current) return;
        if (videoRef.current.readyState >= 2) {
          try {
            await faceMeshRef.current.send({ image: videoRef.current });
          } catch (e) {
            // Silence frame drop warnings
          }
        }
        setTimeout(() => {
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }, 1500);
      };

      setIsActive(true);
      isActiveRef.current = true;
      lastFaceDetectedTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(processFrame);
      toast.success("Focus Companion activated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Webcam access is required for Study Companion.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopCompanion = useCallback(() => {
    setIsActive(false);
    isActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (faceMeshRef.current) {
      try {
        faceMeshRef.current.close();
      } catch (e) {}
      faceMeshRef.current = null;
    }
    setIsFaceDetected(false);
    setFatigueLevel(0);
    setEngagementLevel(100);
    toast.info("Focus Companion deactivated.");
  }, []);

  const toggleCompanion = () => {
    if (isActive) {
      stopCompanion();
    } else {
      startCompanion();
    }
  };

  useEffect(() => {
    return () => {
      stopCompanion();
    };
  }, [stopCompanion]);

  return (
    <div className="mt-4">
      {/* Sketch styled toggle bar */}
      <div 
        style={{ borderRadius: "12px" }}
        className="bg-card border-2 border-border p-4 shadow-hard-md flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <h4 className="text-lg font-heading font-semibold text-foreground">AI Study Companion</h4>
            <p className="text-xs text-muted-foreground font-bold">
              {isActive 
                ? `Tracking: Fatigue (${fatigueLevel}%) | Focus (${engagementLevel}%)` 
                : "Optionally track study fatigue and unlock custom AI micro-interventions"}
            </p>
          </div>
        </div>

        <button
          onClick={toggleCompanion}
          disabled={isLoading}
          suppressHydrationWarning
          style={{ borderRadius: "12px" }}
          className={`px-5 py-2.5 font-bold border-2 border-border shadow-hard-sm hover:scale-102 active:scale-98 transition-all cursor-pointer ${
            isActive 
              ? "bg-[#ff6b6b] text-white hover:bg-[#ff4d4d]" 
              : "bg-primary text-primary-foreground"
          }`}
        >
          {isLoading ? "Starting..." : isActive ? "Stop Companion" : "Enable Tracking 🎥"}
        </button>
      </div>

      {/* Floating Mini Webcam View (Only visible when tracking is active) */}
      <div 
        style={{ borderRadius: "10px" }}
        className={`fixed bottom-4 right-4 z-50 bg-[#14181D] border-2 border-[#BFA55A] p-2 shadow-hard-lg w-[160px] ${isActive ? "" : "hidden"}`}
      >
        <div className="relative aspect-video bg-black rounded overflow-hidden">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80 transform scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            width={160}
            height={120}
            className="absolute inset-0 w-full h-full transform scale-x-[-1]"
          />
          <div className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-[#EAEAEA] px-1 rounded font-bold">
            {isFaceDetected ? "🎥 Tracking" : "⚠️ No Face"}
          </div>
        </div>
        <div className="mt-1 text-[10px] text-center text-[#EAEAEA] font-bold">
          Focus: <span className="text-[#D4AF37]">{engagementLevel}%</span>
        </div>
      </div>

      {/* AI Intervention Modal Popup */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            style={{ borderRadius: "12px" }}
            className="bg-card border-4 border-border p-6 max-w-lg w-full shadow-hard-xl relative text-center"
          >
            <div className="text-5xl mb-3">🧘</div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
              {alertReason === "fatigue" ? "Let's Take a Micro-Break!" : "Are you still there?"}
            </h3>
            
            <p className="text-sm text-muted-foreground font-bold mb-4">
              {alertReason === "fatigue" 
                ? "Our focus monitor noticed some fatigue creep in. Taking quick regular breaks increases retention by 35%."
                : "We haven't detected your face in the last 15 seconds. Let's make sure you're getting the best out of this video."}
            </p>

            {/* AI Generated Advice box */}
            <div 
              style={{ borderRadius: "10px" }}
              className="bg-muted/40 border-2 border-border p-4 text-left mb-6 font-bold text-sm min-h-[80px] flex items-center justify-center relative"
            >
              {isLoadingAi ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="animate-spin text-lg">⏳</span>
                  <span>Generating AI Study advice...</span>
                </div>
              ) : (
                <p className="text-foreground italic">{aiText || "Generate AI content below to help restore your focus."}</p>
              )}
            </div>

            {/* Option CTA Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => fetchAIIntervention("fatigue")}
                  suppressHydrationWarning
                  style={{ borderRadius: "12px" }}
                  className="flex-1 py-2 px-3 border-2 border-border bg-card text-foreground font-bold hover:bg-muted/30 transition-all text-xs cursor-pointer"
                >
                  🧘 AI Stretch Break
                </button>
                <button
                  onClick={() => fetchAIIntervention("summary")}
                  suppressHydrationWarning
                  style={{ borderRadius: "12px" }}
                  className="flex-1 py-2 px-3 border-2 border-border bg-card text-foreground font-bold hover:bg-muted/30 transition-all text-xs cursor-pointer"
                >
                  📖 AI 5-Min Summary
                </button>
              </div>

              <button
                onClick={() => {
                  setShowAlert(false);
                  onPlayVideo();
                }}
                suppressHydrationWarning
                style={{ borderRadius: "12px" }}
                className="w-full py-3 bg-primary text-primary-foreground font-bold border-2 border-border shadow-hard-sm hover:scale-102 active:scale-98 transition-all cursor-pointer text-sm"
              >
                🎯 Resume Lecture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
