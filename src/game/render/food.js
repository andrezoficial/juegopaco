export function drawFood(ctx, food, scale) {
  ctx.save();

  if (food.type === 'fish') {
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10 * scale;
    ctx.beginPath();
    ctx.ellipse(food.x, food.y, 15 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff8e8e';
    ctx.beginPath();
    ctx.moveTo(food.x - 15 * scale, food.y);
    ctx.lineTo(food.x - 22 * scale, food.y - 8 * scale);
    ctx.lineTo(food.x - 22 * scale, food.y + 8 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(food.x + 5 * scale, food.y - 2 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(food.x + 5 * scale, food.y - 2 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (food.type === 'milk') {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#87ceeb';
    ctx.shadowBlur = 8 * scale;
    ctx.fillRect(food.x - 10 * scale, food.y - 15 * scale, 20 * scale, 30 * scale);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e8f4f8';
    ctx.fillRect(food.x - 8 * scale, food.y - 13 * scale, 16 * scale, 26 * scale);

    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(food.x - 10 * scale, food.y - 18 * scale, 20 * scale, 5 * scale);
  } else if (food.type === 'croquettes') {
    ctx.fillStyle = '#d2691e';
    ctx.shadowColor = '#a0522d';
    ctx.shadowBlur = 5 * scale;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(food.x + (i - 1) * 8 * scale, food.y, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
