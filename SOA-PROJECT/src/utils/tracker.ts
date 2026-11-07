import {
  DetectedVehicle,
  IndianVehicleClass,
  TrajectoryPoint,
  VehicleInteractionPair,
  CascadeRiskAssessment,
  VehicleMovementState,
} from '../types/traffic';
import { getVehicleColor } from './colors';

export interface RawDetection {
  class: IndianVehicleClass;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 range
  confidence: number;
  state?: VehicleMovementState;
  relativeSpeedKmh?: number;
}

export class OpenCVVehicleTracker {
  private activeTracks: Map<string, DetectedVehicle> = new Map();
  private nextIdNumber: number = 1;
  private maxDisappearedFrames: number = 15;
  private disappearedCount: Map<string, number> = new Map();
  private maxTrajectoryLength: number = 40;

  public reset() {
    this.activeTracks.clear();
    this.disappearedCount.clear();
    this.nextIdNumber = 1;
  }

  // Calculate IoU (Intersection over Union) between two [ymin, xmin, ymax, xmax] boxes
  private calculateIoU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
    const yminA = boxA[0], xminA = boxA[1], ymaxA = boxA[2], xmaxA = boxA[3];
    const yminB = boxB[0], xminB = boxB[1], ymaxB = boxB[2], xmaxB = boxB[3];

    const yminIntersect = Math.max(yminA, yminB);
    const xminIntersect = Math.max(xminA, xminB);
    const ymaxIntersect = Math.min(ymaxA, ymaxB);
    const xmaxIntersect = Math.min(xmaxA, xmaxB);

    const intersectWidth = Math.max(0, xmaxIntersect - xminIntersect);
    const intersectHeight = Math.max(0, ymaxIntersect - yminIntersect);
    const intersectArea = intersectWidth * intersectHeight;

    const areaA = (xmaxA - xminA) * (ymaxA - yminA);
    const areaB = (xmaxB - xminB) * (ymaxB - yminB);
    const unionArea = areaA + areaB - intersectArea;

    if (unionArea <= 0) return 0;
    return intersectArea / unionArea;
  }

  // Calculate Centroid distance between two boxes (normalized 0-1000)
  private calculateCentroidDistance(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
    const cAx = (boxA[1] + boxA[3]) / 2;
    const cAy = (boxA[0] + boxA[2]) / 2;
    const cBx = (boxB[1] + boxB[3]) / 2;
    const cBy = (boxB[0] + boxB[2]) / 2;
    return Math.hypot(cAx - cBx, cAy - cBy);
  }

  /**
   * Updates tracking states with new frame detections.
   * Maintains persistent IDs, trajectories, velocity vectors, and braking state.
   */
  public update(
    rawDetections: RawDetection[],
    frameNumber: number,
    timestamp: number,
    fps: number = 30
  ): DetectedVehicle[] {
    const currentTrackIds = Array.from(this.activeTracks.keys());
    const matchedTrackIds = new Set<string>();
    const matchedDetectionIndices = new Set<number>();

    // 1. Associate existing tracks with new detections via IoU + Centroid proximity
    const costMatrix: { trackId: string; detIndex: number; score: number }[] = [];

    for (const trackId of currentTrackIds) {
      const track = this.activeTracks.get(trackId)!;
      for (let i = 0; i < rawDetections.length; i++) {
        const det = rawDetections[i];
        const iou = this.calculateIoU(track.box_2d, det.box_2d);
        const dist = this.calculateCentroidDistance(track.box_2d, det.box_2d);

        // Cost score combines IoU and centroid distance
        let affinity = iou * 0.7 + Math.max(0, 1 - dist / 300) * 0.3;
        // Same vehicle class bonus
        if (track.class === det.class) affinity += 0.2;

        if (affinity > 0.25) {
          costMatrix.push({ trackId, detIndex: i, score: affinity });
        }
      }
    }

    // Sort cost matrix highest affinity first (greedy matching)
    costMatrix.sort((a, b) => b.score - a.score);

    for (const match of costMatrix) {
      if (matchedTrackIds.has(match.trackId) || matchedDetectionIndices.has(match.detIndex)) {
        continue;
      }

      const track = this.activeTracks.get(match.trackId)!;
      const det = rawDetections[match.detIndex];

      matchedTrackIds.add(match.trackId);
      matchedDetectionIndices.add(match.detIndex);

      // Reset disappeared count
      this.disappearedCount.set(match.trackId, 0);

      // Compute displacement and kinematics
      const oldCentroid = track.centroid;
      const newCentroid = {
        x: (det.box_2d[1] + det.box_2d[3]) / 2,
        y: (det.box_2d[0] + det.box_2d[2]) / 2,
      };

      const dx = newCentroid.x - oldCentroid.x;
      const dy = newCentroid.y - oldCentroid.y;
      const dt = Math.max(0.016, 1 / (fps || 30));

      // Proxy speed (0-1000 coord delta scaled to realistic km/h)
      const pixelDist = Math.hypot(dx, dy);
      const estimatedSpeedKmh = Math.max(
        5,
        Math.min(110, det.relativeSpeedKmh ?? Math.round(pixelDist * 3.6))
      );

      // Acceleration calculation
      const prevSpeed = track.relativeSpeedKmh || estimatedSpeedKmh;
      const speedDelta = estimatedSpeedKmh - prevSpeed;
      const acceleration = Number((speedDelta / dt).toFixed(1)); // km/h/s proxy

      // Sudden braking check in Indian traffic context
      const isSuddenBraking = acceleration < -10 || det.state === 'sudden_braking';
      // Lateral lane weaving check (very common in Indian two-wheelers filtering through traffic)
      const isWeaving = Math.abs(dx) > Math.abs(dy) * 1.6 && Math.abs(dx) > 10;

      let state: VehicleMovementState = 'cruising';
      if (isSuddenBraking) state = 'sudden_braking';
      else if (isWeaving) state = 'lane_weaving';
      else if (estimatedSpeedKmh < 4) state = 'stopped';
      else if (det.state) state = det.state;

      // Update trajectory
      const newTrajectoryPoint: TrajectoryPoint = {
        x: newCentroid.x,
        y: newCentroid.y,
        frame: frameNumber,
        timestamp,
      };

      const updatedTrajectory = [...track.trajectory, newTrajectoryPoint];
      if (updatedTrajectory.length > this.maxTrajectoryLength) {
        updatedTrajectory.shift();
      }

      // Smooth coordinate update with exponential smoothing to prevent visual jitter
      const smoothAlpha = 0.85; // Prioritize fresh detection
      const smoothedBox: [number, number, number, number] = [
        Math.round(track.box_2d[0] * (1 - smoothAlpha) + det.box_2d[0] * smoothAlpha),
        Math.round(track.box_2d[1] * (1 - smoothAlpha) + det.box_2d[1] * smoothAlpha),
        Math.round(track.box_2d[2] * (1 - smoothAlpha) + det.box_2d[2] * smoothAlpha),
        Math.round(track.box_2d[3] * (1 - smoothAlpha) + det.box_2d[3] * smoothAlpha),
      ];

      // Update track
      this.activeTracks.set(match.trackId, {
        ...track,
        class: det.class,
        box_2d: smoothedBox,
        confidence: Math.max(track.confidence, det.confidence),
        centroid: {
          x: (smoothedBox[1] + smoothedBox[3]) / 2,
          y: (smoothedBox[0] + smoothedBox[2]) / 2,
        },
        state,
        relativeSpeedKmh: estimatedSpeedKmh,
        acceleration,
        isSuddenBraking,
        isWeaving,
        trajectory: updatedTrajectory,
      });
    }

    // 2. Unmatched existing tracks -> increment disappeared
    for (const trackId of currentTrackIds) {
      if (!matchedTrackIds.has(trackId)) {
        const count = (this.disappearedCount.get(trackId) || 0) + 1;
        this.disappearedCount.set(trackId, count);

        // Keep tracks alive longer so vehicles don't flicker away
        if (count > 25) {
          this.activeTracks.delete(trackId);
          this.disappearedCount.delete(trackId);
        }
      }
    }

    // 3. Unmatched detections -> create new tracks with fresh ID
    for (let i = 0; i < rawDetections.length; i++) {
      if (!matchedDetectionIndices.has(i)) {
        const det = rawDetections[i];
        const newId = `V-${String(this.nextIdNumber++).padStart(2, '0')}`;
        const centroid = {
          x: (det.box_2d[1] + det.box_2d[3]) / 2,
          y: (det.box_2d[0] + det.box_2d[2]) / 2,
        };

        const initialTrack: DetectedVehicle = {
          id: newId,
          class: det.class,
          box_2d: det.box_2d,
          confidence: det.confidence,
          state: det.state || 'cruising',
          relativeSpeedKmh: det.relativeSpeedKmh || 32,
          acceleration: 0,
          centroid,
          color: getVehicleColor(det.class),
          trajectory: [{ ...centroid, frame: frameNumber, timestamp }],
        };

        this.activeTracks.set(newId, initialTrack);
        this.disappearedCount.set(newId, 0);
      }
    }

    // Return current active tracks as array
    return Array.from(this.activeTracks.values());
  }

  /**
   * Tracks active vehicles between server YOLOv11 frames using actual pixel optical patch matching.
   * Directly follows the movement of vehicles on the uploaded footage frame-by-frame.
   */
  public trackWithOpticalMotion(
    currentImageData: ImageData,
    prevImageData: ImageData,
    frameNumber: number,
    timestamp: number
  ): DetectedVehicle[] {
    const tracks = Array.from(this.activeTracks.values());
    if (tracks.length === 0) return [];

    const width = currentImageData.width;
    const height = currentImageData.height;
    const curr = currentImageData.data;
    const prev = prevImageData.data;

    for (const track of tracks) {
      const [ymin, xmin, ymax, xmax] = track.box_2d;
      // Convert normalized coordinates (0-1000) to actual pixel bounds
      const pxMinX = Math.max(0, Math.floor((xmin / 1000) * width));
      const pxMaxX = Math.min(width - 1, Math.ceil((xmax / 1000) * width));
      const pxMinY = Math.max(0, Math.floor((ymin / 1000) * height));
      const pxMaxY = Math.min(height - 1, Math.ceil((ymax / 1000) * height));

      const boxW = pxMaxX - pxMinX;
      const boxH = pxMaxY - pxMinY;
      if (boxW < 8 || boxH < 8) continue;

      // Sample interior points of the vehicle (central 60% of bounding box)
      const sampleMinX = Math.floor(pxMinX + boxW * 0.2);
      const sampleMaxX = Math.floor(pxMaxX - boxW * 0.2);
      const sampleMinY = Math.floor(pxMinY + boxH * 0.2);
      const sampleMaxY = Math.floor(pxMaxY - boxH * 0.2);

      // Block-matching optical flow search in a local window [-12 to +12 pixels]
      let bestDx = 0;
      let bestDy = 0;
      let minDifference = Infinity;

      const searchRange = 10;
      const step = 4; // Fast sub-sampled block difference

      for (let sdy = -searchRange; sdy <= searchRange; sdy += 2) {
        for (let sdx = -searchRange; sdx <= searchRange; sdx += 2) {
          let diffSum = 0;
          let samples = 0;

          for (let y = sampleMinY; y < sampleMaxY; y += step) {
            const ny = y + sdy;
            if (ny < 0 || ny >= height) continue;

            for (let x = sampleMinX; x < sampleMaxX; x += step) {
              const nx = x + sdx;
              if (nx < 0 || nx >= width) continue;

              const prevIdx = (y * width + x) * 4;
              const currIdx = (ny * width + nx) * 4;

              const lumPrev = prev[prevIdx] * 0.299 + prev[prevIdx + 1] * 0.587 + prev[prevIdx + 2] * 0.114;
              const lumCurr = curr[currIdx] * 0.299 + curr[currIdx + 1] * 0.587 + curr[currIdx + 2] * 0.114;

              diffSum += Math.abs(lumPrev - lumCurr);
              samples++;
            }
          }

          if (samples > 0) {
            const avgDiff = diffSum / samples;
            if (avgDiff < minDifference) {
              minDifference = avgDiff;
              bestDx = sdx;
              bestDy = sdy;
            }
          }
        }
      }

      // If good matching found, convert pixel delta to 0-1000 normalized delta
      if (minDifference < 45 && (bestDx !== 0 || bestDy !== 0)) {
        const normDx = (bestDx / width) * 1000;
        const normDy = (bestDy / height) * 1000;

        // Apply clamped displacement to stay locked on vehicle
        const clampedDx = Math.max(-15, Math.min(15, normDx));
        const clampedDy = Math.max(-15, Math.min(15, normDy));

        const newBox: [number, number, number, number] = [
          Math.max(0, Math.min(970, Math.round(track.box_2d[0] + clampedDy))),
          Math.max(0, Math.min(970, Math.round(track.box_2d[1] + clampedDx))),
          Math.max(30, Math.min(1000, Math.round(track.box_2d[2] + clampedDy))),
          Math.max(30, Math.min(1000, Math.round(track.box_2d[3] + clampedDx))),
        ];

        track.box_2d = newBox;
        track.centroid = {
          x: (newBox[1] + newBox[3]) / 2,
          y: (newBox[0] + newBox[2]) / 2,
        };

        track.trajectory.push({
          x: track.centroid.x,
          y: track.centroid.y,
          frame: frameNumber,
          timestamp,
        });

        if (track.trajectory.length > this.maxTrajectoryLength) {
          track.trajectory.shift();
        }
      }
    }

    return tracks;
  }

  /**
   * Extrapolates tracked positions between server-side AI detection frames (interpolator)
   */
  public interpolateTracks(frameNumber: number, timestamp: number): DetectedVehicle[] {
    const tracks = Array.from(this.activeTracks.values());
    for (const track of tracks) {
      if (track.trajectory.length >= 2) {
        const last = track.trajectory[track.trajectory.length - 1];
        const secondLast = track.trajectory[track.trajectory.length - 2];
        // Bounded micro-step to avoid drifting off-screen
        const dx = Math.max(-4, Math.min(4, (last.x - secondLast.x) * 0.15));
        const dy = Math.max(-4, Math.min(4, (last.y - secondLast.y) * 0.15));

        const newBox: [number, number, number, number] = [
          Math.max(0, Math.min(960, track.box_2d[0] + dy)),
          Math.max(0, Math.min(960, track.box_2d[1] + dx)),
          Math.max(40, Math.min(1000, track.box_2d[2] + dy)),
          Math.max(40, Math.min(1000, track.box_2d[3] + dx)),
        ];

        track.box_2d = newBox;
        track.centroid = {
          x: (newBox[1] + newBox[3]) / 2,
          y: (newBox[0] + newBox[2]) / 2,
        };

        track.trajectory.push({
          x: track.centroid.x,
          y: track.centroid.y,
          frame: frameNumber,
          timestamp,
        });
        if (track.trajectory.length > this.maxTrajectoryLength) {
          track.trajectory.shift();
        }
      }
    }
    return tracks;
  }
}

/**
 * Calculates Secondary Accident Cascade Risk Analysis for Indian Traffic
 */
export function analyzeCascadeDynamics(
  vehicles: DetectedVehicle[],
  frameNumber: number,
  timestamp: number
): CascadeRiskAssessment {
  if (!vehicles || vehicles.length === 0) {
    return {
      score: 0,
      level: 'SAFE',
      density: 'light',
      primaryHazard: 'No vehicles detected in current frame.',
      hazardPairs: [],
      affectedVehicleIds: [],
      earlyWarningTriggered: false,
      timestamp,
      frameNumber,
      factors: {
        followerDensityPenalty: 0,
        closingSpeedHazard: 0,
        vulnerableTwoWheelerRisk: 0,
        brakingDecelerationSeverity: 0,
      },
    };
  }

  const hazardPairs: VehicleInteractionPair[] = [];
  let maxRisk = 12;
  let followerCount = 0;
  let suddenBrakingCount = 0;
  let twoWheelerCount = 0;
  let affectedIds = new Set<string>();

  // Check each pair of vehicles
  for (let i = 0; i < vehicles.length; i++) {
    const v1 = vehicles[i];
    if (v1.isSuddenBraking) suddenBrakingCount++;
    if (['Motorcycle', 'Scooter', 'Auto-rickshaw'].includes(v1.class)) twoWheelerCount++;

    for (let j = i + 1; j < vehicles.length; j++) {
      const v2 = vehicles[j];

      // Distance in 0-1000 normalized space
      const dist = Math.hypot(v1.centroid.x - v2.centroid.x, v1.centroid.y - v2.centroid.y);
      const relSpeed = Math.abs((v1.relativeSpeedKmh || 35) - (v2.relativeSpeedKmh || 35));

      // Estimated Time to Collision (TTC)
      // When two vehicles are close in longitudinal axis
      const longitudinalDist = Math.abs(v1.centroid.y - v2.centroid.y);
      const lateralDist = Math.abs(v1.centroid.x - v2.centroid.x);

      let ttc = 9.9;
      if (longitudinalDist < 250 && lateralDist < 160) {
        ttc = relSpeed > 4 ? Number((longitudinalDist / (relSpeed * 2.8)).toFixed(1)) : 4.5;
      }

      // Proximity threshold
      if (dist < 280) {
        followerCount++;
        let pairScore = 15;

        // Proximity penalty
        if (dist < 100) pairScore += 45;
        else if (dist < 180) pairScore += 25;
        else pairScore += 10;

        // TTC hazard
        if (ttc < 1.2) pairScore += 30;
        else if (ttc < 2.0) pairScore += 18;

        // Sudden braking trigger
        const isBrakeHazard = v1.isSuddenBraking || v2.isSuddenBraking;
        if (isBrakeHazard) pairScore += 25;

        // Two-wheeler sandwiched behind heavy vehicle (Indian highway/city high risk)
        const isTwoWheelerA = ['Motorcycle', 'Scooter', 'Auto-rickshaw'].includes(v1.class);
        const isTwoWheelerB = ['Motorcycle', 'Scooter', 'Auto-rickshaw'].includes(v2.class);
        const isHeavyA = ['Bus', 'Truck'].includes(v1.class);
        const isHeavyB = ['Bus', 'Truck'].includes(v2.class);

        if ((isTwoWheelerA && isHeavyB) || (isTwoWheelerB && isHeavyA)) {
          pairScore += 20;
        }

        pairScore = Math.min(98, pairScore);
        if (pairScore > maxRisk) {
          maxRisk = pairScore;
        }

        let hazardLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (pairScore >= 75) hazardLevel = 'critical';
        else if (pairScore >= 55) hazardLevel = 'high';
        else if (pairScore >= 35) hazardLevel = 'medium';

        let hazardType = 'Dense Traffic Proximity';
        if (isBrakeHazard && (isTwoWheelerA || isTwoWheelerB)) {
          hazardType = 'Sudden Braking with Vulnerable Two-Wheeler in Wake';
        } else if (isBrakeHazard) {
          hazardType = 'Downstream Deceleration Shockwave';
        } else if (ttc < 1.5) {
          hazardType = 'Critical Time-To-Collision (TTC < 1.5s)';
        } else if ((isTwoWheelerA && isHeavyB) || (isTwoWheelerB && isHeavyA)) {
          hazardType = 'Heavy Vehicle vs Auto/Two-Wheeler Pinch Zone';
        }

        if (hazardLevel !== 'low') {
          affectedIds.add(v1.id);
          affectedIds.add(v2.id);
        }

        hazardPairs.push({
          vehicleA: v1.id,
          vehicleB: v2.id,
          classA: v1.class,
          classB: v2.class,
          distancePx: Math.round(dist),
          distanceNorm: Math.round(dist),
          relativeSpeedKmh: Math.round(relSpeed),
          ttcSeconds: ttc,
          hazardLevel,
          hazardType,
        });
      }
    }
  }

  // Density factor
  let density: 'light' | 'moderate' | 'dense' | 'congested' = 'light';
  if (vehicles.length >= 8) density = 'congested';
  else if (vehicles.length >= 5) density = 'dense';
  else if (vehicles.length >= 3) density = 'moderate';

  // Overall Cascade Risk Level
  let level: 'SAFE' | 'ADVISORY' | 'WATCH' | 'CRITICAL' = 'SAFE';
  if (maxRisk >= 75) level = 'CRITICAL';
  else if (maxRisk >= 55) level = 'WATCH';
  else if (maxRisk >= 35) level = 'ADVISORY';

  const earlyWarningTriggered = level === 'CRITICAL' || level === 'WATCH';

  let primaryHazard = 'Normal Indian traffic flow. Safe stopping distance maintained.';
  if (level === 'CRITICAL') {
    const topPair = hazardPairs.sort((a, b) => (b.hazardLevel === 'critical' ? 1 : -1))[0];
    primaryHazard = topPair
      ? `CRITICAL CASCADE ALERT: ${topPair.hazardType} between ${topPair.vehicleA} [${topPair.classA}] and ${topPair.vehicleB} [${topPair.classB}] (TTC: ${topPair.ttcSeconds}s)!`
      : 'CRITICAL CASCADE ALERT: High deceleration wave detected across following vehicles.';
  } else if (level === 'WATCH') {
    primaryHazard = 'WATCH: Dense mixed traffic corridor with reduced headway between two-wheelers and heavy vehicles.';
  } else if (level === 'ADVISORY') {
    primaryHazard = 'ADVISORY: Minor speed differentials and lane filtering observed.';
  }

  return {
    score: maxRisk,
    level,
    density,
    primaryHazard,
    hazardPairs: hazardPairs.sort((a, b) => b.relativeSpeedKmh - a.relativeSpeedKmh),
    affectedVehicleIds: Array.from(affectedIds),
    earlyWarningTriggered,
    timestamp,
    frameNumber,
    factors: {
      followerDensityPenalty: Math.min(30, followerCount * 6),
      closingSpeedHazard: Math.min(35, Math.round(maxRisk * 0.4)),
      vulnerableTwoWheelerRisk: Math.min(25, twoWheelerCount * 5),
      brakingDecelerationSeverity: Math.min(35, suddenBrakingCount * 25),
    },
  };
}
