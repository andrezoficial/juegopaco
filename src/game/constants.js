// Configuración central del juego.
// Cambiar valores aquí ajusta el balance del juego sin tocar la lógica.

export const CANVAS_BASE = { width: 800, height: 400 };

export const PLAYER_BASE = { x: 100, y: 320, width: 50, height: 45 };

export const PHYSICS = {
  gravity: 0.6,
  jumpVelocity: -12,
  groundOffset: 50,
  moveSpeed: 5,
  maxDeltaMs: 1000 / 30,
};

export const SPAWN_RATES = {
  foodIntervalMs: 2000,
  obstacleIntervalMs: 2500,
  powerUpIntervalMs: 10000,
  powerUpChance: 0.3,
};

export const DIFFICULTY = {
  speedIncrement: 0.05,
  maxGameSpeed: 3,
  increaseEveryMs: 10000,
};

export const COMBO = {
  windowMs: 2000,
  maxMultiplier: 5,
  basePoints: 10,
};

// Sistema de niveles: cada nivel se desbloquea al alcanzar cierto puntaje y
// añade un salto de dificultad (velocidad y frecuencia de aparición) además
// de la rampa continua que ya provee DIFFICULTY. Los multiplicadores son
// acumulativos sobre la velocidad base, no reemplazan la rampa suave.
export const LEVELS = [
  { level: 1, name: 'Patio de casa', scoreRequired: 0, speedMultiplier: 1.0, spawnMultiplier: 1.0, theme: 'day' },
  { level: 2, name: 'Tarde en el parque', scoreRequired: 120, speedMultiplier: 1.12, spawnMultiplier: 1.08, theme: 'day' },
  { level: 3, name: 'Anochecer', scoreRequired: 280, speedMultiplier: 1.28, spawnMultiplier: 1.18, theme: 'night' },
  { level: 4, name: 'Noche en la ciudad', scoreRequired: 480, speedMultiplier: 1.45, spawnMultiplier: 1.3, theme: 'night' },
  { level: 5, name: 'Callejón peligroso', scoreRequired: 720, speedMultiplier: 1.65, spawnMultiplier: 1.45, theme: 'night' },
  { level: 6, name: 'Modo Experto', scoreRequired: 1000, speedMultiplier: 1.85, spawnMultiplier: 1.6, theme: 'night' },
];

// Cada nivel adicional más allá del último definido sigue escalando con estos
// incrementos, para que el juego nunca "termine" de subir de dificultad.
export const LEVEL_OVERFLOW = {
  scoreStep: 320,
  speedStep: 0.12,
  spawnStep: 0.08,
};

// Cada cuántos niveles se otorga una vida extra (hasta MAX_LIVES).
export const LEVEL_BONUS_LIFE_EVERY = 2;
export const MAX_LIVES = 5;

/**
 * Devuelve la información del nivel correspondiente a un puntaje dado.
 * Si el puntaje supera el último nivel definido, genera niveles "virtuales"
 * siguiendo LEVEL_OVERFLOW para que la dificultad siga creciendo indefinidamente.
 */
export function getLevelForScore(score) {
  const lastDefined = LEVELS[LEVELS.length - 1];

  if (score < lastDefined.scoreRequired) {
    let current = LEVELS[0];
    for (const lvl of LEVELS) {
      if (score >= lvl.scoreRequired) current = lvl;
      else break;
    }
    return current;
  }

  // Más allá del último nivel definido: seguimos generando niveles virtuales.
  const extraSteps = Math.floor((score - lastDefined.scoreRequired) / LEVEL_OVERFLOW.scoreStep);
  return {
    level: lastDefined.level + extraSteps,
    name: extraSteps === 0 ? lastDefined.name : `Modo Experto +${extraSteps}`,
    scoreRequired: lastDefined.scoreRequired + extraSteps * LEVEL_OVERFLOW.scoreStep,
    speedMultiplier: lastDefined.speedMultiplier + extraSteps * LEVEL_OVERFLOW.speedStep,
    spawnMultiplier: lastDefined.spawnMultiplier + extraSteps * LEVEL_OVERFLOW.spawnStep,
    theme: lastDefined.theme,
  };
}

export function getNextLevelThreshold(currentLevelNumber) {
  const next = LEVELS.find((lvl) => lvl.level === currentLevelNumber + 1);
  if (next) return next.scoreRequired;
  const lastDefined = LEVELS[LEVELS.length - 1];
  const stepsBeyond = currentLevelNumber - lastDefined.level + 1;
  return lastDefined.scoreRequired + stepsBeyond * LEVEL_OVERFLOW.scoreStep;
}

// Claves de localStorage para persistir el progreso entre sesiones.
export const STORAGE_KEYS = {
  highScore: 'juegoPaco.highScore',
  highestLevel: 'juegoPaco.highestLevel',
};

export const DOUBLE_TAP_THRESHOLD_MS = 300;

export const FOOD_TYPES = ['fish', 'milk', 'croquettes'];

export const OBSTACLE_CONFIG = {
  dog: { width: 40, height: 25 },
  box: { width: 50, height: 30 },
  bird: { width: 35, height: 20 },
};
export const OBSTACLE_TYPES = Object.keys(OBSTACLE_CONFIG);

// Fuente usada en todo el canvas (HUD, banners). Debe coincidir con la
// declarada en index.css para que el resto de la UI (React) se vea consistente.
export const FONT_FAMILY = "'Baloo 2', sans-serif";


export const POWERUP_TYPES = [
  { type: 'shield', color: '#4a90e2', duration: 5000 },
  { type: 'doublePoints', color: '#ffeb3b', duration: 8000 },
  { type: 'slowMotion', color: '#90ee90', duration: 6000 },
];

// --- Clima dinámico ---
// El clima cambia cada cierto intervalo (con algo de variación) y afecta
// tanto el gameplay (viento empuja a Paco, lluvia reduce visibilidad de lo
// que acaba de aparecer arriba) como el sonido y el fondo.
export const WEATHER = {
  checkIntervalMs: 20000,
  // Probabilidades relativas de cada estado al hacer un chequeo.
  weights: { clear: 0.5, wind: 0.27, rain: 0.23 },
  wind: {
    gustIntervalRangeMs: [900, 2200],
    forceRange: [0.5, 1.5], // px base por frame (se escala con `scale`)
    decay: 0.985,
  },
  rain: {
    dropCount: 60,
    // Qué tan marcada es la "niebla" que oculta obstáculos recién aparecidos.
    fogStrength: 0.5,
    // Velocidad de suavizado del fog al entrar/salir de la lluvia (0-1 por frame).
    fogSmoothing: 0.02,
  },
};

// Duración de la transición animada entre día y noche (en vez de un salto
// instantáneo de color al cambiar de tema).
export const THEME_TRANSITION_MS = 3000;

// --- Música de fondo (sintetizada, sin archivos externos) ---
// Patrón de bajo en semitonos relativos, tocado en loop. El tempo y el tono
// suben con `intensity` (0-1), que useGameEngine deriva de la velocidad
// actual del juego, para reforzar la sensación de que "va más rápido".
export const MUSIC = {
  pattern: [0, 3, 5, 3, 7, 5, 3, 0],
  baseFreq: 110,
  bpmRange: [88, 158],
  noteGain: 0.1,
};

// Elige un tipo de clima al azar respetando los pesos relativos de WEATHER.weights.
export function pickWeatherType() {
  const entries = Object.entries(WEATHER.weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [type, w] of entries) {
    if (r < w) return type;
    r -= w;
  }
  return entries[0][0];
}
