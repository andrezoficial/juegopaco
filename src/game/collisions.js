// Detección de colisiones. No toca useState directamente: devuelve una lista
// de "eventos" que el hook orquestador (useGameEngine) traduce a cambios de
// estado, sonidos y partículas. Así esta lógica se puede testear sola.

const COLLISION_RADIUS = 25;

function circleHit(ax, ay, bx, by, radius = COLLISION_RADIUS) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy) < radius;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Revisa colisiones del jugador contra comida, power-ups y obstáculos.
 * Muta `foods` y `powerUps` (elimina lo recolectado), igual que el motor original.
 * Devuelve los eventos ocurridos en este frame para que el caller aplique efectos.
 */
export function checkCollisions({ player, foods, powerUps, obstacles, collectedFoods, hitObstacles, shieldActive }) {
  const events = { collectedFoods: [], collectedPowerUps: [], hitObstacles: [] };
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  for (let i = foods.length - 1; i >= 0; i--) {
    const food = foods[i];
    if (collectedFoods.has(food.id)) continue;
    if (circleHit(playerCenterX, playerCenterY, food.x, food.y)) {
      collectedFoods.add(food.id);
      foods.splice(i, 1);
      events.collectedFoods.push(food);
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    if (circleHit(playerCenterX, playerCenterY, powerUp.x, powerUp.y)) {
      powerUps.splice(i, 1);
      events.collectedPowerUps.push(powerUp);
    }
  }

  if (!shieldActive) {
    obstacles.forEach((obstacle) => {
      if (hitObstacles.has(obstacle.id)) return;
      if (rectsOverlap(player, obstacle)) {
        hitObstacles.add(obstacle.id);
        events.hitObstacles.push(obstacle);
      }
    });
  }

  return events;
}
