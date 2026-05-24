"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// TypeScript interfaces
interface Landmark {
    x: number;
    y: number;
    z: number;
}

interface FingerStates {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
}

declare global {
    interface Window {
        Hands: any;
        Camera: any;
    }
}

type DrawingMode = 'DRAW' | 'ERASE' | 'CLEAR' | 'NONE' | 'WAITING';

export default function HandDrawing() {
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const handsRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);
    const [currentColor, setCurrentColor] = useState('#ff6b9d');
    const [brushSize, setBrushSize] = useState(15);
    const [currentMode, setCurrentMode] = useState<DrawingMode>('WAITING');
    const [isHandDetected, setIsHandDetected] = useState(false);
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
    const [clearProgress, setClearProgress] = useState(0);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0, size: 0, color: '', isEraser: false, visible: false });
    const [loadingError, setLoadingError] = useState<string | null>(null);

    // Drawing state refs (to avoid stale closures)
    const prevPosRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
    const clearCounterRef = useRef(0);
    const currentColorRef = useRef(currentColor);
    const brushSizeRef = useRef(brushSize);

    const eraserSize = 50;
    const clearThreshold = 30;
    const isActiveRef = useRef(false);

    const colors = [
        '#ff6b9d', '#64ffda', '#a78bfa', '#fbbf24',
        '#34d399', '#60a5fa', '#f472b6', '#ffffff'
    ];

    // Update refs when state changes
    useEffect(() => {
        currentColorRef.current = currentColor;
    }, [currentColor]);

    useEffect(() => {
        brushSizeRef.current = brushSize;
    }, [brushSize]);

    // Resize canvases
    const resizeCanvases = useCallback(() => {
        if (!containerRef.current || !drawingCanvasRef.current || !overlayCanvasRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        drawingCanvasRef.current.width = width;
        drawingCanvasRef.current.height = height;
        overlayCanvasRef.current.width = width;
        overlayCanvasRef.current.height = height;

        const ctx = drawingCanvasRef.current.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, []);

    // Get finger states from landmarks
    const getFingerStates = useCallback((landmarks: Landmark[]): FingerStates => {
        const fingerStates: FingerStates = {
            thumb: false,
            index: false,
            middle: false,
            ring: false,
            pinky: false
        };

        // Thumb
        const thumbTip = landmarks[4];
        const thumbMCP = landmarks[2];
        fingerStates.thumb = Math.abs(thumbTip.x - thumbMCP.x) > 0.04;

        // Other fingers - compare tip y with pip y
        const fingerTips = [8, 12, 16, 20];
        const fingerPIPs = [6, 10, 14, 18];
        const fingerNames: (keyof FingerStates)[] = ['index', 'middle', 'ring', 'pinky'];

        for (let i = 0; i < 4; i++) {
            const tip = landmarks[fingerTips[i]];
            const pip = landmarks[fingerPIPs[i]];
            fingerStates[fingerNames[i]] = tip.y < pip.y;
        }

        return fingerStates;
    }, []);

    // Count extended fingers
    const countFingers = useCallback((fingerStates: FingerStates): number => {
        return Object.values(fingerStates).filter(v => v).length;
    }, []);

    // Draw hand landmarks
    const drawHandLandmarks = useCallback((landmarks: Landmark[]) => {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return;

        const ctx = overlayCanvas.getContext('2d');
        if (!ctx) return;

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],           // Index
            [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
            [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
            [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
            [5, 9], [9, 13], [13, 17]                  // Palm
        ];

        ctx.strokeStyle = 'rgba(100, 255, 218, 0.6)';
        ctx.lineWidth = 2;

        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            ctx.beginPath();
            ctx.moveTo((1 - p1.x) * overlayCanvas.width, p1.y * overlayCanvas.height);
            ctx.lineTo((1 - p2.x) * overlayCanvas.width, p2.y * overlayCanvas.height);
            ctx.stroke();
        });

        // Draw points
        landmarks.forEach((landmark, index) => {
            const x = (1 - landmark.x) * overlayCanvas.width;
            const y = landmark.y * overlayCanvas.height;

            ctx.beginPath();
            ctx.arc(x, y, index === 8 ? 8 : 4, 0, Math.PI * 2);
            ctx.fillStyle = index === 8 ? '#ff6b9d' : 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        });
    }, []);

    // Process MediaPipe results
    const onResults = useCallback((results: any) => {
        const overlayCanvas = overlayCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        if (!overlayCanvas || !drawingCanvas) return;

        const overlayCtx = overlayCanvas.getContext('2d');
        const drawingCtx = drawingCanvas.getContext('2d');
        if (!overlayCtx || !drawingCtx) return;

        // Clear overlay
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const fingerStates = getFingerStates(landmarks);
            const fingerCount = countFingers(fingerStates);

            // Get index finger tip position (mirror x to match video)
            const indexTip = landmarks[8];
            const x = (1 - indexTip.x) * overlayCanvas.width;
            const y = indexTip.y * overlayCanvas.height;

            // Update status
            setIsHandDetected(true);
            setCoordinates({ x: Math.round(x), y: Math.round(y) });

            // Draw hand landmarks
            drawHandLandmarks(landmarks);

            // Determine mode
            if (fingerCount >= 5) {
                // Open hand - Clear mode
                setCurrentMode('CLEAR');
                clearCounterRef.current++;

                setClearProgress((clearCounterRef.current / clearThreshold) * 100);

                if (clearCounterRef.current >= clearThreshold) {
                    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    clearCounterRef.current = 0;
                }

                prevPosRef.current = { x: null, y: null };
                setCursorPosition(prev => ({ ...prev, visible: false }));

            } else if (fingerStates.index && fingerStates.middle && !fingerStates.ring && !fingerStates.pinky) {
                // Two fingers - Erase mode
                setCurrentMode('ERASE');
                clearCounterRef.current = 0;
                setClearProgress(0);

                // Erase
                drawingCtx.save();
                drawingCtx.globalCompositeOperation = 'destination-out';
                drawingCtx.beginPath();
                drawingCtx.arc(x, y, eraserSize, 0, Math.PI * 2);
                drawingCtx.fill();
                drawingCtx.restore();

                // Show eraser cursor
                setCursorPosition({ x, y, size: eraserSize, color: 'rgba(255, 255, 255, 0.5)', isEraser: true, visible: true });

                prevPosRef.current = { x: null, y: null };

            } else if (fingerStates.index && !fingerStates.middle && !fingerStates.ring && !fingerStates.pinky) {
                // One finger - Draw mode
                setCurrentMode('DRAW');
                clearCounterRef.current = 0;
                setClearProgress(0);

                const prevX = prevPosRef.current.x;
                const prevY = prevPosRef.current.y;

                if (prevX !== null && prevY !== null) {
                    const dist = Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);

                    if (dist < 100) {
                        drawingCtx.strokeStyle = currentColorRef.current;
                        drawingCtx.lineWidth = brushSizeRef.current;
                        drawingCtx.shadowColor = currentColorRef.current;
                        drawingCtx.shadowBlur = brushSizeRef.current / 2;
                        drawingCtx.beginPath();
                        drawingCtx.moveTo(prevX, prevY);
                        drawingCtx.lineTo(x, y);
                        drawingCtx.stroke();
                        drawingCtx.shadowBlur = 0;
                    }
                }

                prevPosRef.current = { x, y };

                // Show brush cursor
                setCursorPosition({ x, y, size: brushSizeRef.current + 5, color: currentColorRef.current, isEraser: false, visible: true });

            } else {
                // Other gestures - Pause
                setCurrentMode('NONE');
                clearCounterRef.current = 0;
                setClearProgress(0);
                prevPosRef.current = { x: null, y: null };
                setCursorPosition(prev => ({ ...prev, visible: false }));
            }

        } else {
            // No hand detected
            setIsHandDetected(false);
            setCoordinates({ x: 0, y: 0 });
            setCurrentMode('NONE');
            clearCounterRef.current = 0;
            setClearProgress(0);
            prevPosRef.current = { x: null, y: null };
            setCursorPosition(prev => ({ ...prev, visible: false }));
        }
    }, [getFingerStates, countFingers, drawHandLandmarks]);

    // Clear canvas
    const clearCanvas = useCallback(() => {
        const drawingCanvas = drawingCanvasRef.current;
        if (!drawingCanvas) return;

        const ctx = drawingCanvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        }
    }, []);

    // Save drawing
    const saveDrawing = useCallback(() => {
        const drawingCanvas = drawingCanvasRef.current;
        if (!drawingCanvas) return;

        const link = document.createElement('a');
        link.download = `gesture-drawing-${Date.now()}.png`;
        link.href = drawingCanvas.toDataURL('image/png');
        link.click();
    }, []);

    // Start camera
    const startCamera = useCallback(async () => {
        setShowPermissionPrompt(false);
        setIsLoading(true);
        setLoadingError(null);
        isActiveRef.current = true;

        try {
            // Wait for MediaPipe scripts to load
            await new Promise<void>((resolve, reject) => {
                const checkLoaded = () => {
                    if (window.Hands && window.Camera) {
                        resolve();
                    } else {
                        setTimeout(checkLoaded, 100);
                    }
                };
                checkLoaded();
                setTimeout(() => reject(new Error('Timeout loading MediaPipe')), 10000);
            });

            // Initialize MediaPipe Hands
            handsRef.current = new window.Hands({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            handsRef.current.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6
            });

            handsRef.current.onResults(onResults);

            // Start camera
            if (videoRef.current) {
                cameraRef.current = new window.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (handsRef.current && videoRef.current && isActiveRef.current) {
                            await handsRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 1280,
                    height: 720
                });

                await cameraRef.current.start();
            }

            setIsLoading(false);

        } catch (error) {
            console.error('Error starting camera:', error);
            setLoadingError('Error: Could not access camera. Please refresh and try again.');
        }
    }, [onResults]);

    // Initialize
    useEffect(() => {
        resizeCanvases();
        window.addEventListener('resize', resizeCanvases);

        // Load MediaPipe scripts
        const loadScript = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.crossOrigin = 'anonymous';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        };

        const loadScripts = async () => {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
            } catch (error) {
                console.error('Failed to load MediaPipe scripts:', error);
            }
        };

        loadScripts();

        return () => {
            window.removeEventListener('resize', resizeCanvases);
        };
    }, [resizeCanvases]);

    // Cleanup function to stop all resources
    const cleanupResources = useCallback(() => {
        console.log("Cleaning up hand drawing resources...");
        isActiveRef.current = false;

        // First close the hands detector to stop frame processing
        if (handsRef.current) {
            try {
                handsRef.current.close?.();
                console.log("Hands detector closed");
            } catch (e) {
                console.warn("Error closing hands:", e);
            }
            handsRef.current = null;
        }

        // Stop the MediaPipe camera utility
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

        console.log("Hand drawing cleanup complete");
    }, []);

    // Cleanup on unmount and beforeunload
    useEffect(() => {
        const handleBeforeUnload = () => {
            cleanupResources();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Call cleanup on unmount
            cleanupResources();
        };
    }, [cleanupResources]);

    const getModeClass = () => {
        switch (currentMode) {
            case 'DRAW': return styles.modeDraw;
            case 'ERASE': return styles.modeErase;
            case 'CLEAR': return styles.modeClear;
            default: return styles.modeNone;
        }
    };

    return (
        <div style={styles.container}>
            {/* Permission Prompt */}
            {showPermissionPrompt && (
                <div style={styles.permissionPrompt}>
                    <div style={styles.permissionIcon}>📷</div>
                    <h2 style={styles.permissionTitle}>Camera Access Required</h2>
                    <p style={styles.permissionDesc}>
                        This app needs camera access for hand gesture detection.
                        Your video is processed locally and never uploaded.
                    </p>
                    <button style={styles.permissionBtn} onClick={startCamera}>
                        Enable Camera
                    </button>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div style={styles.loading}>
                    <div style={styles.loadingSpinner}></div>
                    <p style={styles.loadingText}>
                        {loadingError || 'Loading Hand Tracking Model...'}
                    </p>
                </div>
            )}

            {/* Control Panel */}
            <div style={styles.controlPanel}>
                <h1 style={styles.panelTitle}>✋ Gesture Draw</h1>

                {/* Mode Display */}
                <div style={styles.section}>
                    <div style={styles.modeDisplay}>
                        <div style={styles.modeLabel}>CURRENT MODE</div>
                        <div style={{ ...styles.modeValue, ...getModeClass() }}>
                            {currentMode}
                        </div>
                    </div>
                </div>

                {/* Color Palette */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>🎨 Colors</div>
                    <div style={styles.colorPalette}>
                        {colors.map((color) => (
                            <button
                                key={color}
                                style={{
                                    ...styles.colorBtn,
                                    backgroundColor: color,
                                    ...(currentColor === color ? styles.colorBtnActive : {})
                                }}
                                onClick={() => setCurrentColor(color)}
                            />
                        ))}
                    </div>
                </div>

                {/* Brush Size */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>🖌️ Brush Size</div>
                    <div style={styles.brushPreview}>
                        <div
                            style={{
                                ...styles.brushCircle,
                                width: brushSize,
                                height: brushSize,
                                backgroundColor: currentColor
                            }}
                        />
                        <span style={styles.brushSizeLabel}>{brushSize} px</span>
                    </div>
                    <div style={styles.sizeControls}>
                        <button
                            style={styles.sizeBtn}
                            onClick={() => setBrushSize(Math.max(5, brushSize - 3))}
                        >
                            −
                        </button>
                        <button
                            style={styles.sizeBtn}
                            onClick={() => setBrushSize(Math.min(60, brushSize + 3))}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Gestures */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>🤚 Gestures</div>
                    <div style={styles.gestureList}>
                        {[
                            { icon: '☝️', text: 'One Finger', action: 'DRAW' },
                            { icon: '✌️', text: 'Two Fingers', action: 'ERASE' },
                            { icon: '🖐️', text: 'Open Hand', action: 'CLEAR (hold)' },
                            { icon: '✊', text: 'Fist', action: 'PAUSE' }
                        ].map((gesture) => (
                            <div key={gesture.action} style={styles.gestureItem}>
                                <span style={styles.gestureIcon}>{gesture.icon}</span>
                                <div>
                                    <div style={styles.gestureText}>{gesture.text}</div>
                                    <div style={styles.gestureAction}>{gesture.action}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>⚡ Actions</div>
                    <div style={styles.actionButtons}>
                        <button style={styles.clearBtn} onClick={clearCanvas}>
                            🗑️ Clear Canvas
                        </button>
                        <button style={styles.saveBtn} onClick={saveDrawing}>
                            💾 Save Drawing
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas Area */}
            <div style={styles.canvasArea} ref={containerRef}>
                <video
                    ref={videoRef}
                    style={styles.videoElement}
                    autoPlay
                    playsInline
                />
                <canvas ref={drawingCanvasRef} style={styles.drawingCanvas} />
                <canvas ref={overlayCanvasRef} style={styles.overlayCanvas} />

                {/* Status Bar */}
                <div style={styles.statusBar}>
                    <div style={styles.statusLeft}>
                        <div
                            style={{
                                ...styles.statusIndicator,
                                ...(isHandDetected ? styles.statusIndicatorActive : {})
                            }}
                        />
                        <span style={styles.statusText}>
                            {isHandDetected ? 'Hand detected' : 'No hand detected'}
                        </span>
                    </div>
                    <span style={styles.coordinates}>
                        {isHandDetected
                            ? `X: ${coordinates.x} Y: ${coordinates.y}`
                            : 'X: --- Y: ---'}
                    </span>
                </div>

                {/* Clear Progress */}
                {currentMode === 'CLEAR' && clearProgress > 0 && (
                    <div style={styles.clearProgressContainer}>
                        <div style={styles.clearText}>✋ Hold to Clear...</div>
                        <div style={styles.progressBar}>
                            <div
                                style={{
                                    ...styles.progressFill,
                                    width: `${clearProgress}%`
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Cursor Indicator */}
                {cursorPosition.visible && (
                    <div
                        style={{
                            ...styles.cursorIndicator,
                            left: cursorPosition.x,
                            top: cursorPosition.y,
                            width: cursorPosition.size * 2,
                            height: cursorPosition.size * 2,
                            borderColor: cursorPosition.isEraser ? '#fff' : cursorPosition.color,
                            background: cursorPosition.isEraser ? 'rgba(255,255,255,0.1)' : 'transparent'
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        overflow: 'hidden'
    },
    permissionPrompt: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001
    },
    permissionIcon: {
        fontSize: '4rem',
        marginBottom: 20
    },
    permissionTitle: {
        color: '#fff',
        fontSize: '1.5rem',
        marginBottom: 10
    },
    permissionDesc: {
        color: '#888',
        textAlign: 'center',
        maxWidth: 400,
        marginBottom: 25
    },
    permissionBtn: {
        padding: '15px 40px',
        background: 'linear-gradient(135deg, #64ffda, #4ecdc4)',
        border: 'none',
        borderRadius: 10,
        color: '#1a1a2e',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    loading: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    loadingSpinner: {
        width: 50,
        height: 50,
        border: '4px solid rgba(100, 255, 218, 0.2)',
        borderTopColor: '#64ffda',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        color: '#fff',
        marginTop: 20,
        fontSize: '1.1rem'
    },
    controlPanel: {
        width: 280,
        background: 'rgba(20, 20, 35, 0.95)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        borderRight: '2px solid #3a3a5c',
        overflowY: 'auto'
    },
    panelTitle: {
        color: '#fff',
        fontSize: '1.4rem',
        textAlign: 'center',
        paddingBottom: 10,
        borderBottom: '1px solid #3a3a5c',
        margin: 0
    },
    section: {
        background: 'rgba(40, 40, 60, 0.5)',
        borderRadius: 12,
        padding: 15
    },
    sectionTitle: {
        color: '#a0a0c0',
        fontSize: '0.85rem',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    modeDisplay: {
        textAlign: 'center',
        padding: 15,
        borderRadius: 10,
        background: 'rgba(60, 60, 80, 0.5)'
    },
    modeLabel: {
        color: '#888',
        fontSize: '0.8rem',
        marginBottom: 5
    },
    modeValue: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#888'
    },
    modeDraw: {
        color: '#64ffda'
    },
    modeErase: {
        color: '#ff6b9d'
    },
    modeClear: {
        color: '#ffd93d'
    },
    modeNone: {
        color: '#888'
    },
    colorPalette: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8
    },
    colorBtn: {
        width: '100%',
        aspectRatio: '1',
        borderWidth: 3,
        borderStyle: 'solid',
        borderColor: 'transparent',
        borderRadius: 8,
        cursor: 'pointer'
    },
    colorBtnActive: {
        borderColor: '#fff',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
    },
    brushPreview: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
        marginTop: 10
    },
    brushCircle: {
        borderRadius: '50%',
        transition: 'all 0.2s'
    },
    brushSizeLabel: {
        color: '#fff',
        fontSize: '1rem'
    },
    sizeControls: {
        display: 'flex',
        gap: 10,
        marginTop: 10
    },
    sizeBtn: {
        flex: 1,
        padding: 10,
        border: 'none',
        borderRadius: 8,
        background: '#3a3a5c',
        color: '#fff',
        fontSize: '1.2rem',
        cursor: 'pointer'
    },
    gestureList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    },
    gestureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 8,
        background: 'rgba(60, 60, 80, 0.3)',
        borderRadius: 6
    },
    gestureIcon: {
        fontSize: '1.3rem',
        width: 35,
        textAlign: 'center'
    },
    gestureText: {
        color: '#a0a0c0',
        fontSize: '0.85rem'
    },
    gestureAction: {
        color: '#64ffda',
        fontWeight: 'bold'
    },
    actionButtons: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
    },
    clearBtn: {
        padding: 12,
        border: 'none',
        borderRadius: 8,
        fontSize: '0.95rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
        color: '#fff'
    },
    saveBtn: {
        padding: 12,
        border: 'none',
        borderRadius: 8,
        fontSize: '0.95rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
        color: '#fff'
    },
    canvasArea: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
    },
    videoElement: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)',
        opacity: 0.4
    },
    drawingCanvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: 'crosshair'
    },
    overlayCanvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
    },
    statusBar: {
        position: 'absolute',
        top: 15,
        left: 15,
        right: 15,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        background: 'rgba(20, 20, 35, 0.85)',
        borderRadius: 12,
        backdropFilter: 'blur(10px)'
    },
    statusLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: '#ff6b6b'
    },
    statusIndicatorActive: {
        background: '#64ffda',
        boxShadow: '0 0 10px #64ffda'
    },
    statusText: {
        color: '#fff',
        fontSize: '0.9rem'
    },
    coordinates: {
        color: '#888',
        fontSize: '0.85rem',
        fontFamily: 'monospace'
    },
    clearProgressContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
    },
    clearText: {
        color: '#ffd93d',
        fontSize: '1.5rem',
        marginBottom: 15
    },
    progressBar: {
        width: 250,
        height: 8,
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #ffd93d, #ff6b6b)',
        transition: 'width 0.1s'
    },
    cursorIndicator: {
        position: 'absolute',
        pointerEvents: 'none',
        borderRadius: '50%',
        borderWidth: 3,
        borderStyle: 'solid',
        borderColor: '#fff',
        transform: 'translate(-50%, -50%)'
    }
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