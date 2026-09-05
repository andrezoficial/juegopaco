import { drawBackground } from './background';
import { drawFood } from './food';
import { drawObstacle } from './obstacles';
import { drawPowerUp } from './powerups';
import { drawParticles } from './particles';
import { drawCat } from './player';
import { drawHUD, drawPauseOverlay, drawLevelUpBanner } from './hud';
import { drawRain, drawWindEffect } from './weather';

export { drawBackground, drawFood, drawObstacle, drawPowerUp, drawParticles, drawCat, drawHUD, drawPauseOverlay, drawLevelUpBanner };

/**
 * Dibuja un frame completo del juego: fondo -> power-ups -> comida -> obstáculos
 * -> partículas -> jugador -> clima -> HUD -> overlay de pausa (si aplica).
 * Devuelve el array de partículas vivas para que el caller actualice el ref.
 */
export function drawFrame(ctx, canvas, { scale, isMobile, backgroundTheme, themeTransition, weather, player, pacoImage, foods, obstacles, powerUps, particles, activePowerUps, hud, isPaused }) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const windForBackground = weather?.wind?.strength > 0.05 ? weather.wind : null;
  drawBackground(ctx, canvas, scale, backgroundTheme, isMobile, themeTransition, { wind: windForBackground });

  powerUps.forEach((powerUp) => drawPowerUp(ctx, powerUp, scale));

  const time = Date.now() * 0.001;
  foods.forEach((food) => {
    const floatY = Math.sin(time * 3 + food.id * 0.01) * 2 * scale;
    drawFood(ctx, { ...food, y: food.y + floatY }, scale);
  });

  obstacles.forEach((obstacle) => drawObstacle(ctx, obstacle, scale));

  const aliveParticles = drawParticles(ctx, particles);

  drawCat(ctx, player.x, player.y, player.width, player.height, scale, activePowerUps, pacoImage, player.velocityY, {
    isMoving: player.isMoving,
    isJumping: player.isJumping,
    facing: player.facing || 1,
    groundY: canvas.height - 45 * scale,
  });

  // Clima: la lluvia se dibuja encima de las entidades (reduce visibilidad
  // real, no solo decorativa) y el viento se ve como rachas sutiles.
  if (weather) {
    drawRain(ctx, canvas, scale, weather.rain?.intensity || 0);
    drawWindEffect(ctx, canvas, scale, weather.wind?.dir || 1, weather.wind?.strength || 0);
  }

  drawHUD(ctx, canvas, scale, hud);

  if (hud.showLevelUp) {
    drawLevelUpBanner(ctx, canvas, scale, hud.level, hud.levelName);
  }

  if (isPaused) {
    drawPauseOverlay(ctx, canvas, scale);
  }

  return aliveParticles;
}
