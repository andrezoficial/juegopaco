export function drawObstacle(ctx, obstacle, scale) {
  ctx.save();

  if (obstacle.type === 'dog') {
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    ctx.rotate(Math.PI);

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);

    ctx.fillRect(-obstacle.width / 2 + 15 * scale, -obstacle.height / 2 - 10 * scale, 15 * scale, 15 * scale);

    ctx.fillStyle = '#a0522d';
    ctx.fillRect(-obstacle.width / 2 + 18 * scale, -obstacle.height / 2 - 8 * scale, 5 * scale, 12 * scale);
    ctx.fillRect(-obstacle.width / 2 + 5 * scale, -obstacle.height / 2 - 8 * scale, 5 * scale, 12 * scale);

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-obstacle.width / 2 + 8 * scale, -obstacle.height / 2 - 5 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.moveTo(-obstacle.width / 2, -obstacle.height / 2 + 5 * scale);
    ctx.lineTo(-obstacle.width / 2 - 10 * scale, -obstacle.height / 2 - 5 * scale);
    ctx.lineTo(-obstacle.width / 2, -obstacle.height / 2);
    ctx.fill();

    ctx.fillRect(-obstacle.width / 2 + 5 * scale, -obstacle.height / 2 + obstacle.height, 8 * scale, 10 * scale);
    ctx.fillRect(-obstacle.width / 2 + obstacle.width - 13 * scale, -obstacle.height / 2 + obstacle.height, 8 * scale, 10 * scale);

    ctx.restore();
  } else if (obstacle.type === 'box') {
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    const rotation = (Date.now() * 0.01) % (Math.PI * 2);
    ctx.rotate(rotation);

    ctx.fillStyle = '#d2691e';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-obstacle.width / 2 + 5 * scale, -obstacle.height / 2 + 5 * scale, obstacle.width - 10 * scale, obstacle.height - 10 * scale);

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

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-5 * scale, -5 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}
