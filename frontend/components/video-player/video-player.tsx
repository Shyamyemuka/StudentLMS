"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import BookmarkModal from "./bookmark-modal";
import FocusCompanion from "./focus-companion";

interface Bookmark {
  id: number;
  timestamp_sec: number;
  note: string;
  created_at: string;
}

interface VideoPlayerProps {
  resourceId: number;
  subjectId?: number;
  videoUrl: string;
  title: string;
  initialBookmarks: Bookmark[];
}

type VideoSource = "youtube" | "vimeo" | "drive" | "direct";

export default function VideoPlayer({
  resourceId,
  subjectId,
  videoUrl,
  title,
  initialBookmarks,
}: VideoPlayerProps) {
  const [resolvedSubjectId, setResolvedSubjectId] = useState<number>(subjectId || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showEmbedNote, setShowEmbedNote] = useState(true);
  const [showEmbedBookmark, setShowEmbedBookmark] = useState(false);
  const [embedTimestamp, setEmbedTimestamp] = useState("");
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [videoSource, setVideoSource] = useState<VideoSource>("direct");
  const [embedUrl, setEmbedUrl] = useState("");
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const vimeoPlayerRef = useRef<any>(null);

  useEffect(() => {
    if (!subjectId && typeof window !== "undefined") {
      const parsedId = Number(window.location.pathname.split("/")[2]);
      if (!isNaN(parsedId)) {
        setResolvedSubjectId(parsedId);
      }
    }
  }, [subjectId]);

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimer = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Only hide controls if video is playing
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds
    }
  };

  // Show controls when video is paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      resetControlsTimer();
    }
  }, [isPlaying]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Check for existing PiP video on mount
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__pipVideo) {
      const existingPipVideo = (window as any).__pipVideo;
      const existingResourceId = (window as any).__pipResourceId;

      // If there's a PiP video for the same resource, restore it
      if (
        existingResourceId === resourceId &&
        document.pictureInPictureElement === existingPipVideo
      ) {
        setIsPiP(true);
        // Restore the video reference
        if (videoRef.current && existingPipVideo.src) {
          videoRef.current.src = existingPipVideo.src;
          videoRef.current.currentTime = existingPipVideo.currentTime;
          if (!existingPipVideo.paused) {
            videoRef.current.play();
          }
        }
      }
    }
  }, [resourceId]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (videoSource === "youtube" && typeof window !== "undefined") {
      // Load YouTube IFrame API
      if (!(window as any).YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = () => {
          if (iframeRef.current) {
            youtubePlayerRef.current = new (window as any).YT.Player(
              iframeRef.current,
              {
                events: {
                  onReady: () => {
                    console.log("YouTube player ready");
                  },
                },
              },
            );
          }
        };
      } else if (iframeRef.current && (window as any).YT?.Player) {
        youtubePlayerRef.current = new (window as any).YT.Player(
          iframeRef.current,
          {
            events: {
              onReady: () => {
                console.log("YouTube player ready");
              },
            },
          },
        );
      }
    }
  }, [videoSource, embedUrl]);

  // Load Vimeo Player API
  useEffect(() => {
    if (videoSource === "vimeo" && typeof window !== "undefined") {
      // Load Vimeo Player API
      if (!(window as any).Vimeo) {
        const script = document.createElement("script");
        script.src = "https://player.vimeo.com/api/player.js";
        script.onload = () => {
          if (iframeRef.current) {
            vimeoPlayerRef.current = new (window as any).Vimeo.Player(
              iframeRef.current,
            );
          }
        };
        document.head.appendChild(script);
      } else if (iframeRef.current) {
        vimeoPlayerRef.current = new (window as any).Vimeo.Player(
          iframeRef.current,
        );
      }
    }
  }, [videoSource, embedUrl]);

  // Detect video source type
  useEffect(() => {
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      setVideoSource("youtube");
      const videoId = extractYouTubeId(videoUrl);
      setEmbedUrl(
        `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`,
      );
    } else if (videoUrl.includes("vimeo.com")) {
      setVideoSource("vimeo");
      const videoId = extractVimeoId(videoUrl);
      setEmbedUrl(`https://player.vimeo.com/video/${videoId}`);
    } else if (videoUrl.includes("drive.google.com")) {
      setVideoSource("drive");
      const fileId = extractDriveId(videoUrl);
      setEmbedUrl(`https://drive.google.com/file/d/${fileId}/preview`);
    } else if (videoUrl.includes("dropbox.com")) {
      setVideoSource("direct");
      // Convert Dropbox sharing link to direct download link
      const directUrl = convertDropboxUrl(videoUrl);
      setEmbedUrl(directUrl);
    } else {
      setVideoSource("direct");
      setEmbedUrl(videoUrl);
    }
  }, [videoUrl]);

  // Extract YouTube video ID
  const extractYouTubeId = (url: string): string => {
    const regex =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  // Extract Vimeo video ID
  const extractVimeoId = (url: string): string => {
    const regex = /vimeo\.com\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  // Extract Google Drive file ID
  const extractDriveId = (url: string): string => {
    const regex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  // Convert Dropbox sharing URL to direct download URL
  const convertDropboxUrl = (url: string): string => {
    // Replace www.dropbox.com with dl.dropboxusercontent.com and ensure raw=1
    if (url.includes("www.dropbox.com")) {
      // Remove any existing dl parameter and add dl=1&raw=1
      let directUrl = url.replace(
        "www.dropbox.com",
        "dl.dropboxusercontent.com",
      );
      directUrl = directUrl.replace(/\?dl=0/g, "");
      directUrl = directUrl.replace(/\?dl=1/g, "");
      // If there are existing query parameters, add to them, otherwise start new
      if (directUrl.includes("?")) {
        directUrl = directUrl.replace("?", "?raw=1&");
      } else {
        directUrl = directUrl + "?raw=1";
      }
      return directUrl;
    }
    // If it's already a direct link, ensure it has raw=1
    if (!url.includes("raw=1")) {
      return url.includes("?") ? url + "&raw=1" : url + "?raw=1";
    }
    return url;
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Play/Pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Error playing video:", error);
              toast.error("Failed to play video");
            });
        }
      }
    }
  };

  // Seek to position
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      if (vol > 0) setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + seconds),
      );
    }
  };

  // Playback rate change
  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Toggle Picture-in-Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
        toast.info("Picture-in-Picture closed");
      } else {
        const video = videoRef.current;

        // Clone the video element to keep it in the DOM after component unmounts
        const clone = video.cloneNode(true) as HTMLVideoElement;
        clone.id = `pip-video-${resourceId}`;
        clone.style.display = "none"; // Hide it since it's in PiP
        clone.currentTime = video.currentTime;
        clone.volume = video.volume;
        clone.muted = video.muted;
        clone.playbackRate = video.playbackRate;

        // Add to body to persist across navigation
        document.body.appendChild(clone);

        // Copy the playing state
        if (!video.paused) {
          await clone.play();
        }

        // Enter PiP on the cloned video
        await clone.requestPictureInPicture();
        setIsPiP(true);

        // Store reference globally
        if (typeof window !== "undefined") {
          (window as any).__pipVideo = clone;
          (window as any).__pipResourceId = resourceId;
        }

        // Listen for when PiP is closed to clean up the cloned video
        clone.addEventListener(
          "leavepictureinpicture",
          () => {
            clone.pause();
            clone.src = "";
            clone.remove();
            if (typeof window !== "undefined") {
              delete (window as any).__pipVideo;
              delete (window as any).__pipResourceId;
            }
          },
          { once: true },
        );

        toast.success(
          "Picture-in-Picture enabled! Video will continue playing even if you navigate away.",
          {
            duration: 4000,
          },
        );
      }
    } catch (error) {
      console.error("PiP error:", error);
      toast.error("Picture-in-Picture not supported");
    }
  };

  // Toggle Theater Mode
  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
  };

  // Create bookmark
  const handleCreateBookmark = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowBookmarkModal(true);
  };

  // Seek to bookmark
  const seekToBookmark = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      console.log("Video loaded, duration:", video.duration);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleCanPlay = () => {
      console.log("Video can play");
    };
    const handleError = (e: Event) => {
      console.error("Video error:", e);
      const videoError = video.error;
      if (videoError) {
        console.error("Video error code:", videoError.code);
        console.error("Video error message:", videoError.message);
        toast.error(
          `Video error: ${videoError.message || "Failed to load video"}`,
        );
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [embedUrl]);

  // Listen for bookmark seek events
  useEffect(() => {
    const handleSeekFromBookmark = (e: CustomEvent) => {
      seekToBookmark(e.detail.timestamp);
    };

    window.addEventListener(
      "seekToBookmark",
      handleSeekFromBookmark as EventListener,
    );

    return () => {
      window.removeEventListener(
        "seekToBookmark",
        handleSeekFromBookmark as EventListener,
      );
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "?":
          e.preventDefault();
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
          break;
        case "escape":
          if (showKeyboardShortcuts) {
            e.preventDefault();
            setShowKeyboardShortcuts(false);
          }
          break;
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          skipTime(-10);
          break;
        case "arrowright":
          e.preventDefault();
          skipTime(10);
          break;
        case "j":
          e.preventDefault();
          skipTime(-10);
          break;
        case "l":
          e.preventDefault();
          skipTime(10);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "t":
          e.preventDefault();
          toggleTheaterMode();
          break;
        case "i":
          e.preventDefault();
          togglePiP();
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const newVolume = Math.min(1, volume + 0.1);
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            if (newVolume > 0) setIsMuted(false);
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const newVolume = Math.max(0, volume - 0.1);
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
          }
          break;
        case ",":
          if (videoRef.current && !isPlaying) {
            e.preventDefault();
            videoRef.current.currentTime = Math.max(
              0,
              videoRef.current.currentTime - 1 / 30,
            );
          }
          break;
        case ".":
          if (videoRef.current && !isPlaying) {
            e.preventDefault();
            videoRef.current.currentTime = Math.min(
              duration,
              videoRef.current.currentTime + 1 / 30,
            );
          }
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          if (videoRef.current && duration) {
            e.preventDefault();
            const percent = parseInt(e.key) / 10;
            videoRef.current.currentTime = duration * percent;
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, volume, duration, showKeyboardShortcuts]);

  // Listen for PiP events and check for existing PiP on mount
  useEffect(() => {
    // Check if there's an existing PiP video when component mounts
    if (typeof window !== "undefined" && (window as any).__pipVideo) {
      const existingPipVideo = (window as any).__pipVideo as HTMLVideoElement;
      const existingResourceId = (window as any).__pipResourceId;

      // If it's for the same resource and still in PiP, update state
      if (
        existingResourceId === resourceId &&
        document.pictureInPictureElement === existingPipVideo
      ) {
        setIsPiP(true);

        // Sync the current video with PiP video state
        if (videoRef.current && existingPipVideo.src) {
          videoRef.current.currentTime = existingPipVideo.currentTime;
          videoRef.current.volume = existingPipVideo.volume;
          videoRef.current.muted = existingPipVideo.muted;
          videoRef.current.playbackRate = existingPipVideo.playbackRate;
        }
      }
    }

    const video = videoRef.current;
    if (!video) return;

    const handleLeavePiP = () => {
      setIsPiP(false);
    };

    video.addEventListener("leavepictureinpicture", handleLeavePiP);

    return () => {
      video.removeEventListener("leavepictureinpicture", handleLeavePiP);
    };
  }, [resourceId]);

  // Get current time from embedded video
  const getCurrentEmbedTime = async (): Promise<number | null> => {
    try {
      if (videoSource === "youtube" && youtubePlayerRef.current) {
        return youtubePlayerRef.current.getCurrentTime();
      } else if (videoSource === "vimeo" && vimeoPlayerRef.current) {
        return await vimeoPlayerRef.current.getCurrentTime();
      }
    } catch (error) {
      console.error("Error getting embed time:", error);
    }
    return null;
  };

  // Handle embedded video bookmark
  const handleEmbedBookmark = async () => {
    let seconds = 0;

    // Try to get current time automatically
    const autoTime = await getCurrentEmbedTime();

    if (autoTime !== null) {
      seconds = Math.floor(autoTime);
    } else if (embedTimestamp) {
      // Fallback to manual entry if auto-detection fails
      if (embedTimestamp.includes(":")) {
        // Format: MM:SS or HH:MM:SS
        const parts = embedTimestamp.split(":").map(Number);
        if (parts.length === 2) {
          seconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      } else {
        // Format: just seconds
        seconds = parseInt(embedTimestamp);
      }

      if (isNaN(seconds) || seconds < 0) {
        toast.error("Invalid timestamp format");
        return;
      }
    } else {
      toast.error(
        "Could not detect current time. Please enter timestamp manually.",
      );
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please login to create bookmarks");
      return;
    }

    const { error } = await supabase.from("video_bookmarks").insert({
      resource_id: resourceId,
      user_id: user.id,
      timestamp_sec: seconds,
      note: bookmarkNote || `Bookmark at ${formatTime(seconds)}`,
    });

    if (error) {
      toast.error("Failed to create bookmark");
    } else {
      toast.success("Bookmark created!");
      setShowEmbedBookmark(false);
      setEmbedTimestamp("");
      setBookmarkNote("");

      // Notify BookmarkList to refresh
      window.dispatchEvent(
        new CustomEvent("bookmarkCreated", {
          detail: { resourceId },
        }),
      );
    }
  };

  // Render embedded video (YouTube, Vimeo, Drive) - Use their native controls
  if (videoSource !== "direct") {
    return (
      <>
        <div className="rounded-xl overflow-hidden">
        {showEmbedNote && (
          <div className="bg-primary text-primary-foreground border-2 border-border shadow-hard-sm px-4 py-2.5 text-sm font-bold flex items-center justify-between">
            <span>
              ⚠️ Note: For full custom controls, please use direct video links
              (.mp4, .webm). Embedded videos (YouTube, Drive, Vimeo) use their
              native controls.
            </span>
            <button
              onClick={() => setShowEmbedNote(false)}
              className="ml-4 p-1 hover:bg-black/10 rounded transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Close note">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div ref={containerRef} className="relative w-full bg-black shadow-2xl">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Bookmark Controls for Embedded Videos */}
        <div className="bg-card border-2 border-border border-t-0 p-4 shadow-hard-md rounded-b-xl">
          {!showEmbedBookmark ? (
            <button
              onClick={() => setShowEmbedBookmark(true)}
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-lg font-bold border-2 border-border shadow-hard-sm hover:scale-102 active:scale-98 transition-all cursor-pointer">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              </svg>
              Create Bookmark at Current Time
            </button>
          ) : (
            <div className="space-y-4">
              {/* Timestamp Info/Input */}
              {videoSource === "drive" ? (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Timestamp
                  </label>
                  <input
                    type="text"
                    value={embedTimestamp}
                    onChange={(e) => setEmbedTimestamp(e.target.value)}
                    placeholder="MM:SS or seconds (e.g., 1:30 or 90)"
                    className="w-full px-4 py-2 bg-card border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none font-bold"
                  />
                  <p className="text-xs text-muted-foreground mt-1 font-bold">
                    Google Drive doesn't support auto-detection. Please enter
                    the timestamp manually.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted/40 p-3 rounded-xl border-2 border-border font-bold">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span>
                    The current timestamp will be captured automatically when
                    you save
                  </span>
                </div>
              )}

              {/* Note Input */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Add a Note (Optional)
                </label>
                <textarea
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  placeholder="Enter a note for this bookmark..."
                  rows={3}
                  className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none font-bold resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleEmbedBookmark}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer">
                  Save Bookmark
                </button>
                <button
                  onClick={() => {
                    setShowEmbedBookmark(false);
                    setEmbedTimestamp("");
                    setBookmarkNote("");
                  }}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="px-6 py-3 border-2 border-border bg-muted/40 text-muted-foreground font-bold hover:text-foreground transition-all cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* AI Focus Companion */}
      <FocusCompanion
        resourceId={resourceId}
        subjectId={resolvedSubjectId}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onPauseVideo={() => {
          setIsPlaying(false);
        }}
        onPlayVideo={() => {
          setIsPlaying(true);
        }}
      />
    </>
  );
  }

  // Render HTML5 video player (direct links)
  return (
    <>
      <div
        ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
      className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isTheaterMode ? "max-w-none mx-0" : "max-w-7xl mx-auto"
      } ${!showControls && isPlaying ? "cursor-none" : "cursor-default"}`}>
      {embedUrl ? (
        <video
          key={embedUrl}
          ref={videoRef}
          src={embedUrl}
          className="w-full aspect-video"
          onClick={togglePlay}
          playsInline
          preload="metadata">
          <track kind="captions" />
        </video>
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-[#0B0D10]">
          <div className="text-[#707070]">Loading video...</div>
        </div>
      )}

      {/* Custom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => {
          setShowControls(true);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
        }}
        suppressHydrationWarning>
        {/* Single Row: All Controls Including Progress Bar */}
        <div className="flex items-center gap-3 px-4 py-3 text-white">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
            suppressHydrationWarning>
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Skip Backward 10s */}
          <button
            onClick={() => skipTime(-10)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Rewind 10 seconds"
            suppressHydrationWarning>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.05-.25-.05-.18.02-.25.05-.14.09-.19.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.02.25-.05.14-.09.19-.17.09-.19.11-.32.04-.29.04-.48v-.97z" />
            </svg>
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => skipTime(10)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Forward 10 seconds"
            suppressHydrationWarning>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8zm-1.1 11h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.05-.25-.05-.18.02-.25.05-.14.09-.19.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.02.25-.05.14-.09.19-.17.09-.19.11-.32.04-.29.04-.48v-.97z" />
            </svg>
          </button>

          {/* Volume Control */}
          <div
            className="relative flex items-center gap-2"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}>
            <button
              onClick={toggleMute}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
              suppressHydrationWarning>
              {isMuted || volume === 0 ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : volume < 0.5 ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>

            {/* Volume Slider */}
            {showVolumeSlider && (
              <div className="absolute left-full ml-2 bg-black/95 rounded-lg px-3 py-2 backdrop-blur-sm">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                           [&::-webkit-slider-thumb]:appearance-none 
                           [&::-webkit-slider-thumb]:w-3 
                           [&::-webkit-slider-thumb]:h-3 
                           [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-[#D4AF37] 
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-moz-range-thumb]:w-3 
                           [&::-moz-range-thumb]:h-3 
                           [&::-moz-range-thumb]:rounded-full 
                           [&::-moz-range-thumb]:bg-[#D4AF37] 
                           [&::-moz-range-thumb]:border-0 
                           [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Time Display */}
          <span className="text-sm font-medium tabular-nums flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Progress Bar (takes up remaining space) */}
          <div className="flex-1 min-w-0">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                       [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:w-3 
                       [&::-webkit-slider-thumb]:h-3 
                       [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-[#D4AF37] 
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-3 
                       [&::-moz-range-thumb]:h-3 
                       [&::-moz-range-thumb]:rounded-full 
                       [&::-moz-range-thumb]:bg-[#D4AF37] 
                       [&::-moz-range-thumb]:border-0 
                       [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${
                  (currentTime / (duration || 1)) * 100
                }%, #374151 ${
                  (currentTime / (duration || 1)) * 100
                }%, #374151 100%)`,
              }}
            />
          </div>

          {/* Playback Speed */}
          <button
            onClick={() => {
              const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
              const currentIndex = speeds.indexOf(playbackRate);
              const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
              handlePlaybackRateChange(nextSpeed);
            }}
            className="px-3 h-9 flex-shrink-0 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium min-w-[45px]"
            suppressHydrationWarning>
            {playbackRate}x
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleCreateBookmark}
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            className="px-4 h-9 flex-shrink-0 flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold hover:scale-105 active:scale-95 transition-all border-2 border-border shadow-hard-sm cursor-pointer"
            suppressHydrationWarning>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
            Bookmark
          </button>

          {/* Picture-in-Picture */}
          <button
            onClick={togglePiP}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Picture-in-Picture"
            suppressHydrationWarning>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {isPiP ? (
                <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z" />
              ) : (
                <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" />
              )}
            </svg>
          </button>

          {/* Theater Mode */}
          <button
            onClick={toggleTheaterMode}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Theater Mode"
            suppressHydrationWarning>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {isTheaterMode ? (
                <path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
              ) : (
                <path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z" />
              )}
            </svg>
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Keyboard Shortcuts"
            suppressHydrationWarning>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
            </svg>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Fullscreen"
            suppressHydrationWarning>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {isFullscreen ? (
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              ) : (
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Overlay */}
      {showKeyboardShortcuts && (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowKeyboardShortcuts(false)}>
          <div 
            style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
            className="bg-card border-2 border-border p-8 max-w-2xl w-full mx-4 shadow-hard-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-primary font-heading">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="text-muted-foreground hover:text-foreground font-bold p-1 cursor-pointer transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Play/Pause</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    Space
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Rewind 10s</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    J / ←
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Forward 10s</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    L / →
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Volume Up</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    ↑
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Volume Down</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    ↓
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Mute/Unmute</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    M
                  </kbd>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Fullscreen</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    F
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Theater Mode</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    T
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Picture-in-Picture</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    I
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Jump to 0-90%</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    0-9
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Frame by Frame</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    , / .
                  </kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Show Shortcuts</span>
                  <kbd className="px-2 py-1 bg-muted border border-border rounded text-primary font-mono text-xs">
                    ?
                  </kbd>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center text-muted-foreground text-xs font-bold">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-primary font-mono text-xs">
                ?
              </kbd>{" "}
              or{" "}
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-primary font-mono text-xs">
                Esc
              </kbd>{" "}
              to close
            </div>
          </div>
        </div>
      )}

      {/* Bookmark Form (Inline below controls when active) */}
      <BookmarkModal
        isOpen={showBookmarkModal}
        onClose={() => setShowBookmarkModal(false)}
        resourceId={resourceId}
        currentTime={currentTime}
      />
    </div>

    {/* AI Focus Companion */}
    <FocusCompanion
      resourceId={resourceId}
      subjectId={resolvedSubjectId}
      currentTime={currentTime}
      isPlaying={isPlaying}
      onPauseVideo={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }}
      onPlayVideo={() => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }}
    />
  </>
);
}
