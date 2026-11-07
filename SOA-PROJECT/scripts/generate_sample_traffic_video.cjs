const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, '../public/videos'), { recursive: true });

const width = 640;
const height = 360;
const fps = 30;
const durationSec = 14;
const totalFrames = fps * durationSec;
const targetPath = path.join(__dirname, '../public/videos/indian_traffic_sample.mp4');

const ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'rawvideo',
  '-pixel_format', 'rgb24',
  '-video_size', `${width}x${height}`,
  '-framerate', `${fps}`,
  '-i', '-',
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '22',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  targetPath,
]);

ffmpeg.stderr.on('data', () => {});
ffmpeg.on('close', (code) => {
  console.log(`FFmpeg generated ${targetPath} with exit code ${code}`);
  if (fs.existsSync(targetPath)) {
    console.log(`Video size: ${fs.statSync(targetPath).size} bytes`);
  }
});

// Indian traffic vehicles definition
const vehicles = [
  // 1. Tata City Bus
  { type: 'Bus', x: 260, y: -120, speed: 2.6, w: 64, h: 128, color: [130, 80, 230], isBraking: false },
  // 2. Bajaj Auto-Rickshaw (Yellow roof, green body)
  { type: 'Auto-rickshaw', x: 195, y: 140, speed: 3.2, w: 36, h: 48, color: [245, 166, 35], isBraking: false },
  // 3. White Sedan (Car)
  { type: 'Car', x: 380, y: 30, speed: 3.8, w: 46, h: 80, color: [235, 235, 240], isBraking: false },
  // 4. Motorcycle commuter with rider
  { type: 'Motorcycle', x: 335, y: 220, speed: 4.4, w: 20, h: 36, color: [14, 165, 233], isBraking: false },
  // 5. Tata Ace / Tempo (Orange delivery truck)
  { type: 'Tempo', x: 190, y: 290, speed: 2.9, w: 40, h: 62, color: [249, 115, 22], isBraking: false },
  // 6. Red Hatchback (Car)
  { type: 'Car', x: 268, y: 350, speed: 3.5, w: 44, h: 76, color: [220, 38, 38], isBraking: false },
  // 7. Scooter
  { type: 'Scooter', x: 390, y: 240, speed: 4.0, w: 18, h: 32, color: [16, 185, 129], isBraking: false },
];

function setPixel(buf, x, y, r, g, b) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (Math.floor(y) * width + Math.floor(x)) * 3;
  buf[idx] = r;
  buf[idx + 1] = g;
  buf[idx + 2] = b;
}

function fillRect(buf, rx, ry, rw, rh, r, g, b) {
  const x1 = Math.max(0, Math.floor(rx));
  const y1 = Math.max(0, Math.floor(ry));
  const x2 = Math.min(width, Math.floor(rx + rw));
  const y2 = Math.min(height, Math.floor(ry + rh));
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const idx = (y * width + x) * 3;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
    }
  }
}

function fillEllipse(buf, cx, cy, rx, ry, r, g, b, alpha = 0.5) {
  const x1 = Math.max(0, Math.floor(cx - rx));
  const y1 = Math.max(0, Math.floor(cy - ry));
  const x2 = Math.min(width, Math.floor(cx + rx));
  const y2 = Math.min(height, Math.floor(cy + ry));
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        const idx = (y * width + x) * 3;
        buf[idx] = Math.round(buf[idx] * (1 - alpha) + r * alpha);
        buf[idx + 1] = Math.round(buf[idx + 1] * (1 - alpha) + g * alpha);
        buf[idx + 2] = Math.round(buf[idx + 2] * (1 - alpha) + b * alpha);
      }
    }
  }
}

for (let frame = 0; frame < totalFrames; frame++) {
  const frameBuf = Buffer.alloc(width * height * 3);

  // 1. Road background (Asphalt with subtle texture)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      // Roadside greenery / footpath on left (<135) and right (>495)
      if (x < 135) {
        frameBuf[idx] = 45;
        frameBuf[idx + 1] = 60;
        frameBuf[idx + 2] = 40;
      } else if (x > 495) {
        frameBuf[idx] = 45;
        frameBuf[idx + 1] = 60;
        frameBuf[idx + 2] = 40;
      } else {
        // Dark asphalt with subtle noise
        const noise = ((x * 17 + y * 23 + frame * 3) % 9) - 4;
        const c = Math.max(30, Math.min(55, 42 + noise));
        frameBuf[idx] = c;
        frameBuf[idx + 1] = c + 1;
        frameBuf[idx + 2] = c + 3;
      }
    }
  }

  // 2. Road Kerbs (Indian yellow-black alternating curb stones)
  for (let y = 0; y < height; y++) {
    const isYellow = Math.floor((y + frame * 3) / 24) % 2 === 0;
    const kr = isYellow ? 220 : 30;
    const kg = isYellow ? 180 : 30;
    const kb = isYellow ? 30 : 30;

    fillRect(frameBuf, 135, y, 8, 1, kr, kg, kb);
    fillRect(frameBuf, 487, y, 8, 1, kr, kg, kb);
  }

  // 3. Lane Dividers (Dashed white lines)
  const lane1X = 250;
  const lane2X = 370;
  for (let y = 0; y < height; y++) {
    const isDash = Math.floor((y - frame * 3.5) / 28) % 2 === 0;
    if (isDash) {
      fillRect(frameBuf, lane1X, y, 3, 1, 240, 240, 245);
      fillRect(frameBuf, lane2X, y, 3, 1, 240, 240, 245);
    }
  }

  // 4. Kinematics & Brake Event: At frame 120-210 (approx second 4-7), Bus brakes suddenly!
  if (frame > 110 && frame < 220) {
    vehicles[0].speed = 1.0;
    vehicles[0].isBraking = true;
    // Trailing car also reacts and brakes heavily
    vehicles[5].speed = 1.2;
    vehicles[5].isBraking = true;
  } else {
    vehicles[0].speed = 2.6;
    vehicles[0].isBraking = false;
    vehicles[5].speed = 3.5;
    vehicles[5].isBraking = false;
  }

  // Two-wheeler lane weaving
  vehicles[3].x = 335 + Math.sin(frame * 0.08) * 16;
  vehicles[6].x = 390 + Math.cos(frame * 0.09) * 12;

  // 5. Draw Vehicles
  for (const v of vehicles) {
    v.y += v.speed;
    if (v.y > height + 120) {
      v.y = -140;
    }

    // Shadow under chassis
    fillEllipse(frameBuf, v.x + v.w / 2, v.y + v.h / 2 + 4, v.w * 0.55, v.h * 0.52, 10, 10, 10, 0.7);

    // Vehicle Main Body
    fillRect(frameBuf, v.x, v.y, v.w, v.h, v.color[0], v.color[1], v.color[2]);

    if (v.type === 'Auto-rickshaw') {
      // Characteristic Indian Auto-rickshaw:
      // Front hood: Green body
      fillRect(frameBuf, v.x + 2, v.y + v.h - 18, v.w - 4, 16, 20, 130, 45);
      // Windshield
      fillRect(frameBuf, v.x + 4, v.y + 16, v.w - 8, 8, 30, 45, 60);
      // Black canopy edge
      fillRect(frameBuf, v.x + 2, v.y + 4, v.w - 4, 4, 25, 25, 30);
      // Headlight
      fillRect(frameBuf, v.x + v.w / 2 - 3, v.y + v.h - 3, 6, 2, 255, 250, 180);
    } else if (v.type === 'Bus') {
      // Bus roof & windows
      fillRect(frameBuf, v.x + 4, v.y + 16, v.w - 8, 14, 20, 30, 45); // Windshield
      fillRect(frameBuf, v.x + 4, v.y + 36, v.w - 8, v.h - 48, 40, 50, 65); // Windows
      // Tail lights
      fillRect(frameBuf, v.x + 3, v.y + 2, 8, 4, v.isBraking ? 255 : 180, 20, 20);
      fillRect(frameBuf, v.x + v.w - 11, v.y + 2, 8, 4, v.isBraking ? 255 : 180, 20, 20);
    } else if (v.type === 'Car') {
      // Car windshields
      fillRect(frameBuf, v.x + 4, v.y + 14, v.w - 8, 12, 25, 35, 45);
      fillRect(frameBuf, v.x + 4, v.y + v.h - 22, v.w - 8, 10, 25, 35, 45);
      // Roof
      fillRect(frameBuf, v.x + 6, v.y + 26, v.w - 12, v.h - 48, v.color[0] - 25, v.color[1] - 25, v.color[2] - 25);
      // Brake lights
      if (v.isBraking) {
        fillRect(frameBuf, v.x + 2, v.y + 2, 10, 5, 255, 10, 10);
        fillRect(frameBuf, v.x + v.w - 12, v.y + 2, 10, 5, 255, 10, 10);
      }
    } else if (v.type === 'Motorcycle' || v.type === 'Scooter') {
      // Rider helmet
      fillEllipse(frameBuf, v.x + v.w / 2, v.y + v.h * 0.45, 5, 6, 230, 220, 200, 1.0);
      // Rider shoulders
      fillRect(frameBuf, v.x + 2, v.y + v.h * 0.52, v.w - 4, 7, 30, 40, 55);
      // Headlight
      fillRect(frameBuf, v.x + v.w / 2 - 2, v.y + v.h - 2, 4, 2, 255, 240, 160);
    } else if (v.type === 'Tempo') {
      // Truck cab vs cargo bed
      fillRect(frameBuf, v.x + 3, v.y + 6, v.w - 6, 12, 30, 40, 50); // Windshield
      fillRect(frameBuf, v.x + 2, v.y + 24, v.w - 4, v.h - 28, 80, 90, 100); // Cargo bed
    }
  }

  ffmpeg.stdin.write(frameBuf);
}

ffmpeg.stdin.end();
