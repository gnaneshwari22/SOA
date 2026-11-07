import React, { useEffect } from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, Info, ArrowRight, BellRing } from 'lucide-react';
import { CascadeRiskAssessment } from '../types/traffic';
import { alertSound } from '../utils/audio';

interface EarlyWarningBannerProps {
  riskAssessment: CascadeRiskAssessment | null;
  isAnalyzing: boolean;
  hasVideo: boolean;
  isSoundMuted: boolean;
}

export const EarlyWarningBanner: React.FC<EarlyWarningBannerProps> = ({
  riskAssessment,
  isAnalyzing,
  hasVideo,
  isSoundMuted,
}) => {
  const isCritical = riskAssessment?.level === 'CRITICAL';
  const isWatch = riskAssessment?.level === 'WATCH';
  const isAdvisory = riskAssessment?.level === 'ADVISORY';

  useEffect(() => {
    if (isAnalyzing && riskAssessment) {
      if (isCritical) {
        alertSound.playWarningChime('critical');
      } else if (isWatch) {
        alertSound.playWarningChime('warning');
      }
    }
  }, [isCritical, isWatch, isAnalyzing, riskAssessment]);

  if (!hasVideo) {
    return null;
  }

  if (!isAnalyzing || !riskAssessment) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-zinc-500" />
          <span>Status: Waiting for video analysis. Click "Start Analysis" to detect vehicles and compute cascade risk.</span>
        </div>
        <span className="text-zinc-600">Module: YOLOv11 + OpenCV</span>
      </div>
    );
  }

  if (isCritical) {
    return (
      <div className="bg-red-950/70 border-2 border-red-500 rounded-lg p-4 shadow-lg shadow-red-950/50 animate-pulse-slow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-red-600 text-white animate-bounce shrink-0 mt-0.5 sm:mt-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-red-400">
                  CRITICAL EARLY WARNING · SECONDARY COLLISION RISK
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-600 text-white font-bold">
                  Score: {riskAssessment.score}/100
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-1">
                {riskAssessment.primaryHazard}
              </p>
              {riskAssessment.affectedVehicleIds.length > 0 && (
                <p className="text-xs font-mono text-red-300 mt-1">
                  Identified Hazard Zone Vehicles:{' '}
                  <span className="font-bold underline text-white">
                    {riskAssessment.affectedVehicleIds.join(', ')}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 bg-red-900/60 border border-red-700/60 p-2.5 rounded text-xs font-mono text-red-200 flex flex-col gap-1">
            <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold">
              Automated Countermeasure
            </span>
            <span className="font-semibold text-white">
              TRIGGER HIGHWAY VMS ALERT & EMERGENCY BRAKE WAVE ADVISORY
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isWatch) {
    return (
      <div className="bg-amber-950/60 border border-amber-500/70 rounded-lg p-3.5 shadow-sm shadow-amber-950/40">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-400">
                  WATCH ADVISORY · ELEVATED CASCADE RISK ({riskAssessment.score}/100)
                </span>
              </div>
              <p className="text-xs font-medium text-zinc-200 mt-0.5">
                {riskAssessment.primaryHazard}
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-amber-400 shrink-0 hidden sm:block">
            <span>Tight headway in mixed corridor</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 flex items-center justify-between text-xs font-mono text-zinc-300">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-emerald-400 font-bold">NORMAL TRAFFIC DYNAMICS (Risk: {riskAssessment.score}/100)</span>
        <span className="text-zinc-500">·</span>
        <span className="text-zinc-400 text-xs">Safe headway & normal Indian mixed traffic spacing.</span>
      </div>
      <span className="text-[11px] text-zinc-500 hidden md:inline">
        Cascade Threshold: 70
      </span>
    </div>
  );
};
