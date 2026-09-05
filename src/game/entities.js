// Fábricas de entidades: funciones puras que devuelven un objeto nuevo.
// No mutan estado de React: quien las llama decide qué hacer con el resultado.

import { FOOD_TYPES, OBSTACLE_CONFIG, OBSTACLE_TYPES, POWERUP_TYPES } from './constants';

export const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function spawnFood(canvasWidth, gameSpeed) {
  const type = randomFrom(FOOD_TYPES);
  return {
    id: Date.now() + Math.random(),
    type,
    x: Math.random() * (canvasWidth - 100) + 50,
    y: -20,
    speed: (2 + Math.random() * 1.5) * gameSpeed,
  };
}

export function spawnObstacle(canvasWidth, scale, gameSpeed, timeScale) {
  const type = randomFrom(OBSTACLE_TYPES);
  const config = OBSTACLE_CONFIG[type];
  return {
    id: Date.now() + Math.random(),
    type,
    x: Math.random() * (canvasWidth - config.width * scale),
    y: -50,
    width: config.width * scale,
    height: config.height * scale,
    speed: (3 + Math.random() * 2) * gameSpeed * scale * timeScale,
  };
}

export function spawnPowerUp(canvasWidth, scale) {
  const powerUp = randomFrom(POWERUP_TYPES);
  return {
    id: Date.now() + Math.random(),
    ...powerUp,
    x: Math.random() * (canvasWidth - 100) + 50,
    y: -30,
    speed: 2 * scale,
    size: 20 * scale,
  };
}

export function spawnParticles(x, y, color, count, scale) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8 * scale,
      vy: (Math.random() - 0.5) * 8 * scale,
      life: 1.0,
      color,
      size: Math.random() * 3 * scale + 1,
    });
  }
  return particles;
}
