export type IndianVehicleClass =
  | 'Auto-rickshaw'
  | 'Motorcycle'
  | 'Scooter'
  | 'Car'
  | 'Bus'
  | 'Truck'
  | 'Tempo'
  | 'Bicycle'
  | 'Pedestrian';

export type VehicleMovementState =
  | 'cruising'
  | 'sudden_braking'
  | 'lane_weaving'
  | 'stopped'
  | 'tailgating';

export interface BoundingBox2D {
  // Normalized 0 to 1000
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface TrajectoryPoint {
  x: number; // Normalized 0-1000 or pixels
  y: number;
  frame: number;
  timestamp: number;
}

export interface DetectedVehicle {
  id: string; // e.g. "V-01"
  class: IndianVehicleClass;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence: number; // 0.0 to 1.0
  state: VehicleMovementState;
  relativeSpeedKmh: number;
  acceleration?: number; // m/s^2 or px/frame^2
  trajectory: TrajectoryPoint[];
  centroid: { x: number; y: number };
  color: string;
  nearestNeighborDistance?: number;
  nearestNeighborId?: string;
  isSuddenBraking?: boolean;
  isWeaving?: boolean;
}

export interface VehicleInteractionPair {
  vehicleA: string;
  vehicleB: string;
  classA: IndianVehicleClass;
  classB: IndianVehicleClass;
  distancePx: number;
  distanceNorm: number;
  relativeSpeedKmh: number;
  ttcSeconds: number; // Time-to-Collision
  hazardLevel: 'low' | 'medium' | 'high' | 'critical';
  hazardType: string;
}

export interface CascadeRiskAssessment {
  score: number; // 0 to 100
  level: 'SAFE' | 'ADVISORY' | 'WATCH' | 'CRITICAL';
  density: 'light' | 'moderate' | 'dense' | 'congested';
  primaryHazard: string;
  hazardPairs: VehicleInteractionPair[];
  affectedVehicleIds: string[];
  earlyWarningTriggered: boolean;
  timestamp: number;
  frameNumber: number;
  factors: {
    followerDensityPenalty: number;
    closingSpeedHazard: number;
    vulnerableTwoWheelerRisk: number;
    brakingDecelerationSeverity: number;
  };
}

export interface VideoMetadata {
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  url: string;
  file?: File;
}

export interface ProcessingStats {
  frameNumber: number;
  totalFramesEstimated: number;
  fps: number;
  processingTimeMs: number;
  detectedCount: number;
  activeTrackedCount: number;
  status: 'idle' | 'waiting' | 'processing' | 'paused' | 'completed' | 'error';
  lastDetectionSource: 'YOLOv11-Server' | 'OpenCV-Tracker' | 'Hybrid' | 'None';
}
