"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Square,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Game } from "@/lib/games/games-config";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GamePlayerProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GamePlayer({ game, isOpen, onClose }: GamePlayerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCustomComponent, setShowCustomComponent] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pyodideRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const stopExecution = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setShowCustomComponent(false);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (output.length > 0) {
      setOutput((prev) => [...prev, "Game stopped"]);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopExecution();
    }
  }, [isOpen]);

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setOutput((prev) => [...prev, "✓ Camera initialized"]);
      }
    } catch (err: any) {
      setError(`Camera access denied: ${err.message}`);
    }
  };

  const loadPyodide = async () => {
    if (pyodideRef.current) return;

    try {
      setIsLoading(true);
      setOutput((prev) => [...prev, "Loading Python environment..."]);

      // @ts-ignore
      if (typeof window !== "undefined" && !window.loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // @ts-ignore
      pyodideRef.current = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
      });

      setOutput((prev) => [...prev, "✓ Python environment loaded"]);

      // Load commonly used packages
      setOutput((prev) => [
        ...prev,
        "Installing packages (this may take a moment)...",
      ]);
      try {
        // Load basic packages first
        await pyodideRef.current.loadPackage(["numpy", "micropip"]);
        setOutput((prev) => [...prev, "✓ Basic packages installed"]);

        // Try to load opencv if needed (note: opencv-python has limited support in Pyodide)
        try {
          setOutput((prev) => [
            ...prev,
            "Loading opencv (limited browser support)...",
          ]);
          await pyodideRef.current.loadPackage(["opencv-python"]);
          setOutput((prev) => [
            ...prev,
            "✓ OpenCV loaded (limited functionality)",
          ]);
        } catch (cvError) {
          console.warn("OpenCV not available:", cvError);
          setOutput((prev) => [
            ...prev,
            "⚠ OpenCV not available in browser - use JavaScript mode for camera",
          ]);
        }
      } catch (pkgError: any) {
        console.error("Error loading packages:", pkgError);
        setOutput((prev) => [
          ...prev,
          `⚠ Some packages failed to load: ${pkgError.message}`,
        ]);
      }
    } catch (err: any) {
      setError(`Failed to load Pyodide: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const runPythonGame = async () => {
    if (!game?.pythonFile) return;

    if (!pyodideRef.current) {
      await loadPyodide();
    }

    setIsRunning(true);
    setError(null);

    try {
      setOutput((prev) => [...prev, `Loading ${game.name}...`]);
      const response = await fetch(game.pythonFile);

      if (!response.ok) {
        throw new Error("Failed to load game file");
      }

      const pythonCode = await response.text();

      if (!pythonCode || pythonCode.trim().length === 0) {
        throw new Error(
          "Game file is empty. Please add your Python code to the file."
        );
      }

      setOutput((prev) => [...prev, "Executing game..."]);

      // Set up canvas for rendering
      if (canvasRef.current && pyodideRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        pyodideRef.current.globals.set("canvas", canvasRef.current);
        pyodideRef.current.globals.set("ctx", ctx);
      }

      // Check for unsupported libraries in the code
      const codeStr = pythonCode.toLowerCase();
      if (codeStr.includes("cv2") || codeStr.includes("opencv")) {
        setOutput((prev) => [
          ...prev,
          "⚠ Warning: OpenCV has limited browser support",
        ]);
        setOutput((prev) => [
          ...prev,
          "⚠ Camera access (cv2.VideoCapture) won't work",
        ]);
        setOutput((prev) => [
          ...prev,
          "💡 Consider using JavaScript mode instead",
        ]);
      }

      if (codeStr.includes("mediapipe")) {
        setOutput((prev) => [
          ...prev,
          "⚠ Warning: MediaPipe not available in Pyodide",
        ]);
        setOutput((prev) => [
          ...prev,
          "💡 Use JavaScript mode with @mediapipe/hands",
        ]);
      }

      if (codeStr.includes("pygame")) {
        setOutput((prev) => [
          ...prev,
          "⚠ Warning: Pygame not available in browser",
        ]);
        setOutput((prev) => [
          ...prev,
          "💡 Use canvas API in Python or JavaScript mode",
        ]);
      }

      // Run the Python code directly
      const result = await pyodideRef.current.runPythonAsync(pythonCode);

      setOutput((prev) => [...prev, "✓ Game code executed"]);
      if (result) {
        setOutput((prev) => [...prev, `${result}`]);
      }
    } catch (err: any) {
      let errorMsg = err.message || "Error running game";

      // Provide helpful error messages
      if (errorMsg.includes("opencv") || errorMsg.includes("cv2")) {
        errorMsg =
          "OpenCV/cv2 is not fully supported in browser. Use JavaScript mode for camera features.";
      } else if (errorMsg.includes("mediapipe")) {
        errorMsg =
          "MediaPipe is not available in Pyodide. Use JavaScript mode with @mediapipe/hands.";
      }

      setError(errorMsg);
      console.error(err);
      setIsRunning(false);
    }
  };

  const runJavaScriptGame = async () => {
    setIsRunning(true);
    isRunningRef.current = true;
    setError(null);
    setOutput([`Starting ${game?.name}...`]);

    try {
      await setupCamera();
      setOutput((prev) => [...prev, "✓ Game initialized"]);

      // Initialize Three.js scene
      if (!canvasRef.current || !videoRef.current) return;

      const THREE = await import("three");
      const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
      const { Camera } = await import("@mediapipe/camera_utils");
      const { drawConnectors, drawLandmarks } = await import(
        "@mediapipe/drawing_utils"
      );

      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Create overlay canvas for hand landmarks on video
      const overlayCanvas = document.createElement("canvas");
      overlayCanvas.width = 640;
      overlayCanvas.height = 480;
      overlayCanvas.style.position = "absolute";
      overlayCanvas.style.top = "0";
      overlayCanvas.style.left = "0";
      overlayCanvas.style.width = "100%";
      overlayCanvas.style.height = "100%";
      overlayCanvas.style.pointerEvents = "none";
      video.parentElement?.appendChild(overlayCanvas);
      const overlayCtx = overlayCanvas.getContext("2d")!;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        canvas.width / canvas.height,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
      });

      renderer.setSize(canvas.width, canvas.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance optimization

      // Solid black background
      scene.background = new THREE.Color(0x000000);

      // Create visually appealing sphere with gradient effect
      const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);

      // Main sphere with particles
      const particleMaterial = new THREE.PointsMaterial({
        color: 0x00ffaa,
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const particleSphere = new THREE.Points(sphereGeometry, particleMaterial);
      scene.add(particleSphere);

      // Add wireframe for more detail
      const wireframeGeometry = new THREE.SphereGeometry(2.05, 32, 32);
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      const wireframeSphere = new THREE.Mesh(
        wireframeGeometry,
        wireframeMaterial
      );
      scene.add(wireframeSphere);

      // Add glowing inner sphere
      const innerGeometry = new THREE.SphereGeometry(1.8, 32, 32);
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
      });
      const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
      scene.add(innerSphere);

      // Enhanced lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0x00ffaa, 1, 100);
      pointLight1.position.set(5, 5, 5);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0x00aaff, 0.5, 100);
      pointLight2.position.set(-5, -5, 5);
      scene.add(pointLight2);

      camera.position.z = 5;

      let rotationX = 0;
      let rotationY = 0;
      let targetRotationX = 0;
      let targetRotationY = 0;
      let scale = 1;
      let targetScale = 1;
      let autoRotate = true;
      let handResults: any = null;

      // Setup MediaPipe Hands with optimized settings
      const hands = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0, // Lower for better performance
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results: any) => {
        handResults = results;

        // Clear overlay canvas
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        overlayCtx.save();
        overlayCtx.scale(-1, 1); // Mirror for natural interaction
        overlayCtx.translate(-overlayCanvas.width, 0);

        if (
          results.multiHandLandmarks &&
          results.multiHandLandmarks.length > 0
        ) {
          autoRotate = false;

          // Draw hand landmarks and connections
          for (const landmarks of results.multiHandLandmarks) {
            // Draw connections with gradient
            drawConnectors(overlayCtx, landmarks, HAND_CONNECTIONS, {
              color: "#00FF88",
              lineWidth: 3,
            });

            // Draw landmarks
            drawLandmarks(overlayCtx, landmarks, {
              color: "#00FFFF",
              fillColor: "#FF0000",
              radius: 4,
              lineWidth: 2,
            });
          }

          const hand = results.multiHandLandmarks[0];

          // Use index finger tip (landmark 8) to control rotation - smooth interpolation
          const indexTip = hand[8];
          targetRotationY = (indexTip.x - 0.5) * Math.PI * 2;
          targetRotationX = (indexTip.y - 0.5) * Math.PI * 2;

          // Use distance between thumb and index for zoom
          const thumbTip = hand[4];
          const distance = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) +
            Math.pow(indexTip.y - thumbTip.y, 2)
          );
          targetScale = 0.7 + distance * 2.5;
        } else {
          autoRotate = true;
        }

        overlayCtx.restore();
      });

      // Connect camera to hands with throttling for performance
      let lastProcessTime = 0;
      const processInterval = 50; // Process every 50ms instead of every frame

      if (video) {
        const cameraInstance = new Camera(video, {
          onFrame: async () => {
            const now = Date.now();
            if (
              video &&
              isRunningRef.current &&
              now - lastProcessTime > processInterval
            ) {
              await hands.send({ image: video });
              lastProcessTime = now;
            }
          },
          width: 640,
          height: 480,
        });
        cameraInstance.start();
      }

      // Smooth animation loop
      const animate = () => {
        if (!isRunningRef.current) {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          // Clean up overlay canvas
          overlayCanvas.remove();
          return;
        }

        animationRef.current = requestAnimationFrame(animate);

        // Smooth interpolation for less laggy movement
        rotationX += (targetRotationX - rotationX) * 0.1;
        rotationY += (targetRotationY - rotationY) * 0.1;
        scale += (targetScale - scale) * 0.1;

        // Auto-rotate if no hand detected
        if (autoRotate) {
          particleSphere.rotation.y += 0.008;
          particleSphere.rotation.x += 0.004;
          wireframeSphere.rotation.y += 0.006;
          wireframeSphere.rotation.x += 0.003;
        } else {
          // Apply hand-controlled transformations
          particleSphere.rotation.x = rotationX;
          particleSphere.rotation.y = rotationY;
          wireframeSphere.rotation.x = rotationX * 0.8;
          wireframeSphere.rotation.y = rotationY * 0.8;
        }

        particleSphere.scale.set(scale, scale, scale);
        wireframeSphere.scale.set(scale * 1.02, scale * 1.02, scale * 1.02);
        innerSphere.scale.set(scale * 0.95, scale * 0.95, scale * 0.95);

        // Animate lights for dynamic effect
        const time = Date.now() * 0.001;
        pointLight1.position.x = Math.sin(time) * 5;
        pointLight1.position.y = Math.cos(time) * 5;

        renderer.render(scene, camera);
      };

      animate();
      setOutput((prev) => [
        ...prev,
        "✓ Hand tracking active - move your hand!",
        "💡 Pinch thumb & index to zoom",
      ]);
    } catch (err: any) {
      setError(err.message);
      console.error("Game error:", err);
      setIsRunning(false);
      isRunningRef.current = false;
    }
  };

  const startGame = () => {
    if (!game) return;

    setOutput([]);
    setError(null);

    // Check if game has a custom component
    if (game.component) {
      setIsRunning(true);
      setShowCustomComponent(true);
      setOutput([`Starting ${game.name}...`]);
      return;
    }

    if (game.type === "python") {
      runPythonGame();
    } else {
      runJavaScriptGame();
    }
  };

  const toggleFullscreen = async () => {
    if (!gameContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await gameContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleClose = () => {
    stopExecution();
    setOutput([]);
    setError(null);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onClose();
  };

  if (!game) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
        className="relative bg-card border-2 border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4 shadow-hard-lg"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b-2 border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">{game.name}</h2>
            <p className="text-sm text-muted-foreground font-bold">{game.description}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground font-bold p-1 cursor-pointer transition-colors">
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Controls */}
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  onClick={startGame}
                  disabled={isLoading}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-border font-bold shadow-hard-sm cursor-pointer transition-all active:scale-95">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      Start Game
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={stopExecution}
                  variant="destructive"
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="gap-2 border-2 border-border font-bold shadow-hard-sm cursor-pointer transition-all active:scale-95">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}
            </div>
            {isRunning && (
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                className="gap-2">
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    Fullscreen
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Game Display */}
          <div
            ref={gameContainerRef}
            className={`${isFullscreen
              ? "fixed inset-0 z-50 bg-black flex items-center justify-center"
              : ""
              }`}>
            {/* Render custom component if game has one */}
            {showCustomComponent && game?.component ? (
              <Suspense fallback={
                <div className="flex items-center justify-center h-[480px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
                {(() => {
                  const GameComponent = game.component;
                  return <GameComponent />;
                })()}
              </Suspense>
            ) : isFullscreen ? (
              /* Fullscreen Layout: Sphere centered, camera in corner */
              <>
                {/* Canvas for rendering - Full screen centered */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="max-w-full max-h-full"
                  />
                </div>

                {/* Video feed - Bottom right corner */}
                {game.type === "javascript" && (
                  <div className="absolute bottom-4 right-4 w-64 h-48 bg-black rounded-lg overflow-hidden border-2 border-[#00ffaa]/30 shadow-2xl">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                    />
                    <div className="absolute bottom-1 left-1 text-white text-xs bg-black/70 px-2 py-0.5 rounded">
                      Camera
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Normal Layout: Side by side */
              <div className="grid md:grid-cols-2 gap-4">
                {/* Video feed (if needed) */}
                {game.type === "javascript" && (
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                    />
                    <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                      Camera Feed
                    </div>
                  </div>
                )}

                {/* Canvas for rendering */}
                <div
                  className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${game.type === "python" ? "md:col-span-2" : ""
                    }`}>
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="max-w-full max-h-full"
                  />
                  <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                    Game Output
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Output Console */}
          {output.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Console:</h3>
              <div className="bg-muted p-3 rounded-lg font-mono text-xs max-h-32 overflow-y-auto space-y-1">
                {output.map((line, i) => (
                  <div key={i} className="text-green-600">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {game.type === "python" &&
            !isRunning &&
            !error &&
            output.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure you've added your Python code to{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {game.pythonFile}
                  </code>
                </AlertDescription>
              </Alert>
            )}
        </div>
      </div>
    </div>
  );
}
