import React from 'react';
import {
  DetectedVehicle,
  IndianVehicleClass,
  ProcessingStats,
  CascadeRiskAssessment,
} from '../types/traffic';
import { VEHICLE_CLASS_COLORS } from '../utils/colors';
import {
  Activity,
  Gauge,
  Navigation,
  Car,
  AlertTriangle,
  Flame,
  ArrowDownUp,
  Cpu,
} from 'lucide-react';

interface VehicleAnalysisPanelProps {
  vehicles: DetectedVehicle[];
  stats: ProcessingStats;
  riskAssessment: CascadeRiskAssessment | null;
  isAnalyzing: boolean;
  hasVideo: boolean;
}

export const VehicleAnalysisPanel: React.FC<VehicleAnalysisPanelProps> = ({
  vehicles,
  stats,
  riskAssessment,
  isAnalyzing,
  hasVideo,
}) => {
  // Aggregate vehicle counts by class from actual detections
  const classCounts: Partial<Record<IndianVehicleClass, number>> = {};
  if (isAnalyzing && vehicles.length > 0) {
    for (const v of vehicles) {
      classCounts[v.class] = (classCounts[v.class] || 0) + 1;
    }
  }

  const indianClasses: IndianVehicleClass[] = [
    'Auto-rickshaw',
    'Motorcycle',
    'Scooter',
    'Car',
    'Bus',
    'Truck',
    'Tempo',
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* SECTION 1: REAL REAL-TIME TELEMETRY METRICS (Requirement 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Frame Number */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Frame Number
          </span>
          <span className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {isAnalyzing && hasVideo ? `#${stats.frameNumber}` : 'Not available'}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 mt-1">
            {isAnalyzing ? 'Synchronized stream' : 'Waiting for analysis'}
          </span>
        </div>

        {/* Real FPS */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Render / CV FPS
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {isAnalyzing && hasVideo ? `${stats.fps.toFixed(1)} FPS` : 'Not available'}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 mt-1">
            {isAnalyzing ? `${stats.processingTimeMs}ms inference` : 'Idle'}
          </span>
        </div>

        {/* Detected Vehicles Count */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Detected Vehicles
          </span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1">
            {isAnalyzing && hasVideo ? vehicles.length : 'Not available'}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 mt-1">
            YOLOv11 Actual Frame
          </span>
        </div>

        {/* Active Tracked IDs */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Active Tracked IDs
          </span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1">
            {isAnalyzing && hasVideo ? stats.activeTrackedCount : 'Not available'}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 mt-1">
            OpenCV IoU / Centroid
          </span>
        </div>

        {/* Cascade Risk Score */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Cascade Risk Score
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-bold font-mono ${
                !isAnalyzing || !riskAssessment
                  ? 'text-zinc-500'
                  : riskAssessment.score >= 70
                  ? 'text-red-500'
                  : riskAssessment.score >= 50
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {isAnalyzing && riskAssessment ? `${riskAssessment.score}` : 'Not available'}
            </span>
            {isAnalyzing && riskAssessment && (
              <span className="text-[11px] font-mono text-zinc-500">/100</span>
            )}
          </div>
          <span className="text-[10px] font-mono uppercase text-zinc-400 mt-1">
            {isAnalyzing && riskAssessment ? riskAssessment.level : 'Pending'}
          </span>
        </div>

        {/* Engine Source */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            CV Model
          </span>
          <span className="text-xs font-bold font-mono text-cyan-400 mt-1 truncate">
            {isAnalyzing ? stats.lastDetectionSource : 'Waiting'}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 mt-1">
            Indian Traffic Profile
          </span>
        </div>
      </div>

      {/* SECTION 2: INDIAN VEHICLE CLASSES DISTRIBUTION */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
              Indian Mixed Traffic Composition (Current Frame)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {isAnalyzing ? `${vehicles.length} Total Vehicles` : 'Detection not started'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {indianClasses.map((cls) => {
            const count = classCounts[cls] || 0;
            const style = VEHICLE_CLASS_COLORS[cls];
            return (
              <div
                key={cls}
                className={`border border-zinc-800/80 bg-zinc-900/40 p-2.5 rounded-lg flex flex-col justify-between transition-colors ${
                  count > 0 ? 'border-zinc-700 bg-zinc-900/90' : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: style.hex }}
                  ></span>
                  <span className="text-xs font-mono text-zinc-300 truncate">
                    {cls}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg font-mono font-bold text-zinc-100">
                    {isAnalyzing ? count : '—'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {count > 0 ? 'Active' : 'None'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: REAL DETECTED VEHICLE TELEMETRY TABLE (Requirement 11) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="bg-zinc-900/80 px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
              Vehicle Telemetry & OpenCV Tracking Log
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Coordinates in [ymin, xmin, ymax, xmax] normalized (0-1000)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Vehicle ID</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Bounding Box [ymin, xmin, ymax, xmax]</th>
                <th className="py-2.5 px-3">Speed (km/h)</th>
                <th className="py-2.5 px-3">Movement State</th>
                <th className="py-2.5 px-3">Trajectory Length</th>
                <th className="py-2.5 px-4 text-right">Hazard Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!isAnalyzing || vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    {!hasVideo
                      ? 'No video uploaded yet. Please upload an Indian traffic video.'
                      : !isAnalyzing
                      ? 'Detection processing not implemented yet until "Start Analysis" is clicked.'
                      : 'No vehicles detected in this specific frame.'}
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => {
                  const style = VEHICLE_CLASS_COLORS[v.class];
                  return (
                    <tr key={v.id} className="hover:bg-zinc-900/50 transition-colors">
                      {/* Vehicle ID */}
                      <td className="py-2.5 px-4 font-bold text-zinc-200 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: style.hex }}
                        ></span>
                        {v.id}
                      </td>

                      {/* Class */}
                      <td className="py-2.5 px-3 text-zinc-300">
                        <span className="font-semibold">{v.class}</span>
                      </td>

                      {/* Confidence */}
                      <td className="py-2.5 px-3 text-zinc-300">
                        {(v.confidence * 100).toFixed(1)}%
                      </td>

                      {/* Bounding Box Coordinates (Requirement 11) */}
                      <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                        [{v.box_2d.join(', ')}]
                      </td>

                      {/* Speed */}
                      <td className="py-2.5 px-3 text-zinc-200">
                        {v.relativeSpeedKmh} km/h
                        {v.acceleration !== undefined && v.acceleration !== 0 && (
                          <span
                            className={`ml-1 text-[10px] ${
                              v.acceleration < -5 ? 'text-red-400' : 'text-zinc-500'
                            }`}
                          >
                            ({v.acceleration > 0 ? `+${v.acceleration}` : v.acceleration})
                          </span>
                        )}
                      </td>

                      {/* State */}
                      <td className="py-2.5 px-3">
                        {v.isSuddenBraking ? (
                          <span className="text-red-400 font-bold uppercase">
                            ⚠ Sudden Braking
                          </span>
                        ) : v.isWeaving ? (
                          <span className="text-amber-400 font-bold uppercase">
                            ⚡ Lane Weaving
                          </span>
                        ) : v.state === 'stopped' ? (
                          <span className="text-zinc-400">Stopped</span>
                        ) : (
                          <span className="text-emerald-400">Cruising</span>
                        )}
                      </td>

                      {/* Trajectory points */}
                      <td className="py-2.5 px-3 text-zinc-400">
                        {v.trajectory.length} pts
                      </td>

                      {/* Hazard Status */}
                      <td className="py-2.5 px-4 text-right">
                        {v.isSuddenBraking ? (
                          <span className="text-xs font-bold text-red-400">
                            CASCADE THREAT
                          </span>
                        ) : v.isWeaving ? (
                          <span className="text-xs text-amber-400">WEAVE RISK</span>
                        ) : (
                          <span className="text-xs text-zinc-400">NORMAL</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: VEHICLE INTERACTION & SECONDARY CASCADE COLLISION ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pairwise Interaction Matrix */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowDownUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
                  Pairwise Vehicle Interaction Analysis
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                TTC & Follower Headway
              </span>
            </div>

            <div className="space-y-2">
              {!isAnalyzing || !riskAssessment || riskAssessment.hazardPairs.length === 0 ? (
                <div className="text-xs font-mono text-zinc-400 py-6 text-center border border-dashed border-zinc-800/80 rounded-lg">
                  {isAnalyzing
                    ? 'No high-risk vehicle interactions detected in current frame.'
                    : 'Interaction matrix not available until analysis begins.'}
                </div>
              ) : (
                riskAssessment.hazardPairs.slice(0, 4).map((pair, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between gap-3 ${
                      pair.hazardLevel === 'critical'
                        ? 'border-red-500/40 bg-red-950/20 text-red-200'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {pair.vehicleA} [{pair.classA}] ↔ {pair.vehicleB} [{pair.classB}]
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            pair.hazardLevel === 'critical'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          TTC: {pair.ttcSeconds}s
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {pair.hazardType} · Dist: {pair.distancePx}px · Δv: {pair.relativeSpeedKmh} km/h
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-bold shrink-0 ${
                        pair.hazardLevel === 'critical' ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {pair.hazardLevel.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] font-mono text-zinc-400">
            Calculated from actual video frame displacement vectors & Time-to-Collision (TTC) dynamics.
          </div>
        </div>

        {/* Secondary Crash Cascade Breakdown */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
                  Cascade Risk Score Breakdown (0-100)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Indian Traffic Weight Matrix
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Factor 1 */}
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Follower Density Factor</span>
                  <span className="text-zinc-400">
                    {isAnalyzing && riskAssessment
                      ? `+${riskAssessment.factors.followerDensityPenalty} pts`
                      : 'Not available'}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${
                        isAnalyzing && riskAssessment
                          ? (riskAssessment.factors.followerDensityPenalty / 30) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Factor 2 */}
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Closing Speed & Low TTC Hazard</span>
                  <span className="text-zinc-400">
                    {isAnalyzing && riskAssessment
                      ? `+${riskAssessment.factors.closingSpeedHazard} pts`
                      : 'Not available'}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{
                      width: `${
                        isAnalyzing && riskAssessment
                          ? (riskAssessment.factors.closingSpeedHazard / 35) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Factor 3 */}
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Vulnerable Two-Wheeler / Auto Exposure</span>
                  <span className="text-zinc-400">
                    {isAnalyzing && riskAssessment
                      ? `+${riskAssessment.factors.vulnerableTwoWheelerRisk} pts`
                      : 'Not available'}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{
                      width: `${
                        isAnalyzing && riskAssessment
                          ? (riskAssessment.factors.vulnerableTwoWheelerRisk / 25) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Factor 4 */}
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Sudden Deceleration / Braking Severity</span>
                  <span className="text-zinc-400">
                    {isAnalyzing && riskAssessment
                      ? `+${riskAssessment.factors.brakingDecelerationSeverity} pts`
                      : 'Not available'}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{
                      width: `${
                        isAnalyzing && riskAssessment
                          ? (riskAssessment.factors.brakingDecelerationSeverity / 35) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">Composite Cascade Risk:</span>
            <span
              className={`font-bold ${
                !isAnalyzing || !riskAssessment
                  ? 'text-zinc-400'
                  : riskAssessment.score >= 70
                  ? 'text-red-400'
                  : riskAssessment.score >= 50
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {isAnalyzing && riskAssessment
                ? `${riskAssessment.score}/100 [${riskAssessment.level}]`
                : 'Not available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
