// Dibuja al jugador usando el sprite ilustrado (paco.png) cuando está
// disponible, con una leve inclinación dinámica basada en la velocidad
// vertical para que no se sienta como una imagen estática pegada en pantalla.
// Si el sprite no cargó (o falló), cae de vuelta al dibujo vectorial original.
export function drawCat(ctx, x, y, width, height, scale, activePowerUps, pacoImage, velocityY = 0) {
  if (!pacoImage) {
    drawCatVector(ctx, x, y, width, height, scale, activePowerUps);
    return;
  }

  ctx.save();

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Aro de escudo (se mantiene igual que en el dibujo vectorial).
  if (activePowerUps.has('shield')) {
    ctx.shadowColor = '#4a90e2';
    ctx.shadowBlur = 20 * scale;
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Brillo distintivo para power-ups que no tienen una silueta propia que
  // dibujar sobre el sprite (a diferencia del dibujo vectorial, que
  // dibujaba lentes/ojos directamente sobre la cara).
  if (activePowerUps.has('slowMotion')) {
    ctx.shadowColor = '#90ee90';
    ctx.shadowBlur = 18 * scale;
  } else if (activePowerUps.has('doublePoints')) {
    ctx.shadowColor = '#ffeb3b';
    ctx.shadowBlur = 18 * scale;
  }

  // Inclinación según la velocidad vertical: se echa hacia atrás al saltar
  // y se inclina hacia adelante al caer, dando sensación de peso y movimiento.
  const tilt = Math.max(-0.25, Math.min(0.25, velocityY * 0.02));

  ctx.translate(centerX, centerY);
  ctx.rotate(tilt);

  // El sprite trae bastante marco/escudo transparente alrededor de la cara,
  // así que se dibuja más grande que el hitbox para que el gato se vea a
  // un tamaño comparable al dibujo anterior. El hitbox de colisión (x/y/
  // width/height) no cambia: esto es puramente cosmético.
  const drawWidth = width * 1.9;
  const aspect = pacoImage.naturalHeight / pacoImage.naturalWidth || 1.5;
  const drawHeight = drawWidth * aspect;

  ctx.drawImage(pacoImage, -drawWidth / 2, -drawHeight / 2 - height * 0.15, drawWidth, drawHeight);

  ctx.restore();
}

function drawCatVector(ctx, x, y, width, height, scale, activePowerUps) {
  ctx.save();

  if (activePowerUps.has('shield')) {
    ctx.shadowColor = '#4a90e2';
    ctx.shadowBlur = 20 * scale;
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, 35 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(x, y + 10 * scale, width, height - 10 * scale);

  ctx.fillStyle = '#7a7a7a';
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 12 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6a6a6a';
  ctx.beginPath();
  ctx.moveTo(x + 10 * scale, y + 5 * scale);
  ctx.lineTo(x + 5 * scale, y - 5 * scale);
  ctx.lineTo(x + 15 * scale, y + 8 * scale);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + width - 10 * scale, y + 5 * scale);
  ctx.lineTo(x + width - 5 * scale, y - 5 * scale);
  ctx.lineTo(x + width - 15 * scale, y + 8 * scale);
  ctx.fill();

  ctx.fillStyle = '#ffb3ba';
  ctx.beginPath();
  ctx.moveTo(x + 10 * scale, y + 5 * scale);
  ctx.lineTo(x + 8 * scale, y);
  ctx.lineTo(x + 13 * scale, y + 7 * scale);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + width - 10 * scale, y + 5 * scale);
  ctx.lineTo(x + width - 8 * scale, y);
  ctx.lineTo(x + width - 13 * scale, y + 7 * scale);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 25 * scale, 12 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + width / 2 - 8 * scale, y + 25 * scale, 16 * scale, 20 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + width / 2 - 10 * scale, y + 15 * scale, 20 * scale, 12 * scale);

  ctx.fillStyle = '#ffb3ba';
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + 20 * scale);
  ctx.lineTo(x + width / 2 - 3 * scale, y + 17 * scale);
  ctx.lineTo(x + width / 2 + 3 * scale, y + 17 * scale);
  ctx.fill();

  if (activePowerUps.has('slowMotion')) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x + width / 2 - 9 * scale, y + 12 * scale);
    ctx.lineTo(x + width / 2 - 3 * scale, y + 12 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width / 2 + 3 * scale, y + 12 * scale);
    ctx.lineTo(x + width / 2 + 9 * scale, y + 12 * scale);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#90ee90';
    ctx.beginPath();
    ctx.arc(x + width / 2 - 7 * scale, y + 12 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width / 2 + 7 * scale, y + 12 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + width / 2 - 7 * scale, y + 12 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width / 2 + 7 * scale, y + 12 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(x + width / 2 - 5 * scale, y + 18 * scale);
  ctx.lineTo(x + 5 * scale, y + 16 * scale);
  ctx.moveTo(x + width / 2 - 5 * scale, y + 20 * scale);
  ctx.lineTo(x + 3 * scale, y + 20 * scale);
  ctx.moveTo(x + width / 2 + 5 * scale, y + 18 * scale);
  ctx.lineTo(x + width - 5 * scale, y + 16 * scale);
  ctx.moveTo(x + width / 2 + 5 * scale, y + 20 * scale);
  ctx.lineTo(x + width - 3 * scale, y + 20 * scale);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 8 * scale, y + height - 5 * scale, 10 * scale, 5 * scale);
  ctx.fillRect(x + width - 18 * scale, y + height - 5 * scale, 10 * scale, 5 * scale);

  ctx.strokeStyle = '#7a7a7a';
  ctx.lineWidth = 5 * scale;
  ctx.beginPath();
  ctx.moveTo(x, y + 20 * scale);
  ctx.quadraticCurveTo(x - 15 * scale, y + 15 * scale, x - 18 * scale, y + 25 * scale);
  ctx.stroke();

  ctx.restore();
}
