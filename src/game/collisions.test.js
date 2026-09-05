import { checkCollisions } from './collisions';

// Jugador de referencia usado en la mayoría de los casos.
const basePlayer = { x: 100, y: 100, width: 50, height: 50 };

function makeArgs(overrides = {}) {
  return {
    player: basePlayer,
    foods: [],
    powerUps: [],
    obstacles: [],
    collectedFoods: new Set(),
    hitObstacles: new Set(),
    shieldActive: false,
    ...overrides,
  };
}

describe('checkCollisions', () => {
  test('detecta comida cercana al centro del jugador y la elimina del arreglo', () => {
    const foods = [{ id: 'f1', x: 120, y: 120 }]; // dentro del radio de colisión
    const args = makeArgs({ foods });

    const events = checkCollisions(args);

    expect(events.collectedFoods).toHaveLength(1);
    expect(events.collectedFoods[0].id).toBe('f1');
    expect(foods).toHaveLength(0); // se elimina del arreglo original (mutación esperada)
    expect(args.collectedFoods.has('f1')).toBe(true);
  });

  test('ignora comida fuera de rango', () => {
    const foods = [{ id: 'f1', x: 500, y: 500 }];
    const args = makeArgs({ foods });

    const events = checkCollisions(args);

    expect(events.collectedFoods).toHaveLength(0);
    expect(foods).toHaveLength(1);
  });

  test('no vuelve a recolectar comida ya marcada como recolectada', () => {
    const foods = [{ id: 'f1', x: 120, y: 120 }];
    const collectedFoods = new Set(['f1']);
    const args = makeArgs({ foods, collectedFoods });

    const events = checkCollisions(args);

    expect(events.collectedFoods).toHaveLength(0);
    expect(foods).toHaveLength(1); // no se toca porque ya estaba marcada
  });

  test('detecta power-ups en rango y los elimina del arreglo', () => {
    const powerUps = [{ id: 'p1', x: 110, y: 110 }];
    const args = makeArgs({ powerUps });

    const events = checkCollisions(args);

    expect(events.collectedPowerUps).toHaveLength(1);
    expect(powerUps).toHaveLength(0);
  });

  test('detecta colisión con obstáculo cuando los rectángulos se superponen', () => {
    const obstacles = [{ id: 'o1', x: 110, y: 110, width: 30, height: 30 }];
    const args = makeArgs({ obstacles });

    const events = checkCollisions(args);

    expect(events.hitObstacles).toHaveLength(1);
    expect(events.hitObstacles[0].id).toBe('o1');
  });

  test('no detecta colisión con obstáculo fuera de rango', () => {
    const obstacles = [{ id: 'o1', x: 500, y: 500, width: 30, height: 30 }];
    const args = makeArgs({ obstacles });

    const events = checkCollisions(args);

    expect(events.hitObstacles).toHaveLength(0);
  });

  test('con el escudo activo, ignora colisiones con obstáculos', () => {
    const obstacles = [{ id: 'o1', x: 110, y: 110, width: 30, height: 30 }];
    const args = makeArgs({ obstacles, shieldActive: true });

    const events = checkCollisions(args);

    expect(events.hitObstacles).toHaveLength(0);
  });

  test('no reporta dos veces el mismo obstáculo ya golpeado', () => {
    const obstacles = [{ id: 'o1', x: 110, y: 110, width: 30, height: 30 }];
    const hitObstacles = new Set(['o1']);
    const args = makeArgs({ obstacles, hitObstacles });

    const events = checkCollisions(args);

    expect(events.hitObstacles).toHaveLength(0);
  });

  test('procesa múltiples entidades en el mismo frame de forma independiente', () => {
    const foods = [{ id: 'f1', x: 120, y: 120 }, { id: 'f2', x: 500, y: 500 }];
    const powerUps = [{ id: 'p1', x: 110, y: 110 }];
    const obstacles = [{ id: 'o1', x: 105, y: 105, width: 20, height: 20 }];
    const args = makeArgs({ foods, powerUps, obstacles });

    const events = checkCollisions(args);

    expect(events.collectedFoods.map((f) => f.id)).toEqual(['f1']);
    expect(events.collectedPowerUps.map((p) => p.id)).toEqual(['p1']);
    expect(events.hitObstacles.map((o) => o.id)).toEqual(['o1']);
  });
});
