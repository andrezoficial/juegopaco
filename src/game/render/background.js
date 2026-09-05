export function drawBackground(ctx, canvas, scale, backgroundTheme, isMobile) {
  const isDay = backgroundTheme === 'day';

  if (isDay) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, isMobile ? '#5ba8d0' : '#87ceeb');
    gradient.addColorStop(0.7, '#e0f6ff');
    gradient.addColorStop(1, '#fff8dc');
    ctx.fillStyle = gradient;
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#191970');
    gradient.addColorStop(0.7, '#2c2c54');
    gradient.addColorStop(1, '#1e1e2c');
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isDay) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % canvas.width;
      const y = (i * 23) % (canvas.height - 100);
      const size = Math.random() * (isMobile ? 2 : 1.5) * scale;
      ctx.globalAlpha = isMobile ? 0.9 : 0.7 + Math.random() * 0.3;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Sol / Luna
  if (isDay) {
    ctx.fillStyle = '#ffeb3b';
    ctx.shadowColor = '#ff9800';
    ctx.shadowBlur = 20 * scale;
    ctx.beginPath();
    ctx.arc(700 * scale, 80 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
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
  }

  // Nubes
  const time = Date.now() * 0.001;
  ctx.fillStyle = isDay ? 'rgba(255, 255, 255, 0.8)' : 'rgba(150, 150, 150, 0.6)';

  const cloudX1 = 100 * scale + Math.sin(time * 0.5) * 20 * scale;
  ctx.beginPath();
  ctx.arc(cloudX1, 80 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.arc(cloudX1 + 25 * scale, 75 * scale, 30 * scale, 0, Math.PI * 2);
  ctx.arc(cloudX1 + 50 * scale, 80 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.fill();

  const cloudX2 = 500 * scale + Math.cos(time * 0.3) * 15 * scale;
  ctx.beginPath();
  ctx.arc(cloudX2, 100 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.arc(cloudX2 + 20 * scale, 95 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.arc(cloudX2 + 40 * scale, 100 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Edificios
  const buildings = [
    { x: 50 * scale, y: 100 * scale, w: 80 * scale, h: 265 * scale },
    { x: 200 * scale, y: 150 * scale, w: 100 * scale, h: 215 * scale },
    { x: 400 * scale, y: 120 * scale, w: 70 * scale, h: 245 * scale },
    { x: 600 * scale, y: 140 * scale, w: 90 * scale, h: 225 * scale },
  ];

  buildings.forEach((building) => {
    ctx.fillStyle = isDay ? '#696969' : '#505050';
    ctx.fillRect(building.x, building.y, building.w, building.h);

    ctx.fillStyle = isDay ? '#505050' : '#404040';
    ctx.fillRect(building.x, building.y, building.w, 10 * scale);

    ctx.fillStyle = isDay ? '#ffeb3b' : '#ffa500';
    for (let row = 0; row < Math.floor(building.h / (30 * scale)); row++) {
      for (let col = 0; col < Math.floor(building.w / (20 * scale)); col++) {
        const shouldLight = isDay ? Math.random() > 0.3 : Math.random() > 0.7;
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

  // Suelo
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(0, canvas.height - 50 * scale, canvas.width, 50 * scale);
  ctx.fillStyle = isDay ? '#90ee90' : '#2d5a2d';
  ctx.fillRect(0, canvas.height - 50 * scale, canvas.width, 10 * scale);
}
