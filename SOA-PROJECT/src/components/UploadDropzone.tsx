import React, { useState, useRef } from 'react';
import { Upload, FileVideo, CheckCircle2, RefreshCw, Sparkles, Loader2, ArrowUpRight } from 'lucide-react';
import { VideoMetadata } from '../types/traffic';

interface UploadDropzoneProps {
  onVideoSelected: (file: File) => void;
  onRestorePreloadedVideo?: () => void;
  currentMetadata: VideoMetadata | null;
  isAnalyzing: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onVideoSelected,
  onRestorePreloadedVideo,
  currentMetadata,
  isAnalyzing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, WebM, MOV, etc.).');
      return;
    }
    onVideoSelected(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <h2 className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-red-500" />
              Traffic Video Input & Footage Uploader
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Analyzing video for Indian mixed traffic: Auto-rickshaws, Motorcycles, Scooters, Cars, Buses, and Tempos.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm shadow-red-950 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileVideo className="w-4 h-4" />
            <span>Upload Traffic Video</span>
          </button>

          {onRestorePreloadedVideo && (
            <button
              onClick={onRestorePreloadedVideo}
              title="Switch back to the preloaded Indian arterial road traffic video"
              className="px-3 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Default Indian Traffic Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Visual Area - Always Open */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-3.5 sm:p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-red-500 bg-red-500/10 scale-[1.005]'
            : 'border-zinc-800 bg-zinc-900/30 hover:border-red-500/50 hover:bg-zinc-900/50'
        }`}
      >
        {currentMetadata ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-left font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100 block truncate max-w-xs sm:max-w-md">
                    {currentMetadata.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ACTIVE INPUT
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">
                  {(currentMetadata.size / (1024 * 1024)).toFixed(2)} MB · {currentMetadata.width}×{currentMetadata.height}px · {currentMetadata.duration.toFixed(1)}s footage
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right text-[11px] text-zinc-400">
              <span className="text-zinc-400 hover:text-red-400 flex items-center gap-1 text-xs">
                <span>Click or drop to replace with your video</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <FileVideo className="w-7 h-7 text-zinc-500" />
            <p className="text-xs font-mono text-zinc-300">
              Drop your Indian traffic MP4, WebM, or MOV video here, or{' '}
              <span className="text-red-400 underline font-semibold">browse your files to upload</span>
            </p>
            <p className="text-[11px] font-mono text-zinc-500">
              Zero mock footage — your actual video frames are analyzed live with YOLOv11 + OpenCV.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
