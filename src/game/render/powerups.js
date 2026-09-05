const POWERUP_ICONS = {
  shield: '🛡️',
  doublePoints: '2×',
  slowMotion: '🐌',
};

export function drawPowerUp(ctx, powerUp, scale) {
  ctx.save();

  ctx.shadowColor = powerUp.color;
  ctx.shadowBlur = 15 * scale;

  ctx.fillStyle = powerUp.color;
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${16 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(POWERUP_ICONS[powerUp.type] ?? '', powerUp.x, powerUp.y);

  ctx.restore();
}
