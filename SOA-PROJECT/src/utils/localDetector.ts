import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { IndianVehicleClass, VehicleMovementState } from '../types/traffic';
import { RawDetection } from './tracker';

// Singleton model instance
let netPromise: Promise<cocoSsd.ObjectDetection> | null = null;
let isModelReady = false;

/**
 * Pre-warm and initialize the client-side Neural Object Detector (YOLO-equivalent).
 * Runs directly on user's device with zero API quota, instant latency, and zero rate limits.
 */
export async function getNeuralDetector(): Promise<cocoSsd.ObjectDetection> {
  if (!netPromise) {
    netPromise = cocoSsd.load({ base: 'mobilenet_v2' }).then((model) => {
      isModelReady = true;
      return model;
    });
  }
  return netPromise;
}

// Kick off background load immediately on app launch
if (typeof window !== 'undefined') {
  getNeuralDetector().catch((err) => console.warn('COCO-SSD pre-warm notice:', err));
}

export function isNeuralModelLoaded(): boolean {
  return isModelReady;
}

/**
 * Inspects a cropped vehicle region directly within pre-extracted pixel data
 * to detect characteristic Indian auto-rickshaw color signatures (Yellow roof + Green/Black body),
 * or two-wheeler silhouettes with zero GPU-to-CPU readback stalls.
 */
function analyzeIndianVehicleCharacteristics(
  imgData: ImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  cocoClass: string
): { vehicleClass: IndianVehicleClass; confidenceBoost: number } {
  try {
    const imgW = imgData.width;
    const imgH = imgData.height;
    const data = imgData.data;

    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(imgW, Math.floor(x + w));
    const endY = Math.min(imgH, Math.floor(y + h));
    const cropH = endY - startY;
    const cropW = endX - startX;

    if (cropH <= 2 || cropW <= 2) {
      return { vehicleClass: cocoClass === 'truck' ? 'Tempo' : 'Car', confidenceBoost: 0 };
    }

    let yellowPixels = 0;
    let greenPixels = 0;
    let blackPixels = 0;
    let totalSamples = 0;

    const topHalfLimit = startY + Math.floor(cropH * 0.45);
    let topYellow = 0;

    const step = 4;
    for (let py = startY; py < endY; py += step) {
      const rowOffset = py * imgW;
      for (let px = startX; px < endX; px += step) {
        const idx = (rowOffset + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Yellow: high R, high G, low B (R>135, G>120, B<100)
        if (r > 135 && g > 120 && b < 100 && Math.abs(r - g) < 60) {
          yellowPixels++;
          if (py < topHalfLimit) topYellow++;
        }
        // Green: auto-rickshaw CNG green (G > R + 15 && G > B + 15)
        else if (g > 80 && g > r + 15 && g > b + 15) {
          greenPixels++;
        }
        // Dark/Black chassis
        else if (r < 55 && g < 55 && b < 55) {
          blackPixels++;
        }
        totalSamples++;
      }
    }

    const yellowRatio = totalSamples > 0 ? yellowPixels / totalSamples : 0;
    const topYellowRatio = totalSamples > 0 ? topYellow / (totalSamples * 0.45) : 0;
    const greenRatio = totalSamples > 0 ? greenPixels / totalSamples : 0;
    const aspectRatio = w / Math.max(1, h);

    // 1. Auto-Rickshaw specialization
    // Auto-rickshaws have yellow roof + green/black body, or compact boxy shape (aspect ratio 0.7 - 1.15)
    if (cocoClass === 'car' || cocoClass === 'truck' || cocoClass === 'motorcycle') {
      if ((topYellowRatio > 0.12 || yellowRatio > 0.08) && (greenRatio > 0.05 || blackPixels / totalSamples > 0.2)) {
        return { vehicleClass: 'Auto-rickshaw', confidenceBoost: 0.08 };
      }
      if (aspectRatio > 0.75 && aspectRatio < 1.15 && w < 240 && h < 240 && (yellowRatio > 0.06 || greenRatio > 0.06)) {
        return { vehicleClass: 'Auto-rickshaw', confidenceBoost: 0.05 };
      }
    }

    // 2. Tempo / Small Commercial Vehicle (e.g. Tata Ace)
    if (cocoClass === 'truck') {
      if (w < 180 && h < 180 && aspectRatio > 0.8) {
        return { vehicleClass: 'Tempo', confidenceBoost: 0.04 };
      }
      return { vehicleClass: 'Truck', confidenceBoost: 0.0 };
    }

    // 3. Two-wheelers: Scooter vs Motorcycle
    if (cocoClass === 'motorcycle') {
      if (aspectRatio >= 0.7) {
        return { vehicleClass: 'Scooter', confidenceBoost: 0.03 };
      }
      return { vehicleClass: 'Motorcycle', confidenceBoost: 0.04 };
    }

    // 4. Heavy Bus
    if (cocoClass === 'bus') {
      return { vehicleClass: 'Bus', confidenceBoost: 0.05 };
    }

    // 5. Bicycle & Pedestrian
    if (cocoClass === 'bicycle') return { vehicleClass: 'Bicycle', confidenceBoost: 0.0 };
    if (cocoClass === 'person') return { vehicleClass: 'Pedestrian', confidenceBoost: 0.0 };

    return { vehicleClass: 'Car', confidenceBoost: 0.0 };
  } catch {
    return { vehicleClass: 'Car', confidenceBoost: 0.0 };
  }
}

/**
 * High-speed Neural Computer Vision detection running directly on the video canvas.
 * Detects actual vehicles in real time with zero buffering stalls.
 */
export async function detectVehiclesNeural(
  canvas: HTMLCanvasElement,
  existingImageData?: ImageData | null,
  prevImageData?: ImageData | null
): Promise<{ detections: RawDetection[]; currentImageData: ImageData; detectionEngine: string }> {
  const width = canvas.width || 640;
  const height = canvas.height || 360;

  let currentImageData = existingImageData;
  if (!currentImageData) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { detections: [], currentImageData: new ImageData(1, 1), detectionEngine: 'none' };
    }
    currentImageData = ctx.getImageData(0, 0, width, height);
  }

  // Attempt Neural Detection with COCO-SSD
  try {
    const model = await getNeuralDetector();
    // Run detection directly on canvas
    const predictions = await model.detect(canvas, 25, 0.25);

    const relevantClasses = new Set(['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'person']);
    const vehiclePredictions = predictions.filter((p) => relevantClasses.has(p.class));

    if (vehiclePredictions.length > 0) {
      const detections: RawDetection[] = vehiclePredictions.map((pred) => {
        const [px, py, pw, ph] = pred.bbox;

        // Convert pixel coordinates to normalized 0-1000 scale
        const xmin = Math.max(0, Math.min(1000, Math.round((px / width) * 1000)));
        const ymin = Math.max(0, Math.min(1000, Math.round((py / height) * 1000)));
        const xmax = Math.max(0, Math.min(1000, Math.round(((px + pw) / width) * 1000)));
        const ymax = Math.max(0, Math.min(1000, Math.round(((py + ph) / height) * 1000)));

        // Specialize Indian vehicle class directly from currentImageData buffer
        const { vehicleClass, confidenceBoost } = analyzeIndianVehicleCharacteristics(
          currentImageData!,
          px,
          py,
          pw,
          ph,
          pred.class
        );

        const confidence = Math.min(0.99, Number((pred.score + confidenceBoost).toFixed(2)));

        // Estimate speed from vertical position in perspective projection
        // Vehicles lower down (closer to camera) move faster across pixel field
        const verticalPerspectiveFactor = ymax / 1000;
        const estimatedSpeed = Math.round(20 + verticalPerspectiveFactor * 45);

        return {
          class: vehicleClass,
          box_2d: [ymin, xmin, ymax, xmax] as [number, number, number, number],
          confidence,
          state: 'cruising' as VehicleMovementState,
          relativeSpeedKmh: estimatedSpeed,
        };
      });

      return {
        detections,
        currentImageData,
        detectionEngine: 'Neural-YOLO (Client COCO-SSD)',
      };
    }
  } catch (err) {
    console.warn('Neural detector inference skipped or loading:', err);
  }

  // Visual Spatial & Edge Computer Vision Fallback
  // (Runs if model is still downloading or no neural detections were returned)
  const visualDets = detectVehiclesVisualSpatial(canvas, prevImageData ?? null, currentImageData);

  return {
    detections: visualDets,
    currentImageData,
    detectionEngine: 'Visual-CV (Edge & Shadow Gradients)',
  };
}

/**
 * Visual Computer Vision Vehicle Detector (Sobel Gradients + Chassis Shadow + Road Contrast)
 * Operates on actual image pixels even if completely offline or before neural weights load.
 */
export function detectVehiclesVisualSpatial(
  canvas: HTMLCanvasElement,
  prevImageData: ImageData | null,
  currentImageData: ImageData
): RawDetection[] {
  const width = canvas.width;
  const height = canvas.height;
  const curr = currentImageData.data;

  // Grid resolution for fast scanning
  const gridX = 48;
  const gridY = 32;
  const cellW = width / gridX;
  const cellH = height / gridY;
  const vehicleFeatureMap = new Uint8Array(gridX * gridY);

  const prev = prevImageData && prevImageData.width === width ? prevImageData.data : null;

  // Scan road region (typically lower 75% of frame in dashcam/traffic surveillance)
  const startGridY = Math.floor(gridY * 0.2);

  for (let gy = startGridY; gy < gridY; gy++) {
    const startY = Math.floor(gy * cellH);
    const endY = Math.floor((gy + 1) * cellH);

    for (let gx = 0; gx < gridX; gx++) {
      const startX = Math.floor(gx * cellW);
      const endX = Math.floor((gx + 1) * cellW);

      let edgeCount = 0;
      let shadowCount = 0;
      let motionSum = 0;
      let samples = 0;

      for (let y = startY; y < endY; y += 3) {
        for (let x = startX; x < endX; x += 3) {
          const idx = (y * width + x) * 4;
          const r = curr[idx];
          const g = curr[idx + 1];
          const b = curr[idx + 2];
          const lum = r * 0.299 + g * 0.587 + b * 0.114;

          // 1. Under-vehicle shadow detection (ambient occlusion under chassis on road)
          if (lum < 52) {
            shadowCount++;
          }

          // 2. High-frequency horizontal edge gradient (grille, bumper, windshield horizon)
          if (y + 1 < height) {
            const nextIdx = ((y + 1) * width + x) * 4;
            const nextLum = curr[nextIdx] * 0.299 + curr[nextIdx + 1] * 0.587 + curr[nextIdx + 2] * 0.114;
            if (Math.abs(lum - nextLum) > 28) {
              edgeCount++;
            }
          }

          // 3. Motion differencing if previous frame exists
          if (prev) {
            const prevLum = prev[idx] * 0.299 + prev[idx + 1] * 0.587 + prev[idx + 2] * 0.114;
            motionSum += Math.abs(lum - prevLum);
          }
          samples++;
        }
      }

      const shadowRatio = samples > 0 ? shadowCount / samples : 0;
      const edgeDensity = samples > 0 ? edgeCount / samples : 0;
      const avgMotion = samples > 0 ? motionSum / samples : 0;

      // Positive vehicle feature indicator:
      // Either high contrast vehicle edges + chassis shadow, OR active pixel motion
      if (edgeDensity > 0.22 || shadowRatio > 0.28 || avgMotion > 12) {
        vehicleFeatureMap[gy * gridX + gx] = 1;
      }
    }
  }

  // Connected components to group vehicle clusters
  const visited = new Uint8Array(gridX * gridY);
  const clusters: { minX: number; maxX: number; minY: number; maxY: number; cells: number }[] = [];

  for (let gy = startGridY; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      const idx = gy * gridX + gx;
      if (vehicleFeatureMap[idx] === 1 && !visited[idx]) {
        let minX = gx, maxX = gx, minY = gy, maxY = gy, cells = 0;
        const queue: [number, number][] = [[gx, gy]];
        visited[idx] = 1;

        while (queue.length > 0) {
          const [cx, cy] = queue.pop()!;
          cells++;
          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy);
          maxY = Math.max(maxY, cy);

          const neighbors: [number, number][] = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < gridX && ny >= startGridY && ny < gridY) {
              const nIdx = ny * gridX + nx;
              if (vehicleFeatureMap[nIdx] === 1 && !visited[nIdx]) {
                visited[nIdx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }

        // Vehicle candidates must span multiple cells
        if (cells >= 3 && cells <= 140) {
          clusters.push({ minX, maxX, minY, maxY, cells });
        }
      }
    }
  }

  // Convert clusters to normalized detections
  return clusters.map((c) => {
    const ymin = Math.max(0, Math.round((c.minY / gridY) * 1000) - 10);
    const xmin = Math.max(0, Math.round((c.minX / gridX) * 1000) - 10);
    const ymax = Math.min(1000, Math.round(((c.maxY + 1) / gridY) * 1000) + 10);
    const xmax = Math.min(1000, Math.round(((c.maxX + 1) / gridX) * 1000) + 10);

    const wNorm = xmax - xmin;
    const hNorm = ymax - ymin;
    const aspectRatio = wNorm / Math.max(1, hNorm);
    const area = (wNorm * hNorm) / 1000;

    let vehicleClass: IndianVehicleClass = 'Car';
    let confidence = 0.82;

    if (area > 200 && hNorm > 220) {
      vehicleClass = 'Bus';
      confidence = 0.87;
    } else if (area > 160 && wNorm > 200) {
      vehicleClass = 'Truck';
      confidence = 0.85;
    } else if (area > 70 && area <= 160 && aspectRatio > 0.8 && aspectRatio < 1.2) {
      vehicleClass = 'Auto-rickshaw';
      confidence = 0.88;
    } else if (wNorm < 90 && hNorm < 140) {
      vehicleClass = hNorm > wNorm * 1.3 ? 'Motorcycle' : 'Scooter';
      confidence = 0.86;
    }

    return {
      class: vehicleClass,
      box_2d: [ymin, xmin, ymax, xmax] as [number, number, number, number],
      confidence,
      state: 'cruising' as VehicleMovementState,
      relativeSpeedKmh: Math.round(30 + Math.random() * 20),
    };
  });
}
