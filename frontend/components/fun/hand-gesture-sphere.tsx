"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Landmark {
    x: number;
    y: number;
    z: number;
}

export default function HandGestureSphere() {
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const handsRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const animationRef = useRef<number | null>(null);
    const sceneRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [isHandDetected, setIsHandDetected] = useState(false);
    const [controlMode, setControlMode] = useState<'WAITING' | 'ROTATE' | 'ZOOM'>('WAITING');
    const [sphereColor, setSphereColor] = useState('#00ffaa');
    const [autoRotate, setAutoRotate] = useState(true);
    const [rotationSpeed, setRotationSpeed] = useState(1);
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);

    // Animation state refs
    const rotationXRef = useRef(0);
    const rotationYRef = useRef(0);
    const targetRotationXRef = useRef(0);
    const targetRotationYRef = useRef(0);
    const scaleRef = useRef(1);
    const targetScaleRef = useRef(1);
    const autoRotateRef = useRef(true);
    const isRunningRef = useRef(false);

    const colors = [
        '#00ffaa', '#64ffda', '#00ffff', '#ff6b9d',
        '#a78bfa', '#fbbf24', '#34d399', '#ffffff'
    ];

    // Initialize Three.js scene
    const initializeScene = useCallback(async () => {
        if (!canvasRef.current) return;

        const THREE = await import("three");
        const canvas = canvasRef.current;

        // Get container dimensions
        const container = containerRef.current;
        const width = container?.clientWidth || 800;
        const height = container?.clientHeight || 600;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
        });

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        scene.background = new THREE.Color(0x0a0a15);

        // Create particle sphere
        const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
        const particleMaterial = new THREE.PointsMaterial({
            color: parseInt(sphereColor.replace('#', ''), 16),
            size: 0.06,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
        });
        const particleSphere = new THREE.Points(sphereGeometry, particleMaterial);
        scene.add(particleSphere);

        // Wireframe sphere
        const wireframeGeometry = new THREE.SphereGeometry(2.05, 32, 32);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
        });
        const wireframeSphere = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        scene.add(wireframeSphere);

        // Inner glow sphere
        const innerGeometry = new THREE.SphereGeometry(1.8, 32, 32);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
        });
        const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
        scene.add(innerSphere);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x00ffaa, 1, 100);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00aaff, 0.5, 100);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        camera.position.z = 5;

        sceneRef.current = {
            scene,
            camera,
            renderer,
            particleSphere,
            wireframeSphere,
            innerSphere,
            pointLight1,
            pointLight2,
            particleMaterial,
        };
        rendererRef.current = renderer;

        return { scene, camera, renderer, particleSphere, wireframeSphere, innerSphere, pointLight1 };
    }, [sphereColor]);

    // Animation loop
    const animate = useCallback(() => {
        if (!isRunningRef.current || !sceneRef.current) {
            return;
        }

        animationRef.current = requestAnimationFrame(animate);

        const { scene, camera, renderer, particleSphere, wireframeSphere, innerSphere, pointLight1 } = sceneRef.current;

        // Smooth interpolation
        rotationXRef.current += (targetRotationXRef.current - rotationXRef.current) * 0.1;
        rotationYRef.current += (targetRotationYRef.current - rotationYRef.current) * 0.1;
        scaleRef.current += (targetScaleRef.current - scaleRef.current) * 0.1;

        if (autoRotateRef.current) {
            particleSphere.rotation.y += 0.008 * rotationSpeed;
            particleSphere.rotation.x += 0.004 * rotationSpeed;
            wireframeSphere.rotation.y += 0.006 * rotationSpeed;
            wireframeSphere.rotation.x += 0.003 * rotationSpeed;
        } else {
            particleSphere.rotation.x = rotationXRef.current;
            particleSphere.rotation.y = rotationYRef.current;
            wireframeSphere.rotation.x = rotationXRef.current * 0.8;
            wireframeSphere.rotation.y = rotationYRef.current * 0.8;
        }

        const scale = scaleRef.current;
        particleSphere.scale.set(scale, scale, scale);
        wireframeSphere.scale.set(scale * 1.02, scale * 1.02, scale * 1.02);
        innerSphere.scale.set(scale * 0.95, scale * 0.95, scale * 0.95);

        // Animate lights
        const time = Date.now() * 0.001;
        pointLight1.position.x = Math.sin(time) * 5;
        pointLight1.position.y = Math.cos(time) * 5;

        renderer.render(scene, camera);
    }, [rotationSpeed]);

    // Update sphere color
    useEffect(() => {
        if (sceneRef.current?.particleMaterial) {
            sceneRef.current.particleMaterial.color.setHex(parseInt(sphereColor.replace('#', ''), 16));
        }
    }, [sphereColor]);

    // Start camera and hand tracking
    const startCamera = useCallback(async () => {
        setShowPermissionPrompt(false);
        setIsLoading(true);
        setLoadingError(null);
        isRunningRef.current = true;

        try {
            // Initialize Three.js scene
            await initializeScene();

            // Import MediaPipe
            const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
            const { Camera } = await import("@mediapipe/camera_utils");
            const { drawConnectors, drawLandmarks } = await import("@mediapipe/drawing_utils");

            // Initialize hands
            const hands = new Hands({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 0,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });

            hands.onResults((results: any) => {
                const overlayCanvas = overlayCanvasRef.current;
                if (!overlayCanvas) return;

                const ctx = overlayCanvas.getContext('2d');
                if (!ctx) return;

                ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                ctx.save();
                ctx.scale(-1, 1);
                ctx.translate(-overlayCanvas.width, 0);

                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    setIsHandDetected(true);
                    autoRotateRef.current = false;
                    setAutoRotate(false);

                    for (const landmarks of results.multiHandLandmarks) {
                        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                            color: "#00FF88",
                            lineWidth: 3,
                        });
                        drawLandmarks(ctx, landmarks, {
                            color: "#00FFFF",
                            fillColor: "#FF0000",
                            radius: 4,
                            lineWidth: 2,
                        });
                    }

                    const hand = results.multiHandLandmarks[0];
                    const indexTip = hand[8];
                    const thumbTip = hand[4];

                    // Update coordinates display
                    const x = Math.round((1 - indexTip.x) * overlayCanvas.width);
                    const y = Math.round(indexTip.y * overlayCanvas.height);
                    setCoordinates({ x, y });

                    // Control rotation
                    targetRotationYRef.current = (indexTip.x - 0.5) * Math.PI * 2;
                    targetRotationXRef.current = (indexTip.y - 0.5) * Math.PI * 2;

                    // Zoom based on pinch
                    const distance = Math.sqrt(
                        Math.pow(indexTip.x - thumbTip.x, 2) +
                        Math.pow(indexTip.y - thumbTip.y, 2)
                    );
                    targetScaleRef.current = 0.7 + distance * 2.5;
                    setZoomLevel(Math.round(targetScaleRef.current * 100) / 100);

                    // Determine control mode
                    if (distance < 0.08) {
                        setControlMode('ZOOM');
                    } else {
                        setControlMode('ROTATE');
                    }
                } else {
                    setIsHandDetected(false);
                    autoRotateRef.current = true;
                    setAutoRotate(true);
                    setControlMode('WAITING');
                }

                ctx.restore();
            });

            handsRef.current = hands;

            // Start camera
            if (videoRef.current) {
                const camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (handsRef.current && videoRef.current && isRunningRef.current) {
                            await handsRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480,
                });

                await camera.start();
                cameraRef.current = camera;
            }

            setIsLoading(false);
            animate();

        } catch (error: any) {
            console.error("Error starting:", error);
            setLoadingError(error.message || "Failed to initialize. Please refresh and try again.");
            setIsLoading(false);
        }
    }, [initializeScene, animate]);

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && overlayCanvasRef.current && canvasRef.current) {
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;

                overlayCanvasRef.current.width = 640;
                overlayCanvasRef.current.height = 480;

                if (sceneRef.current) {
                    sceneRef.current.camera.aspect = width / height;
                    sceneRef.current.camera.updateProjectionMatrix();
                    sceneRef.current.renderer.setSize(width, height);
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cleanup function to stop all resources
    const cleanupResources = useCallback(() => {
        console.log("Cleaning up hand gesture sphere resources...");
        isRunningRef.current = false;

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        if (cameraRef.current) {
            try {
                cameraRef.current.stop();
            } catch (e) {
                console.warn("Error stopping camera:", e);
            }
            cameraRef.current = null;
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
                track.stop();
                console.log("Stopped track:", track.kind);
            });
            videoRef.current.srcObject = null;
        }

        if (handsRef.current) {
            try {
                handsRef.current.close?.();
            } catch (e) {
                console.warn("Error closing hands:", e);
            }
            handsRef.current = null;
        }

        if (rendererRef.current) {
            try {
                rendererRef.current.dispose();
            } catch (e) {
                console.warn("Error disposing renderer:", e);
            }
            rendererRef.current = null;
        }
    }, []);

    // Cleanup on unmount and beforeunload
    useEffect(() => {
        // Add beforeunload listener to cleanup on page navigation
        const handleBeforeUnload = () => {
            cleanupResources();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            cleanupResources();
        };
    }, [cleanupResources]);

    const getModeStyle = () => {
        switch (controlMode) {
            case 'ROTATE': return { color: '#64ffda' };
            case 'ZOOM': return { color: '#fbbf24' };
            default: return { color: '#888' };
        }
    };

    return (
        <div style={styles.container}>
            {/* Permission Prompt */}
            {showPermissionPrompt && (
                <div style={styles.permissionPrompt}>
                    <div style={styles.permissionIcon}>🌐</div>
                    <h2 style={styles.permissionTitle}>Camera Access Required</h2>
                    <p style={styles.permissionDesc}>
                        Control a 3D sphere using hand gestures!
                        Move your finger to rotate, pinch to zoom.
                    </p>
                    <button style={styles.permissionBtn} onClick={startCamera}>
                        Start Experience
                    </button>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div style={styles.loading}>
                    <div style={styles.loadingSpinner}></div>
                    <p style={styles.loadingText}>
                        {loadingError || 'Loading 3D Engine & Hand Tracking...'}
                    </p>
                </div>
            )}

            {/* Control Panel */}
            <div style={styles.controlPanel}>
                <h1 style={styles.panelTitle}>🌐 3D Gesture Control</h1>

                {/* Mode Display */}
                <div style={styles.section}>
                    <div style={styles.modeDisplay}>
                        <div style={styles.modeLabel}>CONTROL MODE</div>
                        <div style={{ ...styles.modeValue, ...getModeStyle() }}>
                            {controlMode}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>📊 Stats</div>
                    <div style={styles.statsList}>
                        <div style={styles.statItem}>
                            <span style={styles.statLabel}>Zoom Level</span>
                            <span style={styles.statValue}>{zoomLevel}x</span>
                        </div>
                        <div style={styles.statItem}>
                            <span style={styles.statLabel}>Auto Rotate</span>
                            <span style={{ ...styles.statValue, color: autoRotate ? '#64ffda' : '#ff6b6b' }}>
                                {autoRotate ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Color Palette */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>🎨 Sphere Color</div>
                    <div style={styles.colorPalette}>
                        {colors.map((color) => (
                            <button
                                key={color}
                                style={{
                                    ...styles.colorBtn,
                                    backgroundColor: color,
                                    ...(sphereColor === color ? styles.colorBtnActive : {})
                                }}
                                onClick={() => setSphereColor(color)}
                            />
                        ))}
                    </div>
                </div>

                {/* Speed Control */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>⚡ Rotation Speed</div>
                    <div style={styles.speedControls}>
                        <button
                            style={styles.speedBtn}
                            onClick={() => setRotationSpeed(Math.max(0.2, rotationSpeed - 0.2))}
                        >
                            −
                        </button>
                        <span style={styles.speedValue}>{rotationSpeed.toFixed(1)}x</span>
                        <button
                            style={styles.speedBtn}
                            onClick={() => setRotationSpeed(Math.min(3, rotationSpeed + 0.2))}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Gestures Guide */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>🤚 Gestures</div>
                    <div style={styles.gestureList}>
                        {[
                            { icon: '☝️', text: 'Point finger', action: 'ROTATE' },
                            { icon: '🤏', text: 'Pinch', action: 'ZOOM' },
                            { icon: '✋', text: 'Remove hand', action: 'AUTO SPIN' },
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
            </div>

            {/* Canvas Area */}
            <div style={styles.canvasArea} ref={containerRef}>
                <video
                    ref={videoRef}
                    style={styles.videoElement}
                    autoPlay
                    playsInline
                />
                <canvas ref={canvasRef} style={styles.sphereCanvas} />
                <canvas ref={overlayCanvasRef} style={styles.overlayCanvas} width={640} height={480} />

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
                            {isHandDetected ? 'Hand detected' : 'Show your hand'}
                        </span>
                    </div>
                    <span style={styles.coordinates}>
                        {isHandDetected
                            ? `X: ${coordinates.x} Y: ${coordinates.y}`
                            : 'X: --- Y: ---'}
                    </span>
                </div>

                {/* Camera Preview */}
                <div style={styles.cameraPreview}>
                    <div style={styles.cameraLabel}>📷 Camera</div>
                </div>
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
        background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 50%, #0f3460 100%)',
        overflow: 'hidden'
    },
    permissionPrompt: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001
    },
    permissionIcon: {
        fontSize: '5rem',
        marginBottom: 20
    },
    permissionTitle: {
        color: '#fff',
        fontSize: '1.8rem',
        marginBottom: 10
    },
    permissionDesc: {
        color: '#888',
        textAlign: 'center',
        maxWidth: 400,
        marginBottom: 30,
        lineHeight: 1.6
    },
    permissionBtn: {
        padding: '18px 50px',
        background: 'linear-gradient(135deg, #00ffaa, #00ccff)',
        border: 'none',
        borderRadius: 12,
        color: '#0a0a15',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 0 30px rgba(0, 255, 170, 0.3)'
    },
    loading: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#0a0a15',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    loadingSpinner: {
        width: 60,
        height: 60,
        border: '4px solid rgba(0, 255, 170, 0.2)',
        borderTopColor: '#00ffaa',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        color: '#fff',
        marginTop: 25,
        fontSize: '1.2rem'
    },
    controlPanel: {
        width: 300,
        background: 'rgba(10, 10, 21, 0.95)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        borderRight: '2px solid rgba(0, 255, 170, 0.2)',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)'
    },
    panelTitle: {
        color: '#fff',
        fontSize: '1.5rem',
        textAlign: 'center',
        paddingBottom: 15,
        borderBottom: '1px solid rgba(0, 255, 170, 0.3)',
        margin: 0,
        background: 'linear-gradient(135deg, #00ffaa, #00ccff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    section: {
        background: 'rgba(30, 30, 50, 0.5)',
        borderRadius: 12,
        padding: 15,
        border: '1px solid rgba(0, 255, 170, 0.1)'
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
        background: 'rgba(0, 255, 170, 0.05)'
    },
    modeLabel: {
        color: '#666',
        fontSize: '0.75rem',
        marginBottom: 5,
        letterSpacing: 1
    },
    modeValue: {
        fontSize: '1.6rem',
        fontWeight: 'bold'
    },
    statsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
    },
    statItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8
    },
    statLabel: {
        color: '#888',
        fontSize: '0.9rem'
    },
    statValue: {
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 'bold'
    },
    colorPalette: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10
    },
    colorBtn: {
        width: '100%',
        aspectRatio: '1',
        borderWidth: 3,
        borderStyle: 'solid',
        borderColor: 'transparent',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    colorBtnActive: {
        borderColor: '#fff',
        boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)',
        transform: 'scale(1.1)'
    },
    speedControls: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15
    },
    speedBtn: {
        width: 45,
        height: 45,
        border: 'none',
        borderRadius: 10,
        background: 'linear-gradient(135deg, #3a3a5c, #2a2a4c)',
        color: '#fff',
        fontSize: '1.4rem',
        cursor: 'pointer',
        transition: 'transform 0.2s'
    },
    speedValue: {
        color: '#00ffaa',
        fontSize: '1.3rem',
        fontWeight: 'bold',
        minWidth: 60,
        textAlign: 'center'
    },
    gestureList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
    },
    gestureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8
    },
    gestureIcon: {
        fontSize: '1.5rem',
        width: 40,
        textAlign: 'center'
    },
    gestureText: {
        color: '#a0a0c0',
        fontSize: '0.85rem'
    },
    gestureAction: {
        color: '#00ffaa',
        fontWeight: 'bold',
        fontSize: '0.9rem'
    },
    canvasArea: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
    },
    videoElement: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 200,
        height: 150,
        objectFit: 'cover',
        transform: 'scaleX(-1)',
        borderRadius: 12,
        border: '2px solid rgba(0, 255, 170, 0.3)',
        zIndex: 10,
        opacity: 0.9
    },
    sphereCanvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    },
    overlayCanvas: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 200,
        height: 150,
        borderRadius: 12,
        pointerEvents: 'none',
        zIndex: 11
    },
    statusBar: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 25px',
        background: 'rgba(10, 10, 21, 0.9)',
        borderRadius: 15,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 255, 170, 0.2)'
    },
    statusLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },
    statusIndicator: {
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#ff6b6b'
    },
    statusIndicatorActive: {
        background: '#00ffaa',
        boxShadow: '0 0 15px #00ffaa'
    },
    statusText: {
        color: '#fff',
        fontSize: '1rem'
    },
    coordinates: {
        color: '#888',
        fontSize: '0.9rem',
        fontFamily: 'monospace'
    },
    cameraPreview: {
        position: 'absolute',
        bottom: 175,
        right: 20,
        padding: '6px 12px',
        background: 'rgba(10, 10, 21, 0.9)',
        borderRadius: 8,
        zIndex: 12
    },
    cameraLabel: {
        color: '#00ffaa',
        fontSize: '0.8rem',
        fontWeight: 'bold'
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
