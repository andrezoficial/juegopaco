// Actualiza físicamente las partículas y las dibuja en el mismo paso
// (igual que el original), devolviendo el array filtrado (partículas vivas).
export function drawParticles(ctx, particles) {
  const alive = particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 0.02;
    particle.vy += 0.1;

    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);

    return particle.life > 0;
  });
  ctx.globalAlpha = 1;
  return alive;
}
