import { lerpColor } from './canvasUtils';

// Colores base de cada tema. Se interpolan entre sí durante la transición
// animada (amanecer/atardecer) en vez de saltar de golpe de uno a otro.
const SKY_NIGHT = ['#191970', '#2c2c54', '#1e1e2c'];
const SKY_DAY = ['#87ceeb', '#e0f6ff', '#fff8dc'];
const SKY_DAY_MOBILE_TOP = '#5ba8d0';

const HILL_NIGHT = '#141428';
const HILL_DAY = '#6fae6f';
const BUILDING_WALL_NIGHT = '#505050';
const BUILDING_WALL_DAY = '#696969';
const BUILDING_ROOF_NIGHT = '#404040';
const BUILDING_ROOF_DAY = '#505050';
const WINDOW_NIGHT = '#ffa500';
const WINDOW_DAY = '#ffeb3b';
const GRASS_NIGHT = '#2d5a2d';
const GRASS_DAY = '#90ee90';

/**
 * Dibuja el fondo del nivel actual.
 *
 * `transition` (opcional) = { fromTheme, progress } permite animar el cambio
 * día/noche en vez de aplicarlo de golpe: progress va de 0 (aún en fromTheme)
 * a 1 (ya completamente en backgroundTheme). Si no se pasa, se dibuja el
 * tema de forma estática (comportamiento anterior).
 *
 * `weather` (opcional) = { wind: {dir, strength}, rain: {intensity} } afecta
 * cuánto se mecen los elementos del fondo (colinas/pasto) con el viento.
 */
export function drawBackground(ctx, canvas, scale, backgroundTheme, isMobile, transition, weather) {
  const isDay = backgroundTheme === 'day';
  // dayAmount: 1 = de día del todo, 0 = de noche del todo. Durante una
  // transición cruza suavemente de un extremo a otro.
  let dayAmount = isDay ? 1 : 0;
  if (transition && transition.fromTheme && transition.fromTheme !== backgroundTheme) {
    const fromDay = transition.fromTheme === 'day' ? 1 : 0;
    const toDay = isDay ? 1 : 0;
    dayAmount = fromDay + (toDay - fromDay) * transition.progress;
  }

  const wind = weather?.wind;
  const windOffset = wind ? wind.dir * wind.strength : 0;
  const time = Date.now() * 0.001;

  // --- Cielo (gradiente interpolado entre los 3 stops de cada tema) ---
  const topColor = lerpColor(SKY_NIGHT[0], isMobile ? SKY_DAY_MOBILE_TOP : SKY_DAY[0], dayAmount);
  const midColor = lerpColor(SKY_NIGHT[1], SKY_DAY[1], dayAmount);
  const bottomColor = lerpColor(SKY_NIGHT[2], SKY_DAY[2], dayAmount);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(0.7, midColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- Estrellas (se desvanecen al amanecer, aparecen al atardecer) ---
  const starAlpha = 1 - dayAmount;
  if (starAlpha > 0.02) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % canvas.width;
      const y = (i * 23) % (canvas.height - 100);
      const size = Math.random() * (isMobile ? 2 : 1.5) * scale;
      ctx.globalAlpha = (isMobile ? 0.9 : 0.7 + Math.random() * 0.3) * starAlpha;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
  }

  // --- Sol y luna (cross-fade durante la transición, no un salto) ---
  if (dayAmount > 0.02) {
    ctx.globalAlpha = dayAmount;
    ctx.fillStyle = '#ffeb3b';
    ctx.shadowColor = '#ff9800';
    ctx.shadowBlur = 20 * scale;
    ctx.beginPath();
    ctx.arc(700 * scale, 80 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  if (dayAmount < 0.98) {
    ctx.globalAlpha = 1 - dayAmount;
    ctx.fillStyle = '#f5f5f5';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15 * scale;
    ctx.beginPath();
    ctx.arc(700 * scale, 80 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.arc(690 * scale, 75 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(710 * scale, 85 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(695 * scale, 90 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // --- Nubes (capa lejana del parallax, se mecen más con el viento) ---
  ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + dayAmount * 0.45})`;
  const cloudDrift = windOffset * 6;
  const cloudX1 = 100 * scale + Math.sin(time * 0.5) * 20 * scale + cloudDrift;
  ctx.beginPath();
  ctx.arc(cloudX1, 80 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.arc(cloudX1 + 25 * scale, 75 * scale, 30 * scale, 0, Math.PI * 2);
  ctx.arc(cloudX1 + 50 * scale, 80 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.fill();

  const cloudX2 = 500 * scale + Math.cos(time * 0.3) * 15 * scale + cloudDrift;
  ctx.beginPath();
  ctx.arc(cloudX2, 100 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.arc(cloudX2 + 20 * scale, 95 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.arc(cloudX2 + 40 * scale, 100 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.fill();

  // --- Colinas lejanas: capa nueva de parallax, muy sutil y lenta, entre el
  // cielo y los edificios, para dar más sensación de profundidad. ---
  const hillColor = lerpColor(HILL_NIGHT, HILL_DAY, dayAmount);
  ctx.fillStyle = hillColor;
  ctx.globalAlpha = 0.55;
  const hillBaseY = canvas.height - 90 * scale;
  const hillDrift = Math.sin(time * 0.08) * 10 * scale + windOffset * 3;
  ctx.beginPath();
  ctx.moveTo(0, hillBaseY);
  for (let x = 0; x <= canvas.width; x += 40 * scale) {
    const hillHeight = 25 * scale * Math.sin((x + hillDrift * 20) * 0.006 + 1) + 20 * scale;
    ctx.lineTo(x, hillBaseY - hillHeight);
  }
  ctx.lineTo(canvas.width, hillBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // --- Edificios (capa media del parallax) ---
  const buildings = [
    { x: 50 * scale, y: 100 * scale, w: 80 * scale, h: 265 * scale },
    { x: 200 * scale, y: 150 * scale, w: 100 * scale, h: 215 * scale },
    { x: 400 * scale, y: 120 * scale, w: 70 * scale, h: 245 * scale },
    { x: 600 * scale, y: 140 * scale, w: 90 * scale, h: 225 * scale },
  ];

  const wallColor = lerpColor(BUILDING_WALL_NIGHT, BUILDING_WALL_DAY, dayAmount);
  const roofColor = lerpColor(BUILDING_ROOF_NIGHT, BUILDING_ROOF_DAY, dayAmount);
  const windowColor = lerpColor(WINDOW_NIGHT, WINDOW_DAY, dayAmount);
  // Cuantas más ventanas encendidas de noche que de día (ciudad dormida vs. luz solar).
  const windowChance = 0.3 + (1 - dayAmount) * 0.4;

  buildings.forEach((building) => {
    ctx.fillStyle = wallColor;
    ctx.fillRect(building.x, building.y, building.w, building.h);

    ctx.fillStyle = roofColor;
    ctx.fillRect(building.x, building.y, building.w, 10 * scale);

    ctx.fillStyle = windowColor;
    for (let row = 0; row < Math.floor(building.h / (30 * scale)); row++) {
      for (let col = 0; col < Math.floor(building.w / (20 * scale)); col++) {
        const shouldLight = Math.random() > 1 - windowChance;
        if (shouldLight) {
          ctx.fillRect(
            building.x + 5 * scale + col * 20 * scale,
            building.y + 15 * scale + row * 30 * scale,
            10 * scale,
            15 * scale
          );
        }
      }
    }
  });

  // --- Suelo ---
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(0, canvas.height - 50 * scale, canvas.width, 50 * scale);
  const grassColor = lerpColor(GRASS_NIGHT, GRASS_DAY, dayAmount);
  ctx.fillStyle = grassColor;
  ctx.fillRect(0, canvas.height - 50 * scale, canvas.width, 10 * scale);

  // --- Matas de pasto: capa cercana del parallax (se mueven más rápido y se
  // inclinan con el viento, aportando la sensación de profundidad más marcada). ---
  ctx.strokeStyle = grassColor;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  const tuftCount = Math.floor(canvas.width / (55 * scale));
  const bendFromWind = windOffset * 4;
  for (let i = 0; i < tuftCount; i++) {
    const baseX = (i * 55 + (i % 2) * 20) * scale;
    const baseY = canvas.height - 40 * scale;
    const sway = Math.sin(time * 1.5 + i) * 3 * scale + bendFromWind;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(baseX + sway, baseY - 8 * scale, baseX + sway * 1.6, baseY - 14 * scale);
    ctx.stroke();
  }
}
