import React from 'react';
import { ShieldAlert, Video, Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';
import { alertSound } from '../utils/audio';

interface HeaderProps {
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onReset: () => void;
  onUploadClick?: () => void;
  hasVideo: boolean;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isSoundMuted,
  onToggleSound,
  onReset,
  onUploadClick,
  hasVideo,
  isAnalyzing,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & System Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-sm shadow-red-500/10">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-100 font-mono">
                ACCIDENT<span className="text-red-500">CASCADE</span>.AI
              </h1>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                · Indian Traffic CV
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              YOLOv11 Vehicle Detection & OpenCV Tracking for Secondary Crash Prevention
            </p>
          </div>
        </div>

        {/* System Pipeline Status Telemetry */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-md text-zinc-300">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              YOLOv11 Vision
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">OpenCV Tracker</span>
            <span className="text-zinc-600">/</span>
            <span className="text-amber-400">Indian Traffic Rules</span>
          </div>

          {/* Sound & Action Controls */}
          <div className="flex items-center gap-2">
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                title="Upload or Change Indian Traffic Footage"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600/90 hover:bg-red-500 text-white font-mono text-xs font-semibold transition-all shadow-sm shadow-red-950"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Upload Video</span>
              </button>
            )}

            <button
              onClick={onToggleSound}
              title={isSoundMuted ? 'Unmute Early Warning Siren' : 'Mute Warning Audio'}
              className={`p-2 rounded-md border transition-colors ${
                isSoundMuted
                  ? 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                  : 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {hasVideo && (
              <button
                onClick={onReset}
                title="Reset Tracker and Video Playhead"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors text-xs font-mono"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
