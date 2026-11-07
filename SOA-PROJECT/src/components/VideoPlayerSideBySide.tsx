import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Maximize,
  Sliders,
  Eye,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  DetectedVehicle,
  IndianVehicleClass,
  ProcessingStats,
  CascadeRiskAssessment,
} from '../types/traffic';
import { getVehicleColor } from '../utils/colors';

interface VideoPlayerSideBySideProps {
  videoUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  annotatedCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  vehicles: DetectedVehicle[];
  riskAssessment: CascadeRiskAssessment | null;
  isAnalyzing: boolean;
  onToggleAnalysis: () => void;
  stats: ProcessingStats;
  onSeek: (time: number) => void;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  onStepFrame: (direction: 'prev' | 'next') => void;
  onRestart: () => void;
  engineMode: 'hybrid' | 'yolo-server' | 'opencv-fast';
  onChangeEngineMode: (mode: 'hybrid' | 'yolo-server' | 'opencv-fast') => void;
  isProcessingFrame: boolean;
}

export const VideoPlayerSideBySide: React.FC<VideoPlayerSideBySideProps> = ({
  videoUrl,
  videoRef,
  annotatedCanvasRef,
  vehicles,
  riskAssessment,
  isAnalyzing,
  onToggleAnalysis,
  stats,
  onSeek,
  currentTime,
  duration,
  playbackRate,
  onChangePlaybackRate,
  onStepFrame,
  onRestart,
  engineMode,
  onChangeEngineMode,
  isProcessingFrame,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showProximityLines, setShowProximityLines] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.30);

  // Sync isPlaying state with native video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  // Keep latest state in refs for synchronous 60FPS animation loop
  const vehiclesRef = useRef<DetectedVehicle[]>(vehicles);
  vehiclesRef.current = vehicles;

  const riskRef = useRef<CascadeRiskAssessment | null>(riskAssessment);
  riskRef.current = riskAssessment;

  const isAnalyzingRef = useRef<boolean>(isAnalyzing);
  isAnalyzingRef.current = isAnalyzing;

  const overlaysRef = useRef({
    showTrajectories,
    showBoundingBoxes,
    showVectors,
    showProximityLines,
    confidenceThreshold,
  });
  overlaysRef.current = {
    showTrajectories,
    showBoundingBoxes,
    showVectors,
    showProximityLines,
    confidenceThreshold,
  };

  const hasDrawnFrameRef = useRef<boolean>(false);

  useEffect(() => {
    hasDrawnFrameRef.current = false;
  }, [videoUrl]);

  // High-performance canvas drawing function - strictly synchronized with left video
  const renderCanvasFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = annotatedCanvasRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match natural dimensions of user's uploaded video (clamped to max 1280px for optimal 60 FPS performance)
    if (video.videoWidth && video.videoHeight) {
      const maxW = 1280;
      const scale = Math.min(1, maxW / video.videoWidth);
      const targetW = Math.round(video.videoWidth * scale);
      const targetH = Math.round(video.videoHeight * scale);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    }

    const width = canvas.width || 640;
    const height = canvas.height || 360;

    // 1. Draw current video frame smoothly without flickering or buffer blanking
    try {
      if (video.readyState >= 1 && video.videoWidth > 0) {
        ctx.drawImage(video, 0, 0, width, height);
        hasDrawnFrameRef.current = true;
      } else if (!hasDrawnFrameRef.current) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, width, height);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#71717a';
        ctx.textAlign = 'center';
        ctx.fillText('Initializing video feed...', width / 2, height / 2);
        return;
      }
    } catch {
      return;
    }

    const currentAnalyzing = isAnalyzingRef.current;
    const currentVehicles = vehiclesRef.current || [];
    const currentRisk = riskRef.current;
    const {
      showTrajectories: optTrajectories,
      showBoundingBoxes: optBoxes,
      showVectors: optVectors,
      showProximityLines: optProximity,
      confidenceThreshold: optConf,
    } = overlaysRef.current;

    // If analysis is paused, display clear status badge but keep video playing in sync!
    if (!currentAnalyzing) {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
      ctx.fillRect(12, 12, 330, 26);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, 330, 26);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ANALYSIS PAUSED · CLICK "START ANALYSIS"', 22, 29);
      return;
    }

    const filteredVehicles = currentVehicles.filter((v) => v.confidence >= optConf);

    // 2. Draw Inter-Vehicle Proximity Lines & TTC (Collision Hazard Analysis)
    if (optProximity && currentRisk?.hazardPairs) {
      for (const pair of currentRisk.hazardPairs) {
        const vA = filteredVehicles.find((v) => v.id === pair.vehicleA);
        const vB = filteredVehicles.find((v) => v.id === pair.vehicleB);

        if (vA && vB) {
          const ax = (vA.centroid.x / 1000) * width;
          const ay = (vA.centroid.y / 1000) * height;
          const bx = (vB.centroid.x / 1000) * width;
          const by = (vB.centroid.y / 1000) * height;

          const isCritical = pair.hazardLevel === 'critical';
          ctx.beginPath();
          ctx.setLineDash(isCritical ? [] : [4, 4]);
          ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.75)';
          ctx.lineWidth = isCritical ? 2.5 : 1.5;
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.setLineDash([]);

          // Midpoint hazard badge
          const midX = (ax + bx) / 2;
          const midY = (ay + by) / 2;
          ctx.fillStyle = isCritical ? '#ef4444' : '#f59e0b';
          ctx.beginPath();
          ctx.arc(midX, midY, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = isCritical ? '#fee2e2' : '#fef3c7';
          ctx.textAlign = 'center';
          ctx.fillText(`TTC: ${pair.ttcSeconds}s`, midX, midY - 6);
        }
      }
    }

    // 3. Draw Vehicle Trajectory Trails (Requirement 12)
    if (optTrajectories) {
      for (const vehicle of filteredVehicles) {
        if (vehicle.trajectory && vehicle.trajectory.length > 1) {
          const color = getVehicleColor(vehicle.class);
          ctx.beginPath();
          ctx.lineWidth = 2.2;

          for (let i = 0; i < vehicle.trajectory.length; i++) {
            const pt = vehicle.trajectory[i];
            const px = (pt.x / 1000) * width;
            const py = (pt.y / 1000) * height;

            if (i === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }

          ctx.strokeStyle = color;
          ctx.stroke();

          // Historical trail dots
          for (let i = 0; i < vehicle.trajectory.length; i += 3) {
            const pt = vehicle.trajectory[i];
            const px = (pt.x / 1000) * width;
            const py = (pt.y / 1000) * height;
            const alpha = (i / vehicle.trajectory.length) * 0.7;
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        }
      }
    }

    // 4. Draw Vehicle Bounding Boxes & HUD Overlays
    for (const vehicle of filteredVehicles) {
      const [ymin, xmin, ymax, xmax] = vehicle.box_2d;
      const vx = (xmin / 1000) * width;
      const vy = (ymin / 1000) * height;
      const vw = ((xmax - xmin) / 1000) * width;
      const vh = ((ymax - ymin) / 1000) * height;
      const color = getVehicleColor(vehicle.class);

      if (optBoxes) {
        // High-tech tactical bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.0;
        ctx.strokeRect(vx, vy, vw, vh);

        // Corner bracket accents
        const bracketLen = Math.min(12, vw * 0.25, vh * 0.25);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(vx, vy + bracketLen);
        ctx.lineTo(vx, vy);
        ctx.lineTo(vx + bracketLen, vy);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(vx + vw - bracketLen, vy);
        ctx.lineTo(vx + vw, vy);
        ctx.lineTo(vx + vw, vy + bracketLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(vx, vy + vh - bracketLen);
        ctx.lineTo(vx, vy + vh);
        ctx.lineTo(vx + bracketLen, vy + vh);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(vx + vw - bracketLen, vy + vh);
        ctx.lineTo(vx + vw, vy + vh);
        ctx.lineTo(vx + vw, vy + vh - bracketLen);
        ctx.stroke();

        // Semi-translucent box tint
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.08;
        ctx.fillRect(vx, vy, vw, vh);
        ctx.globalAlpha = 1.0;
      }

      // Centroid crosshair
      const cx = (vehicle.centroid.x / 1000) * width;
      const cy = (vehicle.centroid.y / 1000) * height;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Speed & Heading Vector
      if (optVectors && vehicle.trajectory && vehicle.trajectory.length >= 2) {
        const last = vehicle.trajectory[vehicle.trajectory.length - 1];
        const prev = vehicle.trajectory[vehicle.trajectory.length - 2];
        const dx = ((last.x - prev.x) / 1000) * width * 3.0;
        const dy = ((last.y - prev.y) / 1000) * height * 3.0;

        if (Math.hypot(dx, dy) > 2) {
          ctx.beginPath();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + dx, cy + dy);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(dy, dx);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(cx + dx, cy + dy);
          ctx.lineTo(
            cx + dx - 6 * Math.cos(angle - Math.PI / 6),
            cy + dy - 6 * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            cx + dx - 6 * Math.cos(angle + Math.PI / 6),
            cy + dy - 6 * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      }

      // Label Tag: [ID] Class (Confidence%) + Speed
      const speedStr = vehicle.relativeSpeedKmh ? ` · ${vehicle.relativeSpeedKmh}km/h` : '';
      const labelText = `${vehicle.id} ${vehicle.class} ${Math.round(vehicle.confidence * 100)}%${speedStr}`;
      ctx.font = 'bold 11px monospace';
      const textMetrics = ctx.measureText(labelText);
      const badgeW = textMetrics.width + 10;
      const badgeH = 18;

      const badgeY = Math.max(0, vy - badgeH - 3);

      // Label background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(vx, badgeY, badgeW, badgeH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, badgeY, badgeW, badgeH);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(labelText, vx + 5, badgeY + 13);

      // Sudden Braking Flash Alert
      if (vehicle.isSuddenBraking) {
        const brakeW = 88;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(vx, vy + vh + 2, brakeW, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('⚠ BRAKING!', vx + 6, vy + vh + 14);
      } else if (vehicle.isWeaving) {
        const weaveW = 80;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(vx, vy + vh + 2, weaveW, 16);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('⚡ WEAVING', vx + 6, vy + vh + 14);
      }
    }

    // Top-left watermark HUD on analyzed video
    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.fillRect(10, 10, 240, 24);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(10, 10, 240, 24);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(
      `YOLOv11+OpenCV · ${filteredVehicles.length} Vehicles Tracked`,
      18,
      26
    );
  }, [videoRef, annotatedCanvasRef]);

  // Continuous lockstep synchronization loop:
  // Runs whenever video is playing or state updates, listening directly to HTML5 video presentation
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;
    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;
      renderCanvasFrame();
      if (!video.paused && !video.ended) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };

    // Event listeners to guarantee frame lockstep during all user interactions
    const handlePlay = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(renderLoop);
    };

    const handleVideoSyncEvent = () => {
      renderCanvasFrame();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handleVideoSyncEvent);
    video.addEventListener('seeked', handleVideoSyncEvent);
    video.addEventListener('seeking', handleVideoSyncEvent);
    video.addEventListener('timeupdate', handleVideoSyncEvent);
    video.addEventListener('loadeddata', handleVideoSyncEvent);
    video.addEventListener('ratechange', handleVideoSyncEvent);

    // Initial render on mount or update
    renderCanvasFrame();

    if (!video.paused) {
      rafId = requestAnimationFrame(renderLoop);
    }

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handleVideoSyncEvent);
      video.removeEventListener('seeked', handleVideoSyncEvent);
      video.removeEventListener('seeking', handleVideoSyncEvent);
      video.removeEventListener('timeupdate', handleVideoSyncEvent);
      video.removeEventListener('loadeddata', handleVideoSyncEvent);
      video.removeEventListener('ratechange', handleVideoSyncEvent);
    };
  }, [videoRef, renderCanvasFrame, videoUrl]);

  return (
    <div className="flex flex-col gap-4">
      {/* Side-by-Side Video Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT PANE: Original Input Footage */}
        <div className="flex flex-col bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                1. Original Input Footage
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Raw Camera Stream
            </span>
          </div>

          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                autoPlay
                preload="auto"
                loop
                muted
                className="w-full h-full object-contain"
                onCanPlay={() => {
                  videoRef.current?.play().catch(() => {});
                }}
              />
            ) : (
              <div className="text-center p-6 font-mono text-xs text-zinc-500">
                No video loaded. Upload an Indian traffic video to begin.
              </div>
            )}

            {/* Video overlay indicator */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm border border-zinc-800 px-2.5 py-1 rounded text-[10px] font-mono text-zinc-300">
              ORIGINAL FOOTAGE (ACTUAL INPUT)
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Analyzed Traffic Footage */}
        <div className="flex flex-col bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-100 font-bold">
                2. Analyzed Traffic Footage (YOLOv11 + OpenCV)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isProcessingFrame && (
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Inferencing
                </span>
              )}
              <span className="text-[11px] font-mono text-red-400">
                Live Annotations
              </span>
            </div>
          </div>

          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            <canvas
              ref={annotatedCanvasRef}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Main Transport & Video Controls Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-md">
        {/* Scrubber timeline */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 shrink-0 w-16">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.033}
              value={currentTime || 0}
              onChange={handleScrubberChange}
              disabled={!videoUrl}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 shrink-0 w-16 text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons & Transport row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-900">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              disabled={!videoUrl}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white font-mono text-xs font-bold transition-colors disabled:opacity-40"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>

            {/* Replay */}
            <button
              onClick={onRestart}
              disabled={!videoUrl}
              title="Restart video from beginning"
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Frame Step Back */}
            <button
              onClick={() => onStepFrame('prev')}
              disabled={!videoUrl || isPlaying}
              title="Step back 1 frame (-1/30s)"
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors disabled:opacity-40"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Frame Step Forward */}
            <button
              onClick={() => onStepFrame('next')}
              disabled={!videoUrl || isPlaying}
              title="Step forward 1 frame (+1/30s)"
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors disabled:opacity-40"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Speed Selector */}
            <div className="flex items-center border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
              {[0.5, 1.0, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onChangePlaybackRate(rate)}
                  className={`px-2 py-1 rounded transition-colors ${
                    playbackRate === rate
                      ? 'bg-zinc-800 text-zinc-100 font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action: START / PAUSE ANALYSIS */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-zinc-400">
              <span>Engine:</span>
              <select
                value={engineMode}
                onChange={(e) => onChangeEngineMode(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-zinc-700"
              >
                <option value="hybrid">Hybrid (YOLOv11 + OpenCV Tracker)</option>
                <option value="yolo-server">YOLOv11 Server AI (Gemini 3.8)</option>
                <option value="opencv-fast">OpenCV Fast Optical Tracker</option>
              </select>
            </div>

            <button
              onClick={onToggleAnalysis}
              disabled={!videoUrl}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-md ${
                isAnalyzing
                  ? 'bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40'
              } disabled:opacity-40`}
            >
              <Activity className="w-4 h-4" />
              <span>{isAnalyzing ? 'Pause Analysis' : 'Start Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Overlay Filters & Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-900 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4 text-zinc-400">
            <span className="text-zinc-500 text-[11px] uppercase tracking-wider">
              Overlays:
            </span>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
              <input
                type="checkbox"
                checked={showBoundingBoxes}
                onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                className="rounded border-zinc-800 accent-red-500 cursor-pointer"
              />
              <span>YOLO Bounding Boxes</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
              <input
                type="checkbox"
                checked={showTrajectories}
                onChange={(e) => setShowTrajectories(e.target.checked)}
                className="rounded border-zinc-800 accent-red-500 cursor-pointer"
              />
              <span>OpenCV Trajectories</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
              <input
                type="checkbox"
                checked={showVectors}
                onChange={(e) => setShowVectors(e.target.checked)}
                className="rounded border-zinc-800 accent-red-500 cursor-pointer"
              />
              <span>Speed Vectors</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
              <input
                type="checkbox"
                checked={showProximityLines}
                onChange={(e) => setShowProximityLines(e.target.checked)}
                className="rounded border-zinc-800 accent-red-500 cursor-pointer"
              />
              <span>TTC Proximity Lines</span>
            </label>
          </div>

          {/* Confidence slider */}
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <span>Min Conf:</span>
            <input
              type="range"
              min={0.3}
              max={0.9}
              step={0.05}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-20 h-1 bg-zinc-800 rounded accent-red-500 cursor-pointer"
            />
            <span className="w-8 text-zinc-300 font-bold">
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
