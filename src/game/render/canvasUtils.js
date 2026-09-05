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

// Interpola entre dos colores hex ('#rrggbb') según t (0 = a, 1 = b).
// Se usa para animar la transición día/noche en vez de saltar de golpe.
export function lerpColor(hexA, hexB, t) {
  const clampT = Math.max(0, Math.min(1, t));
  const parse = (hex) => {
    const clean = hex.replace('#', '');
    return [
      parseInt(clean.substring(0, 2), 16),
      parseInt(clean.substring(2, 4), 16),
      parseInt(clean.substring(4, 6), 16),
    ];
  };
  const [ar, ag, ab] = parse(hexA);
  const [br, bg, bb] = parse(hexB);
  const r = Math.round(ar + (br - ar) * clampT);
  const g = Math.round(ag + (bg - ag) * clampT);
  const b = Math.round(ab + (bb - ab) * clampT);
  return `rgb(${r}, ${g}, ${b})`;
}
