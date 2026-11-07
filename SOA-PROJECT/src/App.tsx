/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadDropzone } from './components/UploadDropzone';
import { VideoPlayerSideBySide } from './components/VideoPlayerSideBySide';
import { EarlyWarningBanner } from './components/EarlyWarningBanner';
import { VehicleAnalysisPanel } from './components/VehicleAnalysisPanel';
import { CascadePhysicsExplainer } from './components/CascadePhysicsExplainer';
import { WarningRecipientsModal } from './components/WarningRecipientsModal';
import { WarningMessageDisplayer } from './components/WarningMessageDisplayer';
import {
  DetectedVehicle,
  ProcessingStats,
  CascadeRiskAssessment,
  VideoMetadata,
} from './types/traffic';
import { OpenCVVehicleTracker, analyzeCascadeDynamics, RawDetection } from './utils/tracker';
import { detectVehiclesNeural } from './utils/localDetector';
import { alertSound } from './utils/audio';

export default function App() {
  // Video and source file state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Computer Vision & Tracking Engine state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [engineMode, setEngineMode] = useState<'hybrid' | 'yolo-server' | 'opencv-fast'>('hybrid');
  const [vehicles, setVehicles] = useState<DetectedVehicle[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<CascadeRiskAssessment | null>(null);
  const [isProcessingFrame, setIsProcessingFrame] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Processing Statistics
  const [stats, setStats] = useState<ProcessingStats>({
    frameNumber: 0,
    totalFramesEstimated: 0,
    fps: 0,
    processingTimeMs: 0,
    detectedCount: 0,
    activeTrackedCount: 0,
    status: 'idle',
    lastDetectionSource: 'None',
  });

  // DOM references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const annotatedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent OpenCV Tracker instance
  const trackerRef = useRef<OpenCVVehicleTracker>(new OpenCVVehicleTracker());
  const prevImageDataRef = useRef<ImageData | null>(null);
  const lastServerCallFrameRef = useRef<number>(-100);
  const lastNeuralDetectFrameRef = useRef<number>(-100);
  const serverRateLimitCooldownRef = useRef<number>(0);
  const fpsTrackerRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });
  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const isTriggerProcessingRef = useRef<boolean>(false);
  const lastLoopTimeRef = useRef<number>(0);
  const prevVideoUrlRef = useRef<string | null>(null);
  const initialVideoLoadedRef = useRef<boolean>(false);

  // Handle Video Upload
  const handleVideoSelected = useCallback((file: File) => {
    if (prevVideoUrlRef.current) {
      try {
        URL.revokeObjectURL(prevVideoUrlRef.current);
      } catch {
        // ignore
      }
    }

    const url = URL.createObjectURL(file);
    prevVideoUrlRef.current = url;
    setVideoFile(file);
    setVideoUrl(url);
    setIsAnalyzing(true);
    trackerRef.current.reset();
    setVehicles([]);
    setRiskAssessment(null);
    prevImageDataRef.current = null;
    lastServerCallFrameRef.current = -100;
    lastNeuralDetectFrameRef.current = -100;

    // Temporary video element to extract duration and resolution
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setDuration(tempVideo.duration || 0);
      setMetadata({
        name: file.name,
        size: file.size,
        duration: tempVideo.duration || 0,
        width: tempVideo.videoWidth || 640,
        height: tempVideo.videoHeight || 360,
        url,
        file,
      });
      setStats((prev) => ({
        ...prev,
        totalFramesEstimated: Math.round((tempVideo.duration || 0) * 30),
        status: 'processing',
      }));

      // Immediate first-frame analysis once video buffer is ready & attempt playback
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
          triggerFrameProcessing(0);
        }
      }, 100);
    };
  }, []);

  // Load preloaded Indian traffic video input
  const loadPreloadedTrafficVideo = useCallback(async () => {
    try {
      const response = await fetch('/videos/indian_traffic_sample.mp4');
      if (!response.ok) return;
      const blob = await response.blob();
      const defaultFile = new File([blob], 'indian_arterial_traffic_sample.mp4', {
        type: 'video/mp4',
        lastModified: Date.now(),
      });
      handleVideoSelected(defaultFile);
    } catch (err) {
      console.warn('Error loading preloaded Indian traffic video:', err);
    }
  }, [handleVideoSelected]);

  // Load one input video on initial startup exactly once
  useEffect(() => {
    if (initialVideoLoadedRef.current) return;
    initialVideoLoadedRef.current = true;
    loadPreloadedTrafficVideo();
  }, [loadPreloadedTrafficVideo]);

  // Video time updates and scrubbing synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (!duration && video.duration) {
        setDuration(video.duration);
      }
    };

    const handleEnded = () => {
      // Don't disable analysis on end so user can scrub and review
    };

    const handleLoadedData = () => {
      // Analyze first frame immediately as video is presented
      triggerFrameProcessing(video.currentTime || 0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [duration]);

  // Handle seeking
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      // Trigger instant frame analysis at new scrubbed position
      triggerFrameProcessing(time);
    }
  };

  // Step forward/backward 1 frame (1/30s precision)
  const handleStepFrame = (direction: 'prev' | 'next') => {
    const video = videoRef.current;
    if (!video) return;
    const step = 1 / 30;
    const newTime = direction === 'next' ? video.currentTime + step : video.currentTime - step;
    const clampedTime = Math.max(0, Math.min(video.duration || 100, newTime));
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
    triggerFrameProcessing(clampedTime);
  };

  // Playback rate change
  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Reset video and tracker
  const handleReset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
    setCurrentTime(0);
    setIsAnalyzing(false);
    trackerRef.current.reset();
    setVehicles([]);
    setRiskAssessment(null);
    prevImageDataRef.current = null;
    lastServerCallFrameRef.current = -100;
  };

  // Toggle Analysis
  const handleToggleAnalysis = () => {
    if (!videoUrl) return;

    if (!isAnalyzing) {
      setIsAnalyzing(true);
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      setIsAnalyzing(false);
    }
  };

  // Trigger frame processing logic - optimized to run without buffer starvation
  const triggerFrameProcessing = async (timestampSeconds: number) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    // Prevent re-entrant execution: skip if previous frame inference is still active
    if (isTriggerProcessingRef.current) return;
    isTriggerProcessingRef.current = true;

    try {
      const frameNumber = Math.max(1, Math.floor(timestampSeconds * 30));
      const startTime = performance.now();

      // Create lightweight offscreen canvas capped to max 480px to avoid memory thrashing
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      const rawW = video.videoWidth || 640;
      const rawH = video.videoHeight || 360;

      // Keep processing dimensions lightweight (max 360) for instant 60 FPS CV analysis
      const maxDim = 360;
      const scale = Math.min(1, maxDim / Math.max(rawW, rawH));
      const procW = Math.max(160, Math.round(rawW * scale));
      const procH = Math.max(90, Math.round(rawH * scale));

      if (offscreen.width !== procW || offscreen.height !== procH) {
        offscreen.width = procW;
        offscreen.height = procH;
      }

      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      // Draw downscaled frame for ultra-fast CV pipeline
      offCtx.drawImage(video, 0, 0, procW, procH);

      // Single synchronous pixel read for the whole frame
      const currentImageData = offCtx.getImageData(0, 0, procW, procH);

      // 1. Run Neural YOLO Detection every 5 frames (~160ms), or immediately on initial frame, seek, or step
      const shouldRunNeuralDetection =
        lastNeuralDetectFrameRef.current === -100 ||
        Math.abs(frameNumber - lastNeuralDetectFrameRef.current) >= 5 ||
        video.paused;

      let currentTracks: DetectedVehicle[] = [];

      if (shouldRunNeuralDetection) {
        lastNeuralDetectFrameRef.current = frameNumber;

        try {
          const { detections: neuralDets } = await detectVehiclesNeural(
            offscreen,
            currentImageData,
            prevImageDataRef.current
          );

          if (neuralDets.length > 0) {
            currentTracks = trackerRef.current.update(
              neuralDets,
              frameNumber,
              timestampSeconds,
              30
            );
          } else if (prevImageDataRef.current) {
            currentTracks = trackerRef.current.trackWithOpticalMotion(
              currentImageData,
              prevImageDataRef.current,
              frameNumber,
              timestampSeconds
            );
          } else {
            currentTracks = trackerRef.current.interpolateTracks(frameNumber, timestampSeconds);
          }
        } catch (err) {
          console.warn('Neural frame detection error:', err);
          if (prevImageDataRef.current) {
            currentTracks = trackerRef.current.trackWithOpticalMotion(
              currentImageData,
              prevImageDataRef.current,
              frameNumber,
              timestampSeconds
            );
          }
        }
      } else {
        // 2. Micro-frames: follow vehicles locked on actual optical pixel motion
        if (prevImageDataRef.current) {
          currentTracks = trackerRef.current.trackWithOpticalMotion(
            currentImageData,
            prevImageDataRef.current,
            frameNumber,
            timestampSeconds
          );
        } else {
          currentTracks = trackerRef.current.interpolateTracks(frameNumber, timestampSeconds);
        }
      }

      if (currentTracks.length > 0) {
        setVehicles([...currentTracks]);

        const risk = analyzeCascadeDynamics(currentTracks, frameNumber, timestampSeconds);
        setRiskAssessment(risk);

        setStats((prev) => ({
          ...prev,
          frameNumber,
          detectedCount: currentTracks.length,
          activeTrackedCount: currentTracks.length,
          lastDetectionSource: engineMode === 'opencv-fast' ? 'OpenCV-Tracker' : 'Hybrid',
          processingTimeMs: Math.round(performance.now() - startTime),
        }));
      }

      prevImageDataRef.current = currentImageData;

      // 3. Rate-limited Server YOLOv11 (Gemini) - at most once every 15s (450 frames) to respect API quotas
      const canCallServer =
        (engineMode === 'hybrid' || engineMode === 'yolo-server') &&
        Date.now() > serverRateLimitCooldownRef.current &&
        (lastServerCallFrameRef.current === -100 ||
          Math.abs(frameNumber - lastServerCallFrameRef.current) >= 450) &&
        !isProcessingFrame;

      if (canCallServer) {
        setIsProcessingFrame(true);
        lastServerCallFrameRef.current = frameNumber;

        try {
          const jpegDataUrl = offscreen.toDataURL('image/jpeg', 0.82);

          fetch('/api/detect-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: jpegDataUrl,
              frameNumber,
              timestamp: timestampSeconds,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.isRateLimited) {
                serverRateLimitCooldownRef.current = Date.now() + 30000;
                return;
              }

              if (data.success && Array.isArray(data.detections) && data.detections.length > 0) {
                const rawDetections: RawDetection[] = data.detections.map((d: any) => ({
                  class: d.class || 'Car',
                  box_2d: d.box_2d || [200, 200, 400, 400],
                  confidence: d.confidence || 0.88,
                  state: d.state || 'cruising',
                  relativeSpeedKmh: d.relativeSpeedKmh,
                }));

                const serverUpdated = trackerRef.current.update(
                  rawDetections,
                  frameNumber,
                  timestampSeconds,
                  30
                );
                setVehicles([...serverUpdated]);

                const risk = analyzeCascadeDynamics(serverUpdated, frameNumber, timestampSeconds);
                setRiskAssessment(risk);

                setStats((prev) => ({
                  ...prev,
                  lastDetectionSource: 'YOLOv11-Server',
                  detectedCount: rawDetections.length,
                  activeTrackedCount: serverUpdated.length,
                }));
              }
            })
            .catch(() => {
              serverRateLimitCooldownRef.current = Date.now() + 20000;
            })
            .finally(() => {
              setIsProcessingFrame(false);
            });
        } catch {
          setIsProcessingFrame(false);
        }
      }

      // Calculate real Render FPS
      const now = performance.now();
      fpsTrackerRef.current.frames++;
      if (now - fpsTrackerRef.current.lastTime >= 600) {
        const realFps = (fpsTrackerRef.current.frames / (now - fpsTrackerRef.current.lastTime)) * 1000;
        setStats((prev) => ({ ...prev, fps: Number(realFps.toFixed(1)) }));
        fpsTrackerRef.current.frames = 0;
        fpsTrackerRef.current.lastTime = now;
      }
    } finally {
      isTriggerProcessingRef.current = false;
    }
  };

  // Continuous animation frame loop when analyzing - throttled to ~25 FPS to ensure smooth video playback with zero buffering
  useEffect(() => {
    let animationId: number;

    const loop = (currentTime: number) => {
      const video = videoRef.current;
      if (video && isAnalyzing && !video.paused && !video.seeking) {
        if (currentTime - lastLoopTimeRef.current >= 38) {
          lastLoopTimeRef.current = currentTime;
          triggerFrameProcessing(video.currentTime);
        }
      }
      animationId = requestAnimationFrame(loop);
    };

    if (isAnalyzing) {
      animationId = requestAnimationFrame(loop);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAnalyzing, engineMode]);

  // Toggle sound
  const handleToggleSound = () => {
    const nextMuted = !isSoundMuted;
    setIsSoundMuted(nextMuted);
    alertSound.setMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-red-500 selection:text-white">
      {/* Hidden Global File Input for Header and Actions */}
      <input
        ref={globalFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleVideoSelected(e.target.files[0]);
          }
        }}
      />

      {/* Header Bar */}
      <Header
        isSoundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
        onReset={handleReset}
        onUploadClick={() => globalFileInputRef.current?.click()}
        hasVideo={Boolean(videoUrl)}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Top: Upload Indian Traffic Video Dropzone - Always Open */}
        <UploadDropzone
          onVideoSelected={handleVideoSelected}
          onRestorePreloadedVideo={loadPreloadedTrafficVideo}
          currentMetadata={metadata}
          isAnalyzing={isAnalyzing}
        />

        {/* Early Warning Status Banner */}
        <EarlyWarningBanner
          riskAssessment={riskAssessment}
          isAnalyzing={isAnalyzing}
          hasVideo={Boolean(videoUrl)}
          isSoundMuted={isSoundMuted}
        />

        {/* Center: Side-by-Side Video Players */}
        <VideoPlayerSideBySide
          videoUrl={videoUrl}
          videoRef={videoRef}
          annotatedCanvasRef={annotatedCanvasRef}
          vehicles={vehicles}
          riskAssessment={riskAssessment}
          isAnalyzing={isAnalyzing}
          onToggleAnalysis={handleToggleAnalysis}
          stats={stats}
          onSeek={handleSeek}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          onChangePlaybackRate={handleChangePlaybackRate}
          onStepFrame={handleStepFrame}
          onRestart={handleReset}
          engineMode={engineMode}
          onChangeEngineMode={setEngineMode}
          isProcessingFrame={isProcessingFrame}
        />

        {/* Bottom: Real Vehicle Analysis Telemetry Panel */}
        <VehicleAnalysisPanel
          vehicles={vehicles}
          stats={stats}
          riskAssessment={riskAssessment}
          isAnalyzing={isAnalyzing}
          hasVideo={Boolean(videoUrl)}
        />

        {/* Real-Time Automated Warning Message Dispatch Center */}
        <WarningMessageDisplayer
          riskAssessment={riskAssessment}
          isAnalyzing={isAnalyzing}
          hasVideo={Boolean(videoUrl)}
        />

        {/* Early Warning Dissemination Network */}
        <WarningRecipientsModal />

        {/* Technical Explainer & Methodology */}
        <CascadePhysicsExplainer />
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-4 px-4 sm:px-8 text-center font-mono text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>AccidentCascade AI Engine · Indian Mixed Traffic Computer Vision</span>
        </div>
        <div className="text-zinc-400">
          Strict Frame-by-Frame Data Flow · Real Uploaded Video Input
        </div>
      </footer>
    </div>
  );
}
