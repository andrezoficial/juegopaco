import { roundRect } from './canvasUtils';

// Al igual que food.js y powerups.js, cada obstáculo lleva un resplandor de
// color propio: antes eran las únicas entidades del juego sin ningún tipo de
// sombra/glow, lo que las hacía ver más planas que el resto.
export function drawObstacle(ctx, obstacle, scale) {
  ctx.save();

  if (obstacle.type === 'dog') {
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    ctx.rotate(Math.PI);

    ctx.shadowColor = '#3d2412';
    ctx.shadowBlur = 10 * scale;

    // Cuerpo con esquinas redondeadas en vez de un rectángulo seco.
    roundRect(ctx, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height, 6 * scale);
    ctx.fillStyle = '#8b4513';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cabeza (redonda en vez de rectangular, más amigable/cartoon).
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(-obstacle.width / 2 + 22 * scale, -obstacle.height / 2 - 3 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Orejas caídas.
    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.ellipse(-obstacle.width / 2 + 12 * scale, -obstacle.height / 2 - 2 * scale, 4 * scale, 8 * scale, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-obstacle.width / 2 + 32 * scale, -obstacle.height / 2 - 2 * scale, 4 * scale, 8 * scale, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Hocico y ojo.
    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.ellipse(-obstacle.width / 2 + 12 * scale, -obstacle.height / 2 + 1 * scale, 5 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-obstacle.width / 2 + 26 * scale, -obstacle.height / 2 - 6 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Cola.
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-obstacle.width / 2, -obstacle.height / 2 + 5 * scale);
    ctx.quadraticCurveTo(-obstacle.width / 2 - 12 * scale, -obstacle.height / 2 - 8 * scale, -obstacle.width / 2 - 14 * scale, -obstacle.height / 2 - 16 * scale);
    ctx.stroke();

    // Patas.
    ctx.fillStyle = '#6b3410';
    ctx.fillRect(-obstacle.width / 2 + 5 * scale, -obstacle.height / 2 + obstacle.height, 8 * scale, 10 * scale);
    ctx.fillRect(-obstacle.width / 2 + obstacle.width - 13 * scale, -obstacle.height / 2 + obstacle.height, 8 * scale, 10 * scale);

    ctx.restore();
  } else if (obstacle.type === 'box') {
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    const rotation = (Date.now() * 0.01) % (Math.PI * 2);
    ctx.rotate(rotation);

    ctx.shadowColor = '#5c3a1a';
    ctx.shadowBlur = 8 * scale;

    roundRect(ctx, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height, 3 * scale);
    ctx.fillStyle = '#d2691e';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-obstacle.width / 2 + 5 * scale, -obstacle.height / 2 + 5 * scale, obstacle.width - 10 * scale, obstacle.height - 10 * scale);

    // Cinta de embalaje en cruz, para que se lea claramente como caja de cartón.
    ctx.strokeStyle = '#c9a35c';
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -obstacle.height / 2 + 3 * scale);
    ctx.lineTo(0, obstacle.height / 2 - 3 * scale);
    ctx.stroke();

    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.moveTo(-obstacle.width / 2, -obstacle.height / 2);
    ctx.lineTo(-obstacle.width / 2 + 10 * scale, -obstacle.height / 2 - 10 * scale);
    ctx.lineTo(-obstacle.width / 2 + obstacle.width + 10 * scale, -obstacle.height / 2 - 10 * scale);
    ctx.lineTo(-obstacle.width / 2 + obstacle.width, -obstacle.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  } else if (obstacle.type === 'bird') {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    ctx.shadowColor = '#c0392b';
    ctx.shadowBlur = 10 * scale;

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const wingFlap = Math.sin(Date.now() * 0.01) * 5 * scale;
    ctx.fillStyle = '#ff8e8e';
    ctx.beginPath();
    ctx.ellipse(-8 * scale, wingFlap, 8 * scale, 5 * scale, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(8 * scale, wingFlap, 8 * scale, 5 * scale, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.moveTo(12 * scale, 0);
    ctx.lineTo(20 * scale, -3 * scale);
    ctx.lineTo(20 * scale, 3 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5 * scale, -6 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-5 * scale, -5 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}
