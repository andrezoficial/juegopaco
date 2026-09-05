# 🐱 Paco en la Ciudad

Juego arcade 2D hecho con React y Canvas: esquiva obstáculos, recolecta comida y encadena combos.

## Cómo correrlo

```bash
npm install
npm start        # http://localhost:3000
npm test         # corre las pruebas
npm run build    # build de producción
```

## Arquitectura

El código está organizado por responsabilidad. `App.js` ya no contiene lógica de
juego: solo compone componentes y usa el hook `useGameEngine`.

```
src/
├── App.js                     # Composición de alto nivel (sin lógica de juego)
│
├── game/                      # Lógica de juego pura (sin React, fácil de testear)
│   ├── constants.js           # Configuración: física, spawn rates, dificultad
│   ├── entities.js            # Fábricas: spawnFood, spawnObstacle, spawnPowerUp...
│   ├── collisions.js          # Detección de colisiones (devuelve eventos)
│   └── render/                # Funciones de dibujo en canvas
│       ├── background.js      # Cielo, sol/luna, edificios, suelo
│       ├── player.js          # Dibuja a Paco
│       ├── food.js            # Dibuja pescado, leche, croquetas
│       ├── obstacles.js       # Dibuja perro, caja, pájaro
│       ├── powerups.js        # Dibuja power-ups
│       ├── particles.js       # Actualiza y dibuja partículas
│       ├── hud.js             # Puntaje, vidas, combo, power-ups activos
│       └── index.js           # drawFrame(): compone todas las capas
│
├── hooks/                     # Integración de la lógica de juego con React
│   ├── useGameEngine.js       # Orquestador: estado, game loop, spawns, colisiones
│   ├── useCanvasSize.js       # Tamaño responsivo del canvas + detección móvil
│   ├── useKeyboardControls.js # Flechas / espacio
│   ├── useTouchControls.js    # Deslizar para mover, doble toque para saltar
│   ├── useAudio.js            # Efectos de sonido sintetizados (Web Audio API)
│   └── usePacoImage.js        # Precarga del sprite de Paco
│
└── components/                # Componentes de presentación (solo JSX)
    ├── Header.js
    ├── GameCanvas.js
    ├── GameOverScreen.js
    └── Footer.js
```

### Por qué esta separación

- **`game/`** no importa React ni hooks: son funciones puras (entrada → salida).
  Esto permite testearlas sin renderizar nada y reutilizarlas si el juego
  cambiara de motor de render en el futuro.
- **`hooks/`** conecta esa lógica con el ciclo de vida de React (refs, estado,
  efectos). `useGameEngine` es el único lugar que sabe "cómo se junta todo".
- **`components/`** solo reciben props y devuelven JSX. No tienen lógica de
  juego ni acceden a refs del motor.

### Qué se limpió

- `App.js` pasó de **1362 líneas monolíticas** a un archivo de composición de
  ~50 líneas.
- Se eliminó código muerto: había un intento de refactor anterior
  (`components/Game.js`, `components/GameOver.js`, `hooks/useGameEngine.js`
  viejo) que no estaba conectado a `index.js` y nunca se ejecutaba.
- Se quitaron assets sin usar (`logo.svg`, `App.css` de la plantilla de
  Create React App).
- Se reemplazó el test de ejemplo de CRA (buscaba el texto "learn react",
  que nunca existió en este juego) por una prueba real del juego.

## Próximos pasos sugeridos

- Extraer los estilos inline a CSS/CSS Modules.
- Agregar tests unitarios a `game/collisions.js` y `game/entities.js`
  (son funciones puras, son las más fáciles y valiosas de testear).
- Mover los "magic numbers" que aún quedan en `useGameEngine.js` a `constants.js`.
