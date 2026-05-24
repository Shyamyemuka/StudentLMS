"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// TypeScript interfaces
interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface EmotionScores {
  Happy: number;
  Sad: number;
  Angry: number;
  Surprised: number;
  Fear: number;
  Neutral: number;
}

interface EmotionConfig {
  emoji: string;
  color: string;
}

type EmotionName = keyof EmotionScores;

export default function MoodAnalyzer() {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const smoothedScoresRef = useRef<EmotionScores>({
    Happy: 0,
    Sad: 0,
    Angry: 0,
    Surprised: 0,
    Fear: 0,
    Neutral: 50,
  });
  const blinkTimesRef = useRef<number[]>([]);
  const eyesClosedFramesRef = useRef<number>(0);
  const moodHistoryRef = useRef<EmotionScores[]>([]);
  const emotionDurationsRef = useRef<EmotionScores>({
    Happy: 0,
    Sad: 0,
    Angry: 0,
    Surprised: 0,
    Fear: 0,
    Neutral: 0,
  });
  const lastEmotionTimeRef = useRef<number>(Date.now());
  const lastEmotionRef = useRef<EmotionName>("Neutral");

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [showPermission, setShowPermission] = useState(true);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionName>("Neutral");
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [emotionScores, setEmotionScores] = useState<EmotionScores>({
    Happy: 0,
    Sad: 0,
    Angry: 0,
    Surprised: 0,
    Fear: 0,
    Neutral: 50,
  });
  const [smileIntensity, setSmileIntensity] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkRate, setBlinkRate] = useState(0);
  const [engagementLevel, setEngagementLevel] = useState(0);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [eyeOpenness, setEyeOpenness] = useState(0);
  const [headTilt, setHeadTilt] = useState(0);
  const [sessionTime, setSessionTime] = useState("00:00");
  const [dominantMood, setDominantMood] = useState<EmotionName>("Neutral");
  const [tip, setTip] = useState("Position your face in the camera view");
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Emotion configuration
  const emotions: Record<EmotionName, EmotionConfig> = {
    Happy: { emoji: "😊", color: "#64ffda" },
    Sad: { emoji: "😢", color: "#60a5fa" },
    Angry: { emoji: "😠", color: "#ff6b6b" },
    Surprised: { emoji: "😮", color: "#fbbf24" },
    Fear: { emoji: "😨", color: "#a78bfa" },
    Neutral: { emoji: "😐", color: "#a0a0c0" },
  };

  // Landmark indices
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
    leftEyebrow: 105,
    rightEyebrow: 334,
  };

  // Utility: distance
  const distance = useCallback((p1: Landmark, p2: Landmark): number => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }, []);

  // Calculate Eye Aspect Ratio
  const calculateEAR = useCallback(
    (landmarks: Landmark[], side: "left" | "right"): number => {
      const top =
        landmarks[
        side === "left" ? LANDMARKS.leftEyeTop : LANDMARKS.rightEyeTop
        ];
      const bottom =
        landmarks[
        side === "left" ? LANDMARKS.leftEyeBottom : LANDMARKS.rightEyeBottom
        ];
      const left =
        landmarks[
        side === "left" ? LANDMARKS.leftEyeLeft : LANDMARKS.rightEyeLeft
        ];
      const right =
        landmarks[
        side === "left" ? LANDMARKS.leftEyeRight : LANDMARKS.rightEyeRight
        ];

      const vertical = distance(top, bottom);
      const horizontal = distance(left, right);

      return horizontal > 0 ? vertical / horizontal : 0;
    },
    [distance]
  );

  // Calculate Mouth Aspect Ratio
  const calculateMAR = useCallback(
    (landmarks: Landmark[]): number => {
      const upperLip = landmarks[LANDMARKS.upperLip];
      const lowerLip = landmarks[LANDMARKS.lowerLip];
      const leftCorner = landmarks[LANDMARKS.leftLipCorner];
      const rightCorner = landmarks[LANDMARKS.rightLipCorner];

      const vertical = distance(upperLip, lowerLip);
      const horizontal = distance(leftCorner, rightCorner);

      return horizontal > 0 ? vertical / horizontal : 0;
    },
    [distance]
  );

  // Calculate Smile Intensity
  const calculateSmile = useCallback(
    (landmarks: Landmark[]): number => {
      const leftCorner = landmarks[LANDMARKS.leftLipCorner];
      const rightCorner = landmarks[LANDMARKS.rightLipCorner];
      const upperLip = landmarks[LANDMARKS.upperLip];
      const lowerLip = landmarks[LANDMARKS.lowerLip];

      const mouthWidth = distance(leftCorner, rightCorner);
      const centerY = (upperLip.y + lowerLip.y) / 2;

      const leftCornerHeight = centerY - leftCorner.y;
      const rightCornerHeight = centerY - rightCorner.y;
      const avgCornerHeight = (leftCornerHeight + rightCornerHeight) / 2;

      if (mouthWidth > 0) {
        const smile = avgCornerHeight / mouthWidth;
        return Math.max(0, Math.min(100, (smile + 0.1) * 300));
      }
      return 0;
    },
    [distance]
  );

  // Calculate Eyebrow Position
  const calculateEyebrowPos = useCallback((landmarks: Landmark[]): number => {
    const leftBrow = landmarks[LANDMARKS.leftEyebrow];
    const rightBrow = landmarks[LANDMARKS.rightEyebrow];
    const leftEye = landmarks[LANDMARKS.leftEyeTop];
    const rightEye = landmarks[LANDMARKS.rightEyeTop];

    const leftDist = leftEye.y - leftBrow.y;
    const rightDist = rightEye.y - rightBrow.y;
    const avgDist = (leftDist + rightDist) / 2;

    return ((avgDist - 0.03) / 0.03) * 100;
  }, []);

  // Calculate Head Pose
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

  // Detect Blink
  const detectBlink = useCallback(
    (landmarks: Landmark[]): boolean => {
      const leftEAR = calculateEAR(landmarks, "left");
      const rightEAR = calculateEAR(landmarks, "right");
      const avgEAR = (leftEAR + rightEAR) / 2;

      setEyeOpenness(Math.min(100, avgEAR * 400));

      const blinkThreshold = 0.15;

      if (avgEAR < blinkThreshold) {
        eyesClosedFramesRef.current++;
      } else {
        if (
          eyesClosedFramesRef.current >= 2 &&
          eyesClosedFramesRef.current <= 15
        ) {
          setBlinkCount((prev) => prev + 1);
          blinkTimesRef.current.push(Date.now());
        }
        eyesClosedFramesRef.current = 0;
      }

      // Calculate blinks per minute
      const now = Date.now();
      blinkTimesRef.current = blinkTimesRef.current.filter(
        (t) => now - t < 60000
      );
      setBlinkRate(blinkTimesRef.current.length);

      return avgEAR < blinkThreshold;
    },
    [calculateEAR]
  );

  // Detect Emotion
  const detectEmotion = useCallback(
    (landmarks: Landmark[]): { emotion: EmotionName; confidence: number } => {
      const smile = calculateSmile(landmarks);
      const mouthOpen = calculateMAR(landmarks);
      const eyebrowPos = calculateEyebrowPos(landmarks);
      const leftEAR = calculateEAR(landmarks, "left");
      const rightEAR = calculateEAR(landmarks, "right");
      const eyeOpen = (leftEAR + rightEAR) / 2;

      setSmileIntensity(smile);

      const scores: EmotionScores = {
        Happy: 0,
        Sad: 0,
        Angry: 0,
        Surprised: 0,
        Fear: 0,
        Neutral: 40,
      };

      // Happy
      if (smile > 30) {
        scores.Happy = Math.min(100, smile * 1.5);
      }

      // Sad
      if (smile < 20 && eyebrowPos < 0) {
        scores.Sad = Math.min(100, 30 - smile + Math.abs(eyebrowPos) * 0.5);
      }

      // Angry
      if (eyebrowPos < -20 && smile < 25) {
        scores.Angry = Math.min(100, Math.abs(eyebrowPos) * 1.2);
      }

      // Surprised
      if (eyebrowPos > 20 && mouthOpen > 0.25 && eyeOpen > 0.25) {
        scores.Surprised = Math.min(100, eyebrowPos + mouthOpen * 100);
      }

      // Fear
      if (eyebrowPos > 15 && eyeOpen > 0.3 && mouthOpen < 0.2) {
        scores.Fear = Math.min(100, eyebrowPos * 0.8 + eyeOpen * 50);
      }

      // Smooth scores
      const alpha = 0.2;
      const smoothed = smoothedScoresRef.current;
      for (const emotion of Object.keys(scores) as EmotionName[]) {
        smoothed[emotion] =
          smoothed[emotion] * (1 - alpha) + scores[emotion] * alpha;
      }

      setEmotionScores({ ...smoothed });

      // Find dominant
      let maxScore = 0;
      let dominant: EmotionName = "Neutral";
      for (const [emotion, score] of Object.entries(smoothed) as [
        EmotionName,
        number
      ][]) {
        if (score > maxScore) {
          maxScore = score;
          dominant = emotion;
        }
      }

      // Update durations
      const now = Date.now();
      emotionDurationsRef.current[lastEmotionRef.current] +=
        (now - lastEmotionTimeRef.current) / 1000;
      lastEmotionTimeRef.current = now;
      lastEmotionRef.current = dominant;

      // Update dominant mood
      let maxDuration = 0;
      let dominantMoodCalc: EmotionName = "Neutral";
      for (const [emotion, duration] of Object.entries(
        emotionDurationsRef.current
      ) as [EmotionName, number][]) {
        if (duration > maxDuration) {
          maxDuration = duration;
          dominantMoodCalc = emotion;
        }
      }
      setDominantMood(dominantMoodCalc);

      return { emotion: dominant, confidence: maxScore };
    },
    [calculateSmile, calculateMAR, calculateEyebrowPos, calculateEAR]
  );

  // Calculate Engagement
  const calculateEngagement = useCallback(
    (landmarks: Landmark[]): number => {
      const leftEAR = calculateEAR(landmarks, "left");
      const rightEAR = calculateEAR(landmarks, "right");
      const eyeOpen = (leftEAR + rightEAR) / 2;

      const headTurnValue = calculateHeadPose(landmarks);

      const eyeScore = Math.min(100, eyeOpen * 350);
      const headScore = Math.max(0, 100 - Math.abs(headTurnValue) * 2);
      const blinkScore =
        blinkTimesRef.current.length > 25
          ? 60
          : blinkTimesRef.current.length < 10
            ? 70
            : 100;

      return eyeScore * 0.4 + headScore * 0.4 + blinkScore * 0.2;
    },
    [calculateEAR, calculateHeadPose]
  );

  // Calculate Fatigue
  const calculateFatigue = useCallback(
    (landmarks: Landmark[]): number => {
      const leftEAR = calculateEAR(landmarks, "left");
      const rightEAR = calculateEAR(landmarks, "right");
      const eyeOpen = (leftEAR + rightEAR) / 2;

      const eyeFatigue = Math.max(0, (0.25 - eyeOpen) * 250);
      const blinkFatigue =
        blinkTimesRef.current.length > 20
          ? (blinkTimesRef.current.length - 20) * 2
          : 0;
      const closeFatigue = Math.min(40, eyesClosedFramesRef.current * 4);

      return Math.min(100, eyeFatigue + blinkFatigue + closeFatigue);
    },
    [calculateEAR]
  );

  // Draw Face Mesh
  const drawFaceMesh = useCallback((landmarks: Landmark[]) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Face outline
    const faceOutline = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
      378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
      162, 21, 54, 103, 67, 109,
    ];

    ctx.strokeStyle = "rgba(100, 255, 218, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();

    faceOutline.forEach((idx, i) => {
      const point = landmarks[idx];
      const x = (1 - point.x) * w;
      const y = point.y * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.closePath();
    ctx.stroke();

    // Eyes
    const leftEye = [33, 133, 159, 145];
    const rightEye = [362, 263, 386, 374];

    [leftEye, rightEye].forEach((eye) => {
      ctx.strokeStyle = "rgba(100, 255, 218, 0.8)";
      ctx.beginPath();
      eye.forEach((idx, i) => {
        const point = landmarks[idx];
        const x = (1 - point.x) * w;
        const y = point.y * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    });

    // Lips
    const lips = [
      61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17,
      84, 181, 91, 146,
    ];

    ctx.strokeStyle = "rgba(255, 107, 157, 0.8)";
    ctx.beginPath();
    lips.forEach((idx, i) => {
      const point = landmarks[idx];
      const x = (1 - point.x) * w;
      const y = point.y * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    // Eyebrows
    const leftBrow = [70, 63, 105, 66, 107];
    const rightBrow = [336, 296, 334, 293, 300];

    [leftBrow, rightBrow].forEach((brow) => {
      ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      brow.forEach((idx, i) => {
        const point = landmarks[idx];
        const x = (1 - point.x) * w;
        const y = point.y * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, []);

  // Draw Mood Graph
  const drawMoodGraph = useCallback(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "rgba(30, 30, 50, 0.3)";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const history = moodHistoryRef.current;
    if (history.length < 2) return;

    const emotionColors: Partial<Record<EmotionName, string>> = {
      Happy: "#64ffda",
      Sad: "#60a5fa",
      Angry: "#ff6b6b",
      Surprised: "#fbbf24",
    };

    for (const [emotion, color] of Object.entries(emotionColors)) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      history.forEach((data, i) => {
        const x = (i / (history.length - 1)) * w;
        const y = h - (data[emotion as EmotionName] / 100) * h;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    }
  }, []);

  // Update Tips
  const updateTips = useCallback(
    (emotion: EmotionName, fatigue: number, engagement: number) => {
      if (fatigue > 50) {
        setTip("😴 You seem tired. Consider taking a break!");
      } else if (engagement < 40) {
        setTip("🎯 Try to look at the screen for better tracking");
      } else {
        const tips: Record<EmotionName, string> = {
          Happy: "Great mood! Keep smiling! 😊",
          Sad: "It's okay to feel sad. Take a deep breath. 💙",
          Angry: "Try to relax. Take a moment to calm down. 🧘",
          Surprised: "Something caught your attention! 👀",
          Fear: "You seem worried. Everything will be okay. 💚",
          Neutral: "Looking calm and composed. 😌",
        };
        setTip(tips[emotion]);
      }
    },
    []
  );

  // Process Results
  const onResults = useCallback(
    (results: any) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks: Landmark[] = results.multiFaceLandmarks[0];

        setIsFaceDetected(true);

        drawFaceMesh(landmarks);

        const emotionResult = detectEmotion(landmarks);
        setCurrentEmotion(emotionResult.emotion);
        setEmotionConfidence(emotionResult.confidence);

        detectBlink(landmarks);

        const engagement = calculateEngagement(landmarks);
        setEngagementLevel(engagement);

        const fatigue = calculateFatigue(landmarks);
        setFatigueLevel(fatigue);

        const tilt = calculateHeadPose(landmarks);
        setHeadTilt(tilt);

        updateTips(emotionResult.emotion, fatigue, engagement);

        // Update history
        moodHistoryRef.current.push({ ...smoothedScoresRef.current });
        if (moodHistoryRef.current.length > 100) {
          moodHistoryRef.current.shift();
        }

        drawMoodGraph();
      } else {
        setIsFaceDetected(false);
        const canvas = overlayCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    },
    [
      drawFaceMesh,
      detectEmotion,
      detectBlink,
      calculateEngagement,
      calculateFatigue,
      calculateHeadPose,
      updateTips,
      drawMoodGraph,
    ]
  );

  // Start Camera
  const startCamera = useCallback(async () => {
    setShowPermission(false);
    setIsLoading(true);

    try {
      // First, try to get the camera stream directly for better compatibility
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (mediaError) {
        console.warn("Direct camera access failed, trying MediaPipe Camera:", mediaError);
      }

      // @ts-ignore
      const { FaceMesh } = await import("@mediapipe/face_mesh");

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      // If we already have a stream, use requestAnimationFrame to send frames
      if (stream && videoRef.current) {
        const processFrame = async () => {
          if (faceMeshRef.current && videoRef.current && videoRef.current.readyState >= 2) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }
          if (faceMeshRef.current) {
            requestAnimationFrame(processFrame);
          }
        };
        requestAnimationFrame(processFrame);
      } else {
        // Fallback to MediaPipe Camera utility
        // @ts-ignore
        const { Camera } = await import("@mediapipe/camera_utils");

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMeshRef.current && videoRef.current) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720,
          });

          await camera.start();
          cameraRef.current = camera;
        }
      }

      setSessionStartTime(Date.now());
      setIsLoading(false);
    } catch (error) {
      console.error("Error starting camera:", error);
      setIsLoading(false);
    }
  }, [onResults]);

  // Reset Stats
  const resetStats = useCallback(() => {
    setBlinkCount(0);
    blinkTimesRef.current = [];
    moodHistoryRef.current = [];
    emotionDurationsRef.current = {
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Surprised: 0,
      Fear: 0,
      Neutral: 0,
    };
    setSessionStartTime(Date.now());
  }, []);

  // Take Screenshot
  const takeScreenshot = useCallback(() => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    if (!video || !overlay) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = overlay.width;
    tempCanvas.height = overlay.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(overlay, 0, 0);

      const link = document.createElement("a");
      link.download = `mood-capture-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL("image/png");
      link.click();
    }
  }, []);

  // Resize canvases
  useEffect(() => {
    const resize = () => {
      if (containerRef.current && overlayCanvasRef.current) {
        overlayCanvasRef.current.width = containerRef.current.clientWidth;
        overlayCanvasRef.current.height = containerRef.current.clientHeight;
      }
      if (graphCanvasRef.current) {
        const parent = graphCanvasRef.current.parentElement;
        if (parent) {
          graphCanvasRef.current.width = parent.clientWidth;
          graphCanvasRef.current.height = parent.clientHeight;
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStartTime) {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const mins = Math.floor(elapsed / 60)
          .toString()
          .padStart(2, "0");
        const secs = (elapsed % 60).toString().padStart(2, "0");
        setSessionTime(`${mins}:${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Cleanup function to stop all resources
  const cleanupResources = useCallback(() => {
    console.log("Cleaning up mood analyzer resources...");

    // First, stop faceMesh to prevent further frame processing
    if (faceMeshRef.current) {
      try {
        faceMeshRef.current.close();
        console.log("FaceMesh closed");
      } catch (e) {
        console.warn("Error closing faceMesh:", e);
      }
      faceMeshRef.current = null;
    }

    // Stop MediaPipe camera utility
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
        console.log("MediaPipe camera stopped");
      } catch (e) {
        console.warn("Error stopping camera:", e);
      }
      cameraRef.current = null;
    }

    // Release video stream - this is the most critical cleanup
    if (videoRef.current) {
      try {
        // Pause video first
        videoRef.current.pause();

        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          // Stop each track individually
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
              console.log(`Stopped ${track.kind} track: ${track.label}`);
            } catch (trackError) {
              console.warn(`Error stopping ${track.kind} track:`, trackError);
            }
          });
          videoRef.current.srcObject = null;
        }

        // Clear the video source completely
        videoRef.current.src = "";
        videoRef.current.load();
      } catch (e) {
        console.warn("Error releasing video stream:", e);
      }
    }

    console.log("Mood analyzer cleanup complete");
  }, []);

  // Cleanup on unmount, beforeunload, and visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupResources();
    };

    const handleVisibilityChange = () => {
      // If the page becomes hidden (e.g., tab switch, minimize), 
      // we may want to keep the camera running, but if the user closes
      // we should clean up
      if (document.visibilityState === 'hidden') {
        console.log("Page hidden, but keeping camera active until close");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Call cleanup on unmount
      cleanupResources();
    };
  }, [cleanupResources]);

  const currentEmotionConfig = emotions[currentEmotion];

  return (
    <div style={styles.container}>
      {/* Permission Prompt */}
      {showPermission && (
        <div style={styles.overlay}>
          <div style={styles.permissionIcon}>😊</div>
          <h2 style={styles.overlayTitle}>Facial Expression Analyzer</h2>
          <p style={styles.overlayDesc}>
            This app analyzes your facial expressions to detect emotions in
            real-time. Camera access is required.
          </p>
          <button style={styles.permissionBtn} onClick={startCamera}>
            Start Analysis
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && !showPermission && (
        <div style={styles.overlay}>
          <div style={styles.spinner} />
          <p style={styles.overlayTitle}>Loading Face Detection Model...</p>
        </div>
      )}

      {/* Video Section */}
      <div style={styles.videoSection}>
        <div style={styles.videoContainer} ref={containerRef}>
          <video ref={videoRef} style={styles.video} autoPlay playsInline />
          <canvas ref={overlayCanvasRef} style={styles.overlayCanvas} />

          {/* Status Bar */}
          <div style={styles.statusBar}>
            <div style={styles.statusLeft}>
              <div
                style={{
                  ...styles.statusIndicator,
                  backgroundColor: isFaceDetected ? "#64ffda" : "#ff6b6b",
                  boxShadow: isFaceDetected ? "0 0 15px #64ffda" : "none",
                }}
              />
              <span style={styles.statusText}>
                {isFaceDetected ? "Face detected" : "No face detected"}
              </span>
            </div>
            <span style={styles.sessionTimeText}>{sessionTime}</span>
          </div>

          {/* Emotion Bubble */}
          <div
            style={{
              ...styles.emotionBubble,
              borderColor: currentEmotionConfig.color,
            }}>
            <div style={styles.emotionEmoji}>{currentEmotionConfig.emoji}</div>
            <div
              style={{
                ...styles.emotionName,
                color: currentEmotionConfig.color,
              }}>
              {currentEmotion}
            </div>
            <div style={styles.emotionConfidence}>
              Confidence: {Math.round(emotionConfidence)}%
            </div>
          </div>

          {/* Tips */}
          <div style={styles.tipsBar}>
            <span style={styles.tipIcon}>💡</span>
            <span style={styles.tipText}>{tip}</span>
          </div>
        </div>
      </div>

      {/* Analysis Panel */}
      <div style={styles.analysisPanel}>
        <h1 style={styles.panelTitle}>📊 Mood Analysis</h1>

        {/* Emotion Bars */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎭 Emotion Levels</div>
          <div style={styles.emotionBars}>
            {(Object.keys(emotions) as EmotionName[]).map((emotion) => (
              <div key={emotion} style={styles.emotionBarItem}>
                <span style={styles.emotionBarEmoji}>
                  {emotions[emotion].emoji}
                </span>
                <span style={styles.emotionBarName}>{emotion}</span>
                <div style={styles.emotionBarContainer}>
                  <div
                    style={{
                      ...styles.emotionBarFill,
                      width: `${Math.round(emotionScores[emotion])}%`,
                      backgroundColor: emotions[emotion].color,
                    }}
                  />
                </div>
                <span style={styles.emotionBarValue}>
                  {Math.round(emotionScores[emotion])}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📈 Key Metrics</div>
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricIcon}>😊</div>
              <div style={styles.metricValue}>
                {Math.round(smileIntensity)}%
              </div>
              <div style={styles.metricLabel}>Smile</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricIcon}>👁️</div>
              <div style={styles.metricValue}>{blinkCount}</div>
              <div style={styles.metricLabel}>Blinks</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricIcon}>🎯</div>
              <div style={styles.metricValue}>
                {Math.round(engagementLevel)}%
              </div>
              <div style={styles.metricLabel}>Engagement</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricIcon}>😴</div>
              <div style={styles.metricValue}>{Math.round(fatigueLevel)}%</div>
              <div style={styles.metricLabel}>Fatigue</div>
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📊 Detailed Analysis</div>

          <div style={styles.progressItem}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>😊 Smile Intensity</span>
              <span style={styles.progressValue}>
                {Math.round(smileIntensity)}%
              </span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${smileIntensity}%`,
                  background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                }}
              />
            </div>
          </div>

          <div style={styles.progressItem}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>🎯 Engagement Level</span>
              <span style={styles.progressValue}>
                {Math.round(engagementLevel)}%
              </span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${engagementLevel}%`,
                  background: "linear-gradient(90deg, #4ecdc4, #64ffda)",
                }}
              />
            </div>
          </div>

          <div style={styles.progressItem}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>😴 Fatigue Level</span>
              <span style={styles.progressValue}>
                {Math.round(fatigueLevel)}%
              </span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${fatigueLevel}%`,
                  background: "linear-gradient(90deg, #ff6b6b, #ee5a5a)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Mood Graph */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📉 Mood History</div>
          <div style={styles.graphContainer}>
            <canvas ref={graphCanvasRef} style={styles.graphCanvas} />
          </div>
          <div style={styles.graphLegend}>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: "#64ffda" }}
              />
              <span>Happy</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: "#60a5fa" }}
              />
              <span>Sad</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: "#ff6b6b" }}
              />
              <span>Angry</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: "#fbbf24" }}
              />
              <span>Surprise</span>
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>⏱️ Session Statistics</div>
          <div style={styles.sessionStats}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{blinkRate}</div>
              <div style={styles.statLabel}>Blinks/min</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{dominantMood.slice(0, 3)}</div>
              <div style={styles.statLabel}>Dominant</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{Math.round(eyeOpenness)}%</div>
              <div style={styles.statLabel}>Eye Open</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{Math.round(headTilt)}°</div>
              <div style={styles.statLabel}>Head Tilt</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonGroup}>
          <button style={styles.resetBtn} onClick={resetStats}>
            🔄 Reset
          </button>
          <button style={styles.screenshotBtn} onClick={takeScreenshot}>
            📸 Capture
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background:
      "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "#0f0c29",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  permissionIcon: {
    fontSize: "5rem",
    marginBottom: 20,
  },
  overlayTitle: {
    color: "#fff",
    fontSize: "1.2rem",
    marginTop: 20,
  },
  overlayDesc: {
    color: "#a0a0c0",
    textAlign: "center",
    maxWidth: 400,
    marginTop: 10,
    lineHeight: 1.5,
    padding: "0 20px",
  },
  permissionBtn: {
    padding: "15px 50px",
    background: "linear-gradient(135deg, #64ffda, #4ecdc4)",
    border: "none",
    borderRadius: 12,
    color: "#0f0c29",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 25,
  },
  spinner: {
    width: 60,
    height: 60,
    border: "4px solid rgba(100, 255, 218, 0.2)",
    borderTopColor: "#64ffda",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  videoSection: {
    flex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  videoContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
  },
  overlayCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  statusBar: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: "rgba(15, 12, 41, 0.85)",
    borderRadius: 12,
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    transition: "all 0.3s",
  },
  statusText: {
    color: "#fff",
    fontSize: "0.95rem",
  },
  sessionTimeText: {
    color: "#a0a0c0",
    fontSize: "0.9rem",
  },
  emotionBubble: {
    position: "absolute",
    top: 80,
    left: "50%",
    transform: "translateX(-50%)",
    textAlign: "center",
    padding: "15px 30px",
    background: "rgba(15, 12, 41, 0.9)",
    borderRadius: 20,
    border: "2px solid #64ffda",
    boxShadow: "0 0 30px rgba(100, 255, 218, 0.3)",
  },
  emotionEmoji: {
    fontSize: "3rem",
    marginBottom: 5,
  },
  emotionName: {
    fontSize: "1.3rem",
    fontWeight: "bold",
  },
  emotionConfidence: {
    color: "#a0a0c0",
    fontSize: "0.85rem",
    marginTop: 3,
  },
  tipsBar: {
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
    padding: "12px 20px",
    background: "rgba(15, 12, 41, 0.85)",
    borderRadius: 12,
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    color: "#fbbf24",
    fontSize: "0.9rem",
  },
  analysisPanel: {
    width: 380,
    background: "rgba(15, 12, 41, 0.95)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 15,
    borderLeft: "2px solid rgba(100, 255, 218, 0.3)",
    overflowY: "auto",
  },
  panelTitle: {
    color: "#fff",
    fontSize: "1.4rem",
    textAlign: "center",
    paddingBottom: 10,
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    margin: 0,
  },
  section: {
    background: "rgba(40, 40, 70, 0.5)",
    borderRadius: 12,
    padding: 15,
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  sectionTitle: {
    color: "#a0a0c0",
    fontSize: "0.8rem",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  emotionBars: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  emotionBarItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  emotionBarEmoji: {
    fontSize: "1.2rem",
    width: 28,
    textAlign: "center",
  },
  emotionBarName: {
    width: 70,
    color: "#a0a0c0",
    fontSize: "0.85rem",
  },
  emotionBarContainer: {
    flex: 1,
    height: 12,
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    overflow: "hidden",
  },
  emotionBarFill: {
    height: "100%",
    borderRadius: 6,
    transition: "width 0.3s ease",
  },
  emotionBarValue: {
    width: 45,
    textAlign: "right",
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  metricCard: {
    background: "rgba(60, 60, 90, 0.3)",
    borderRadius: 10,
    padding: 12,
    textAlign: "center",
  },
  metricIcon: {
    fontSize: "1.5rem",
    marginBottom: 5,
  },
  metricValue: {
    color: "#64ffda",
    fontSize: "1.4rem",
    fontWeight: "bold",
  },
  metricLabel: {
    color: "#a0a0c0",
    fontSize: "0.75rem",
    marginTop: 3,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  progressLabel: {
    color: "#a0a0c0",
    fontSize: "0.85rem",
  },
  progressValue: {
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s",
  },
  graphContainer: {
    height: 120,
    position: "relative",
    background: "rgba(30, 30, 50, 0.5)",
    borderRadius: 8,
    overflow: "hidden",
  },
  graphCanvas: {
    width: "100%",
    height: "100%",
  },
  graphLegend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: "0.7rem",
    color: "#a0a0c0",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  sessionStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  statItem: {
    background: "rgba(60, 60, 90, 0.3)",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
  },
  statValue: {
    color: "#64ffda",
    fontSize: "1.1rem",
    fontWeight: "bold",
  },
  statLabel: {
    color: "#a0a0c0",
    fontSize: "0.7rem",
    marginTop: 2,
  },
  buttonGroup: {
    display: "flex",
    gap: 10,
  },
  resetBtn: {
    flex: 1,
    padding: 12,
    border: "1px solid #ff6b6b",
    borderRadius: 8,
    fontSize: "0.9rem",
    cursor: "pointer",
    background: "rgba(255, 107, 107, 0.2)",
    color: "#ff6b6b",
  },
  screenshotBtn: {
    flex: 1,
    padding: 12,
    border: "1px solid #64ffda",
    borderRadius: 8,
    fontSize: "0.9rem",
    cursor: "pointer",
    background: "rgba(100, 255, 218, 0.2)",
    color: "#64ffda",
  },
};

// Add keyframe animation
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}
