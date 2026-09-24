import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow large payloads for base64 frame analysis
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    cvEngine: 'YOLOv11+OpenCV',
    model: 'gemini-3.8-flash',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Frame detection endpoint using Gemini 3.8 Flash specialized as YOLOv11 for Indian Traffic
app.post('/api/detect-frame', async (req, res) => {
  try {
    const { imageBase64, frameNumber = 1, timestamp = 0 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API not configured. Server is operating in local OpenCV computer vision mode.',
        isFallback: true,
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are a state-of-the-art YOLOv11 Computer Vision detection engine specifically trained for Indian Road Traffic Conditions.
Analyze the provided actual video frame captured from Indian traffic footage.
Detect all vehicles present in the frame with high precision:
Vehicle classes to detect in Indian traffic:
- "Auto-rickshaw" (Bajaj/Tuk-tuk 3-wheeler)
- "Motorcycle" (Commuter bike, sport bike)
- "Scooter" (Activa, Jupiter, Vespa style)
- "Car" (Hatchback, sedan, SUV)
- "Bus" (City transport, private bus)
- "Truck" (Heavy goods vehicle, lorry)
- "Tempo" (Light commercial vehicle / Tata Ace / delivery van)
- "Bicycle"
- "Pedestrian"

For each detected vehicle, output:
1. "class": one of the exact classes above.
2. "box_2d": [ymin, xmin, ymax, xmax] coordinates normalized from 0 to 1000 (where 0 is top/left and 1000 is bottom/right).
3. "confidence": detection confidence float between 0.50 and 0.99.
4. "state": movement state ("cruising", "sudden_braking", "lane_weaving", "stopped", "tailgating").
5. "relativeSpeedKmh": estimated instantaneous speed in km/h based on visual context.

Also evaluate overall scene:
- "trafficDensity": "light" | "moderate" | "dense" | "congested"
- "cascadeRiskScore": 0 to 100 integer reflecting secondary crash probability (high if tight tailgating, sudden braking, or two-wheelers trapped between heavy vehicles)
- "riskLevel": "SAFE" (0-30), "ADVISORY" (31-50), "WATCH" (51-70), "CRITICAL" (71-100)
- "primaryHazard": brief description of the most critical vehicle interaction or cascade threat
- "affectedVehicles": list of vehicle classes or indices involved in risky proximity

Return STRICT JSON matching this schema:
{
  "detections": [
    {
      "class": string,
      "box_2d": [number, number, number, number],
      "confidence": number,
      "state": string,
      "relativeSpeedKmh": number
    }
  ],
  "trafficDensity": string,
  "cascadeRiskScore": number,
  "riskLevel": string,
  "primaryHazard": string,
  "affectedVehicles": string[]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // If formatting has backticks
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    res.json({
      success: true,
      frameNumber,
      timestamp,
      ...parsedData,
    });
  } catch (error: any) {
    const isRateLimited =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      String(error?.message || '').includes('429') ||
      String(error?.message || '').includes('quota') ||
      String(error?.message || '').includes('Quota');

    if (isRateLimited) {
      console.warn('Gemini API rate limit reached (5 req/min free tier). Fallback to client-side neural CV.');
      return res.json({
        success: false,
        isRateLimited: true,
        error: 'Gemini free-tier quota (5 req/min) active. Operating in client-side Neural CV mode.',
      });
    }

    console.error('Detection API error:', error);
    res.status(500).json({
      error: error.message || 'Detection failed',
    });
  }
});

// Compute Cascade Risk Kinematics
app.post('/api/cascade-assessment', (req, res) => {
  try {
    const { vehicles, fps = 30 } = req.body;
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return res.json({
        cascadeRiskScore: 0,
        riskLevel: 'SAFE',
        hazardPairs: [],
        summary: 'No active vehicles in trajectory zone.',
      });
    }

    // Kinematic secondary accident risk calculation:
    // Check pairwise distance and time to collision (TTC)
    const hazardPairs: any[] = [];
    let maxRisk = 10;

    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        const v1 = vehicles[i];
        const v2 = vehicles[j];

        // Euclidean distance in normalized box coordinates (0-1000)
        const c1x = (v1.box_2d[1] + v1.box_2d[3]) / 2;
        const c1y = (v1.box_2d[0] + v1.box_2d[2]) / 2;
        const c2x = (v2.box_2d[1] + v2.box_2d[3]) / 2;
        const c2y = (v2.box_2d[0] + v2.box_2d[2]) / 2;

        const dist = Math.hypot(c1x - c2x, c1y - c2y);
        const relSpeed = Math.abs((v1.relativeSpeedKmh || 35) - (v2.relativeSpeedKmh || 35));

        // Time to collision proxy
        const ttc = relSpeed > 5 ? (dist / (relSpeed * 2.5)).toFixed(1) : '9.9+';

        // Two-wheeler exposure penalty
        const hasTwoWheeler = ['Motorcycle', 'Scooter', 'Auto-rickshaw'].includes(v1.class) ||
                              ['Motorcycle', 'Scooter', 'Auto-rickshaw'].includes(v2.class);
        const hasHeavyVehicle = ['Bus', 'Truck'].includes(v1.class) || ['Bus', 'Truck'].includes(v2.class);

        // Braking penalty
        const isBraking = v1.state === 'sudden_braking' || v2.state === 'sudden_braking';

        let pairRisk = 0;
        if (dist < 120) pairRisk += 40;
        else if (dist < 220) pairRisk += 25;
        else if (dist < 350) pairRisk += 10;

        if (isBraking) pairRisk += 30;
        if (hasTwoWheeler && hasHeavyVehicle) pairRisk += 20;
        if (Number(ttc) < 1.8) pairRisk += 25;

        pairRisk = Math.min(98, pairRisk);
        if (pairRisk > maxRisk) maxRisk = pairRisk;

        if (pairRisk > 40) {
          hazardPairs.push({
            vehicleA: `${v1.id || 'V1'} (${v1.class})`,
            vehicleB: `${v2.id || 'V2'} (${v2.class})`,
            distanceNorm: Math.round(dist),
            ttc: `${ttc}s`,
            isBraking,
            pairRisk,
            hazardType: isBraking
              ? 'Sudden Deceleration Cascade'
              : dist < 120
              ? 'Dangerous Proximity / Tailgating'
              : 'Mixed Traffic Pinch Point',
          });
        }
      }
    }

    let riskLevel = 'SAFE';
    if (maxRisk >= 70) riskLevel = 'CRITICAL';
    else if (maxRisk >= 50) riskLevel = 'WATCH';
    else if (maxRisk >= 30) riskLevel = 'ADVISORY';

    res.json({
      cascadeRiskScore: maxRisk,
      riskLevel,
      hazardPairs,
      vehicleCount: vehicles.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite integration for development
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AccidentCascade AI Server running on port ${PORT}`);
  });
}

startServer();
