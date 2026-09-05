// Efectos visuales de clima. `rainIntensity` y `windStrength` llegan ya
// suavizados desde useGameEngine (0-1) para que la aparición/desaparición
// del clima sea gradual y no un parpadeo.

const RAIN_DROPS = Array.from({ length: 60 }, (_, i) => ({
  seed: i,
  xFrac: (i * 53) % 100 / 100,
  speedFactor: 0.6 + ((i * 17) % 40) / 40,
  lengthFactor: 0.6 + ((i * 29) % 30) / 30,
}));

export function drawRain(ctx, canvas, scale, rainIntensity) {
  if (rainIntensity <= 0.02) return;

  // Niebla: más densa arriba (donde "recién aparece" lo lejano) y se
  // disipa hacia abajo, cerca de Paco — así la lluvia reduce visibilidad
  // de obstáculos lejanos sin ocultar al jugador.
  const fogGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  fogGradient.addColorStop(0, `rgba(200, 210, 225, ${0.55 * rainIntensity})`);
  fogGradient.addColorStop(0.55, `rgba(200, 210, 225, ${0.22 * rainIntensity})`);
  fogGradient.addColorStop(1, 'rgba(200, 210, 225, 0)');
  ctx.fillStyle = fogGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gotas cayendo en diagonal.
  ctx.strokeStyle = `rgba(210, 225, 245, ${0.55 * rainIntensity})`;
  ctx.lineWidth = 1.5 * scale;
  const now = Date.now();
  RAIN_DROPS.forEach((drop) => {
    const x = drop.xFrac * canvas.width;
    const fallSpeed = 550 * drop.speedFactor * scale;
    const y = ((now * fallSpeed) / 1000 + drop.seed * 137) % (canvas.height + 40) - 20;
    const length = 14 * drop.lengthFactor * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 4 * scale, y + length);
    ctx.stroke();
  });
}

export function drawWindEffect(ctx, canvas, scale, windDir, windStrength) {
  if (windStrength <= 0.05) return;

  const alpha = Math.min(windStrength, 1) * 0.35;
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 1.5 * scale;
  const time = Date.now() * 0.004;

  for (let i = 0; i < 6; i++) {
    const yBase = (i * 65 + 30) * scale;
    const y = yBase + Math.sin(time + i) * 6 * scale;
    const streakLength = 40 * scale;
    const startX = windDir > 0 ? ((time * 220 + i * 130) % (canvas.width + streakLength)) - streakLength : canvas.width - (((time * 220 + i * 130) % (canvas.width + streakLength)) - streakLength);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + windDir * streakLength, y);
    ctx.stroke();
  }
}
