const POWERUP_HUD = {
  shield: { color: '#4a90e2', label: '🛡️ Escudo' },
  doublePoints: { color: '#ffeb3b', label: '2× Puntos' },
  slowMotion: { color: '#90ee90', label: '🐌 Cámara Lenta' },
};

export function drawHUD(ctx, canvas, scale, hudState) {
  const { score, lives, combo, showCombo, comboPosition, backgroundTheme, activePowerUps, comboBroken, level } = hudState;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10 * scale, 10 * scale, 250 * scale, 50 * scale);
  ctx.fillRect(canvas.width - 260 * scale, 10 * scale, 250 * scale, 50 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${20 * scale}px Arial`;
  ctx.fillText(`🐟 ${score}`, 20 * scale, 35 * scale);

  if (combo > 1) {
    // Si el combo se acaba de romper, mostrarlo en rojo parpadeante
    ctx.fillStyle = comboBroken ? '#ff4444' : '#ffeb3b';
    ctx.font = `bold ${comboBroken ? 22 * scale : 20 * scale}px Arial`;
    ctx.fillText(comboBroken ? `¡Combo roto! 💔` : `x${combo}!`, 20 * scale, 55 * scale);
    ctx.font = `bold ${20 * scale}px Arial`;
  } else if (level > 1) {
    ctx.fillStyle = '#a0e8ff';
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillText(`⭐ Nivel ${level}`, 20 * scale, 55 * scale);
    ctx.font = `bold ${20 * scale}px Arial`;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillText(`❤️ ${lives}`, canvas.width - 240 * scale, 35 * scale);

  ctx.fillStyle = backgroundTheme === 'day' ? '#ffeb3b' : '#4a90e2';
  ctx.fillText(backgroundTheme === 'day' ? '☀️ Día' : '🌙 Noche', canvas.width - 240 * scale, 55 * scale);

  let powerUpY = 80 * scale;
  activePowerUps.forEach((powerUp) => {
    const info = POWERUP_HUD[powerUp];
    if (!info) return;
    ctx.fillStyle = info.color;
    ctx.fillText(info.label, canvas.width - 240 * scale, powerUpY);
    powerUpY += 25 * scale;
  });

  if (showCombo && !comboBroken) {
    ctx.fillStyle = '#ffeb3b';
    ctx.font = `bold ${30 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`COMBO x${combo}!`, comboPosition.x, comboPosition.y);
    ctx.textAlign = 'left';
  }
}

export function drawPauseOverlay(ctx, canvas, scale) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${48 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('⏸ PAUSA', canvas.width / 2, canvas.height / 2 - 20 * scale);

  ctx.font = `${18 * scale}px Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Presiona P o Esc para continuar', canvas.width / 2, canvas.height / 2 + 20 * scale);
  ctx.textAlign = 'left';
}

/**
 * Banner central que anuncia la subida de nivel con nombre y número.
 * Se muestra por un par de segundos (controlado desde useGameEngine).
 */
export function drawLevelUpBanner(ctx, canvas, scale, level, levelName) {
  const centerY = canvas.height / 2 - 60 * scale;

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  const boxWidth = 320 * scale;
  const boxHeight = 70 * scale;
  ctx.fillRect(canvas.width / 2 - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);

  ctx.fillStyle = '#ffeb3b';
  ctx.font = `bold ${26 * scale}px Arial`;
  ctx.fillText(`⭐ ¡Nivel ${level}!`, canvas.width / 2, centerY - 5 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${16 * scale}px Arial`;
  ctx.fillText(levelName, canvas.width / 2, centerY + 20 * scale);

  ctx.restore();
}
