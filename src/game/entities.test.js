import {
  randomFrom,
  spawnFood,
  spawnObstacle,
  spawnPowerUp,
  spawnParticles,
} from './entities';
import { FOOD_TYPES, OBSTACLE_TYPES, OBSTACLE_CONFIG, POWERUP_TYPES } from './constants';

describe('randomFrom', () => {
  test('siempre devuelve un elemento perteneciente al arreglo', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(randomFrom(arr));
    }
  });
});

describe('spawnFood', () => {
  test('genera comida de un tipo válido, arriba del canvas y dentro del ancho', () => {
    const canvasWidth = 800;
    const food = spawnFood(canvasWidth, 1);

    expect(FOOD_TYPES).toContain(food.type);
    expect(food.y).toBeLessThan(0); // nace fuera de pantalla, por arriba
    expect(food.x).toBeGreaterThanOrEqual(50);
    expect(food.x).toBeLessThanOrEqual(canvasWidth - 50);
    expect(food.speed).toBeGreaterThan(0);
    expect(typeof food.id).toBe('number');
  });

  test('la velocidad escala con gameSpeed', () => {
    const slow = spawnFood(800, 1);
    const fast = spawnFood(800, 3);
    // El rango de velocidad base es el mismo; comprobamos la cota superior escalada.
    expect(fast.speed).toBeLessThanOrEqual((2 + 1.5) * 3);
    expect(slow.speed).toBeLessThanOrEqual((2 + 1.5) * 1);
  });

  test('genera ids distintos en llamadas sucesivas', () => {
    const a = spawnFood(800, 1);
    const b = spawnFood(800, 1);
    expect(a.id).not.toBe(b.id);
  });
});

describe('spawnObstacle', () => {
  test('genera un obstáculo de tipo válido con dimensiones escaladas', () => {
    const canvasWidth = 800;
    const scale = 2;
    const obstacle = spawnObstacle(canvasWidth, scale, 1, 1);

    expect(OBSTACLE_TYPES).toContain(obstacle.type);
    const config = OBSTACLE_CONFIG[obstacle.type];
    expect(obstacle.width).toBe(config.width * scale);
    expect(obstacle.height).toBe(config.height * scale);
    expect(obstacle.y).toBeLessThan(0);
    expect(obstacle.x).toBeGreaterThanOrEqual(0);
    expect(obstacle.x).toBeLessThanOrEqual(canvasWidth - obstacle.width);
  });

  test('la velocidad crece con gameSpeed y timeScale', () => {
    const base = spawnObstacle(800, 1, 1, 1);
    const boosted = spawnObstacle(800, 1, 2, 2);
    // Cota superior teórica de velocidad: (3 + 2) * gameSpeed * scale * timeScale
    expect(boosted.speed).toBeLessThanOrEqual(5 * 2 * 1 * 2);
    expect(base.speed).toBeLessThanOrEqual(5 * 1 * 1 * 1);
  });
});

describe('spawnPowerUp', () => {
  test('genera un power-up con un tipo válido y tamaño escalado', () => {
    const scale = 1.5;
    const powerUp = spawnPowerUp(800, scale);

    const validTypes = POWERUP_TYPES.map((p) => p.type);
    expect(validTypes).toContain(powerUp.type);
    expect(powerUp.size).toBe(20 * scale);
    expect(powerUp.speed).toBe(2 * scale);
    expect(powerUp.y).toBeLessThan(0);
  });

  test('conserva el color y duración definidos en POWERUP_TYPES', () => {
    // Forzamos determinismo mockeando Math.random para elegir siempre el primero.
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0);
    const powerUp = spawnPowerUp(800, 1);
    spy.mockRestore();

    expect(powerUp.type).toBe(POWERUP_TYPES[0].type);
    expect(powerUp.color).toBe(POWERUP_TYPES[0].color);
    expect(powerUp.duration).toBe(POWERUP_TYPES[0].duration);
  });
});

describe('spawnParticles', () => {
  test('genera exactamente `count` partículas con vida inicial de 1.0', () => {
    const particles = spawnParticles(50, 50, '#fff', 8, 1);

    expect(particles).toHaveLength(8);
    particles.forEach((p) => {
      expect(p.x).toBe(50);
      expect(p.y).toBe(50);
      expect(p.color).toBe('#fff');
      expect(p.life).toBe(1.0);
      expect(p.size).toBeGreaterThan(0);
    });
  });

  test('escala la velocidad de las partículas con el parámetro scale', () => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(1); // vx/vy máximos
    const particles = spawnParticles(0, 0, '#000', 1, 2);
    spy.mockRestore();

    // (Math.random() - 0.5) * 8 * scale con random=1 => 0.5 * 8 * 2 = 8
    expect(particles[0].vx).toBeCloseTo(8);
    expect(particles[0].vy).toBeCloseTo(8);
  });

  test('devuelve un arreglo vacío si count es 0', () => {
    expect(spawnParticles(0, 0, '#000', 0, 1)).toEqual([]);
  });
});
