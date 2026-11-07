/**
 * Generates an actual genuine WebM video file representing an Indian road traffic junction.
 * This uses HTML5 Canvas + MediaStream/MediaRecorder to produce a real recorded video Blob,
 * allowing instant demonstration if the user doesn't have a local video file immediately available.
 */
export async function generateIndianTrafficTestVideo(): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const stream = canvas.captureStream(30);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch (err) {
        reject(err);
        return;
      }
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], 'indian_junction_traffic_demo.webm', {
        type: 'video/webm',
        lastModified: Date.now(),
      });
      resolve(file);
    };

    recorder.start();

    // Indian traffic simulation variables
    let frame = 0;
    const totalFrames = 240; // 8 seconds at 30 fps

    // Vehicles on Indian road
    const vehicles = [
      { type: 'Bus', x: 260, y: -80, speed: 2.8, color: '#8b5cf6', w: 58, h: 110, lane: 1, isBraking: false },
      { type: 'Auto-rickshaw', x: 200, y: 120, speed: 3.2, color: '#f59e0b', w: 32, h: 42, lane: 0, isBraking: false },
      { type: 'Motorcycle', x: 330, y: 220, speed: 4.6, color: '#06b6d4', w: 18, h: 32, lane: 2, isBraking: false },
      { type: 'Car', x: 380, y: 40, speed: 3.8, color: '#3b82f6', w: 42, h: 72, lane: 2, isBraking: false },
      { type: 'Tempo', x: 195, y: 280, speed: 3.0, color: '#f97316', w: 36, h: 56, lane: 0, isBraking: false },
      { type: 'Scooter', x: 280, y: 290, speed: 4.1, color: '#10b981', w: 16, h: 30, lane: 1, isBraking: false },
    ];

    const renderLoop = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      // Draw Indian 3-lane arterial road
      ctx.fillStyle = '#27272a'; // Asphalt road
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road shoulder & kerb
      ctx.fillStyle = '#d97706'; // Indian yellow-black kerb
      ctx.fillRect(150, 0, 8, canvas.height);
      ctx.fillRect(480, 0, 8, canvas.height);

      // Lane markings (dashed white)
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -frame * 3;

      ctx.beginPath();
      ctx.moveTo(255, 0);
      ctx.lineTo(255, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(365, 0);
      ctx.lineTo(365, canvas.height);
      ctx.stroke();

      ctx.setLineDash([]);

      // Road text markings
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('SPEED 40', 270, (frame * 2) % canvas.height);

      // Sudden braking event around frame 90 (Bus slows down, causing cascade hazard!)
      if (frame > 85 && frame < 160) {
        vehicles[0].speed = 1.1; // Bus brakes heavily
        vehicles[0].isBraking = true;
      } else {
        vehicles[0].speed = 2.8;
        vehicles[0].isBraking = false;
      }

      // Two-wheeler weaving behavior
      vehicles[2].x += Math.sin(frame * 0.1) * 1.5;

      // Update and draw vehicles
      for (const v of vehicles) {
        v.y += v.speed;
        if (v.y > canvas.height + 100) {
          v.y = -100;
        }

        // Vehicle shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(v.x + v.w / 2, v.y + v.h / 2 + 3, v.w / 2, v.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vehicle body
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(v.x, v.y, v.w, v.h, [6]);
        ctx.fill();

        // Windshield / roof
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        if (v.type === 'Auto-rickshaw') {
          // Bajaj Auto yellow canvas roof + black front
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(v.x + 4, v.y + 4, v.w - 8, 12);
        } else if (v.type === 'Bus') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(v.x + 5, v.y + 10, v.w - 10, 18);
        } else if (v.type === 'Car') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(v.x + 4, v.y + 12, v.w - 8, 22);
        }

        // Brake lights
        if (v.isBraking) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(v.x + 2, v.y, 8, 4);
          ctx.fillRect(v.x + v.w - 10, v.y, 8, 4);
        }
      }

      frame++;
      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  });
}
