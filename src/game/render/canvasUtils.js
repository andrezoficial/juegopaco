// Utilidades de dibujo compartidas entre los distintos módulos de render/.

// Dibuja un rectángulo con esquinas redondeadas. Se implementa a mano (en vez
// de ctx.roundRect) para no depender de soporte de navegador reciente.
export function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
