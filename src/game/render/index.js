import { drawBackground } from './background';
import { drawFood } from './food';
import { drawObstacle } from './obstacles';
import { drawPowerUp } from './powerups';
import { drawParticles } from './particles';
import { drawCat } from './player';
import { drawHUD, drawPauseOverlay, drawLevelUpBanner } from './hud';

export { drawBackground, drawFood, drawObstacle, drawPowerUp, drawParticles, drawCat, drawHUD, drawPauseOverlay, drawLevelUpBanner };

/**
 * Dibuja un frame completo del juego: fondo -> power-ups -> comida -> obstáculos
 * -> partículas -> jugador -> HUD -> overlay de pausa (si aplica).
 * Devuelve el array de partículas vivas para que el caller actualice el ref.
 */
export function drawFrame(ctx, canvas, { scale, isMobile, backgroundTheme, player, foods, obstacles, powerUps, particles, activePowerUps, hud, isPaused }) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground(ctx, canvas, scale, backgroundTheme, isMobile);

  powerUps.forEach((powerUp) => drawPowerUp(ctx, powerUp, scale));

  const time = Date.now() * 0.001;
  foods.forEach((food) => {
    const floatY = Math.sin(time * 3 + food.id * 0.01) * 2 * scale;
    drawFood(ctx, { ...food, y: food.y + floatY }, scale);
  });

  obstacles.forEach((obstacle) => drawObstacle(ctx, obstacle, scale));

  const aliveParticles = drawParticles(ctx, particles);

  drawCat(ctx, player.x, player.y, player.width, player.height, scale, activePowerUps);

  drawHUD(ctx, canvas, scale, hud);

  if (hud.showLevelUp) {
    drawLevelUpBanner(ctx, canvas, scale, hud.level, hud.levelName);
  }

  if (isPaused) {
    drawPauseOverlay(ctx, canvas, scale);
  }

  return aliveParticles;
}
