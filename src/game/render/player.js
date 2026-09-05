// Dibuja a Paco como un personaje ilustrado de perfil (no como el escudo/
// medallón del logo). Es 100% vectorial: sin imágenes externas, así que se
// ve nítido a cualquier tamaño y se puede animar con libertad (correr,
// saltar, voltearse, respirar en reposo).

const FUR_DARK = '#93a1b0';
const FUR_MID = '#aeb9c5';
const FUR_LIGHT = '#f7f8f9';
const EAR_PINK = '#f2b9c6';
const NOSE_COLOR = '#ef93a7';
const EYE_COLOR = '#c3d98a';
const OUTLINE = '#5f6b78';

// El dibujo se define en un sistema de coordenadas propio ("unidades de
// diseño") centrado en el personaje, pensado para que se vea bien a 188
// unidades de ancho total. DESIGN_SCALE convierte esas unidades a píxeles
// reales según el tamaño del hitbox, para que el personaje crezca o
// encoja junto con el resto del juego.
const DESIGN_WIDTH = 188;
const SPRITE_SIZE_MULTIPLIER = 1.9;

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function triangle(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Calcula la animación "de vida" del gato en cada frame: cuánto rebota al
// correr, cuánto se estira/aplasta (squash & stretch) y cuánto respira en
// reposo. Todo esto es puramente visual, no toca el hitbox de colisión.
function getCatAnimation(time, isMoving, isJumping, velocityY, scale) {
  let bob = 0;
  let squashX = 1;
  let squashY = 1;

  if (isJumping) {
    // Al subir se estira un poco (como impulso), al caer se aplasta un poco
    // (anticipando el aterrizaje). La intensidad depende de la velocidad.
    const speed = Math.max(-1, Math.min(1, velocityY / (10 * scale)));
    squashY = 1 + Math.max(0, -speed) * 0.12 - Math.max(0, speed) * 0.08;
    squashX = 1 - (squashY - 1) * 0.6;
  } else if (isMoving) {
    // Ciclo de carrera: un pequeño rebote arriba/abajo con squash asociado,
    // como si el gato estuviera dando saltitos al trotar.
    const cycle = Math.sin(time * 13);
    bob = Math.abs(cycle) * 3 * scale;
    squashY = 1 - Math.abs(cycle) * 0.07;
    squashX = 1 + Math.abs(cycle) * 0.05;
  } else {
    // Reposo: una respiración muy sutil para que nunca se sienta congelado.
    squashY = 1 + Math.sin(time * 2.2) * 0.012;
  }

  return { bob, squashX, squashY };
}

// Sombra de contacto en el suelo: se encoge y se desvanece mientras el gato
// está en el aire, dando sensación real de altura y profundidad.
function drawContactShadow(ctx, centerX, groundY, width, isJumping, airFraction, scale) {
  const spread = isJumping ? 0.9 - airFraction * 0.4 : 1;
  const alpha = isJumping ? 0.22 - airFraction * 0.12 : 0.3;
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = '#000000';
  ctx.filter = `blur(${1.5 * scale}px)`;
  ctx.beginPath();
  ctx.ellipse(centerX, groundY, (width * 0.55 * spread) / 2, (width * 0.16 * spread) / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Dibuja el cuerpo del gato en su propio espacio local (origen = centro del
// personaje, eje X positivo = "adelante" cuando facing es 1). runPhase y
// tailPhase son ciclos independientes para que las patas y la cola no se
// muevan siempre exactamente igual.
function paintCat(ctx, time, isMoving, isJumping, activePowerUps) {
  const runPhase = isMoving ? time * 13 : 0;
  const tailPhase = time * (isMoving ? 3.5 : 1.6);
  const frontLegX = isMoving ? 8 * Math.sin(runPhase) : 0;
  const backLegX = isMoving ? 8 * Math.sin(runPhase + Math.PI) : 0;
  const tailCurl = 10 * Math.sin(tailPhase);

  // Cola: dos trazos (base gruesa + puntita más clara) con un curvado que
  // se mece con el tiempo para que nunca se vea rígida.
  ctx.strokeStyle = FUR_DARK;
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-52, 18);
  ctx.quadraticCurveTo(-98, -8 + tailCurl, -84, -54 + tailCurl);
  ctx.stroke();
  ctx.strokeStyle = FUR_MID;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-89, -57 + tailCurl);
  ctx.quadraticCurveTo(-94, -64 + tailCurl, -81, -66 + tailCurl);
  ctx.stroke();

  // Pata trasera (detrás del cuerpo)
  ctx.fillStyle = FUR_DARK;
  ellipse(ctx, -22 + backLegX, 56, 10, 19);
  ctx.fillStyle = FUR_LIGHT;
  ellipse(ctx, -22 + backLegX, 71, 11, 8);

  // Relleno de cuello: suaviza la unión entre el cuerpo y la cabeza para
  // que no se vea como dos óvalos pegados.
  ctx.fillStyle = FUR_DARK;
  ellipse(ctx, 28, -8, 30, 30);

  // Cuerpo y panza clara
  ellipse(ctx, -14, 8, 60, 40);
  ctx.fillStyle = FUR_LIGHT;
  ellipse(ctx, -12, 24, 40, 22);

  // Pata delantera (por encima del cuerpo, un tono más claro para dar
  // sensación de profundidad)
  ctx.fillStyle = FUR_MID;
  ellipse(ctx, 28 + frontLegX, 56, 10, 19);
  ctx.fillStyle = FUR_LIGHT;
  ellipse(ctx, 28 + frontLegX, 71, 11, 8);

  // Oreja trasera, asomando detrás de la cabeza
  ctx.fillStyle = FUR_MID;
  triangle(ctx, 30, -56, 18, -84, 42, -68);

  // Cabeza
  ctx.fillStyle = FUR_DARK;
  ellipse(ctx, 44, -36, 44, 38);

  // Oreja delantera, con interior rosado
  ctx.fillStyle = FUR_DARK;
  triangle(ctx, 62, -56, 58, -92, 84, -64);
  ctx.fillStyle = EAR_PINK;
  triangle(ctx, 63, -59, 61, -82, 77, -63);

  // Hocico / pecho blanco
  ctx.fillStyle = FUR_LIGHT;
  ellipse(ctx, 56, -18, 27, 23);

  // Ojo (almendrado, con brillo)
  ctx.save();
  ctx.translate(52, -40);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.fillStyle = EYE_COLOR;
  ellipse(ctx, 0, 0, 8.5, 10.5);
  ctx.restore();
  ctx.fillStyle = '#2b2b2b';
  ellipse(ctx, 54, -38, 3.8, 6.5);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 56, -42, 1.5, 1.5);

  // Nariz
  ctx.fillStyle = NOSE_COLOR;
  triangle(ctx, 78, -20, 72, -15, 78, -11);

  // Boca
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(75, -12);
  ctx.quadraticCurveTo(70, -4, 58, -6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(75, -12);
  ctx.quadraticCurveTo(80, -4, 90, -8);
  ctx.stroke();

  // Bigotes
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.6;
  line(ctx, 62, -22, 30, -27);
  line(ctx, 62, -16, 28, -16);
  line(ctx, 61, -10, 30, -6);

  // Aro de escudo (power-up), con un leve pulso para que se lea como un
  // efecto activo y no un anillo estático.
  if (activePowerUps.has('shield')) {
    const pulse = 1 + Math.sin(time * 6) * 0.06;
    ctx.save();
    ctx.shadowColor = '#4a90e2';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -10, 95 * pulse, 80 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Dibuja al jugador: sombra de contacto en el suelo, animación de carrera o
// salto con squash & stretch, volteo según la dirección de movimiento, y
// brillo distintivo mientras hay power-ups activos. El hitbox de colisión
// (x/y/width/height) no cambia: toda esta animación es puramente cosmética.
export function drawCat(ctx, x, y, width, height, scale, activePowerUps, pacoImage, velocityY = 0, options = {}) {
  const { isMoving = false, isJumping = false, facing = 1, groundY = null } = options;
  const time = Date.now() * 0.001;

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const { bob, squashX, squashY } = getCatAnimation(time, isMoving, isJumping, velocityY, scale);

  // Sombra de contacto, dibujada siempre a la altura del suelo (no sigue al
  // gato en su salto) para marcar bien cuánto se elevó del piso.
  if (groundY !== null) {
    const airFraction = isJumping ? Math.min(1, Math.abs(velocityY) / (12 * scale)) : 0;
    drawContactShadow(ctx, centerX, groundY, width, isJumping, airFraction, scale);
  }

  ctx.save();

  // Brillo distintivo para power-ups sin silueta propia, o una sombra suave
  // permanente para que el gato "despegue" visualmente del fondo en vez de
  // verse pegado/plano encima de él.
  if (activePowerUps.has('slowMotion')) {
    ctx.shadowColor = '#90ee90';
    ctx.shadowBlur = 14 * scale;
  } else if (activePowerUps.has('doublePoints')) {
    ctx.shadowColor = '#ffeb3b';
    ctx.shadowBlur = 14 * scale;
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 6 * scale;
    ctx.shadowOffsetY = 3 * scale;
  }

  // Inclinación según la velocidad vertical: se echa hacia atrás al saltar
  // y se inclina hacia adelante al caer, dando sensación de peso y movimiento.
  const tilt = Math.max(-0.25, Math.min(0.25, velocityY * 0.02));

  // designScale convierte las unidades de diseño (fijas, ver DESIGN_WIDTH)
  // a píxeles reales según el tamaño actual del hitbox, para que el
  // personaje escale junto con el resto del juego en pantallas chicas.
  const designScale = (width * SPRITE_SIZE_MULTIPLIER) / DESIGN_WIDTH;

  ctx.translate(centerX, centerY - bob - height * 0.32);
  ctx.rotate(tilt);
  ctx.scale(facing * squashX * designScale, squashY * designScale);

  paintCat(ctx, time, isMoving, isJumping, activePowerUps);

  ctx.restore();
}
