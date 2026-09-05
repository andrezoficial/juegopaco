import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PLAYER_BASE,
  SPAWN_RATES,
  DIFFICULTY,
  COMBO,
  PHYSICS,
  LEVELS,
  LEVEL_BONUS_LIFE_EVERY,
  MAX_LIVES,
  STORAGE_KEYS,
  WEATHER,
  THEME_TRANSITION_MS,
  getLevelForScore,
  pickWeatherType,
} from '../game/constants';
import { spawnFood, spawnObstacle, spawnPowerUp, spawnParticles } from '../game/entities';
import { checkCollisions } from '../game/collisions';
import { drawFrame } from '../game/render';
import { useAudio } from './useAudio';
import { useCanvasSize } from './useCanvasSize';
import { useKeyboardControls } from './useKeyboardControls';
import { useTouchControls } from './useTouchControls';
import { usePacoImage } from './usePacoImage';

export function useGameEngine() {
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  // Estados: 'start' | 'playing' | 'paused' | 'gameOver'
  const [gameState, setGameState] = useState('start');
  const [highScore, setHighScore] = useState(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEYS.highScore));
    return Number.isFinite(stored) ? stored : 0;
  });
  const [highestLevel, setHighestLevel] = useState(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEYS.highestLevel));
    return Number.isFinite(stored) && stored > 0 ? stored : 1;
  });
  const [combo, setCombo] = useState(1);
  const [showCombo, setShowCombo] = useState(false);
  const [comboPosition, setComboPosition] = useState({ x: 0, y: 0 });
  const [backgroundTheme, setBackgroundTheme] = useState('day');
  // Feedback visual cuando se rompe el combo
  const [comboBroken, setComboBroken] = useState(false);
  const [muted, setMutedState] = useState(false);

  // --- Sistema de niveles ---
  const [level, setLevel] = useState(1);
  const [levelName, setLevelName] = useState(LEVELS[0].name);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const levelInfoRef = useRef(LEVELS[0]);
  const levelNumberRef = useRef(1);
  const levelUpTimeoutRef = useRef(null);
  // Referencia al tema "actual" independiente del ciclo de render, para poder
  // saber de dónde viene la transición cuando cambia (día -> noche o viceversa).
  const currentThemeRef = useRef('day');

  const { pacoImageLoaded, pacoImageRef } = usePacoImage();
  const {
    playSound,
    resumeAudio,
    startMusic,
    stopMusic,
    setMusicIntensity,
    setAmbientTheme,
    startRain,
    stopRain,
    playWindGust,
    setMuted,
  } = useAudio();

  const playerRef = useRef({ ...PLAYER_BASE, velocityY: 0, isJumping: false, velocityX: 0, isMoving: false, facing: 1 });
  const { containerRef, canvasSize, isMobile } = useCanvasSize(playerRef);
  const keysRef = useKeyboardControls(isMobile);

  const foodsRef = useRef([]);
  const obstaclesRef = useRef([]);
  const particlesRef = useRef([]);
  const powerUpsRef = useRef([]);
  const gameSpeedRef = useRef(1);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const foodTimerRef = useRef(0);
  const obstacleTimerRef = useRef(0);
  const powerUpTimerRef = useRef(0);
  const collectedFoodsRef = useRef(new Set());
  const hitObstaclesRef = useRef(new Set());
  const activePowerUpsRef = useRef(new Set());
  const lastComboTimeRef = useRef(0);
  // Ref para leer el score más reciente en callbacks sin closure stale
  const scoreRef = useRef(0);
  const prevKeyStateRef = useRef({});

  // --- Clima dinámico ---
  const weatherRef = useRef('clear');
  const weatherCheckTimerRef = useRef(0);
  const windDirRef = useRef(1);
  const windStrengthRef = useRef(0);
  const windGustTimerRef = useRef(0);
  const windNextGustDelayRef = useRef(1200);
  // Intensidad de lluvia suavizada (0-1) para que la niebla/gotas aparezcan
  // y se disipen de forma gradual en vez de encender/apagar de golpe.
  const rainIntensityRef = useRef(0);

  // --- Transición animada de tema (amanecer/atardecer) ---
  const themeTransitionRef = useRef({ fromTheme: 'day', startTime: 0 });

  // Revisa si el puntaje actual cruzó el umbral del siguiente nivel y, de ser
  // así, aplica el salto de dificultad, el cambio de ambiente, el sonido/toast
  // y una posible vida extra.
  const checkLevelProgress = useCallback(
    (currentScore) => {
      const levelData = getLevelForScore(currentScore);
      if (levelData.level === levelNumberRef.current) return;

      levelNumberRef.current = levelData.level;
      levelInfoRef.current = levelData;
      setLevel(levelData.level);
      setLevelName(levelData.name);

      if (levelData.theme !== currentThemeRef.current) {
        themeTransitionRef.current = { fromTheme: currentThemeRef.current, startTime: performance.now() };
        currentThemeRef.current = levelData.theme;
        setAmbientTheme(levelData.theme);
      }
      setBackgroundTheme(levelData.theme);

      setHighestLevel((prev) => {
        const updated = Math.max(prev, levelData.level);
        localStorage.setItem(STORAGE_KEYS.highestLevel, String(updated));
        return updated;
      });

      playSound('levelUp');
      setShowLevelUp(true);
      clearTimeout(levelUpTimeoutRef.current);
      levelUpTimeoutRef.current = setTimeout(() => setShowLevelUp(false), 2200);

      if (levelData.level % LEVEL_BONUS_LIFE_EVERY === 0) {
        setLives((prev) => {
          if (prev >= MAX_LIVES) return prev;
          playSound('extraLife');
          return prev + 1;
        });
      }
    },
    [playSound, setAmbientTheme]
  );

  const spawnParticlesInto = useCallback(
    (x, y, color, count = 5) => {
      const scale = canvasSize.width / 800;
      particlesRef.current.push(...spawnParticles(x, y, color, count, scale));
    },
    [canvasSize.width]
  );

  useTouchControls({
    canvasRef,
    playerRef,
    canvasSize,
    isMobile,
    playSound,
    spawnJumpParticles: (x, y, count) => spawnParticlesInto(x, y, '#ffffff', count),
  });

  const createPowerUp = useCallback(() => {
    const scale = canvasSize.width / 800;
    powerUpsRef.current.push(spawnPowerUp(canvasSize.width, scale));
  }, [canvasSize.width]);

  const applyPowerUp = useCallback(
    (powerUp) => {
      playSound('powerUp');
      activePowerUpsRef.current.add(powerUp.type);
      spawnParticlesInto(powerUp.x, powerUp.y, powerUp.color, 15);

      setTimeout(() => {
        activePowerUpsRef.current.delete(powerUp.type);
      }, powerUp.duration);
    },
    [playSound, spawnParticlesInto]
  );

  const applyCollisionEvents = useCallback(
    (events) => {
      const currentTime = Date.now();

      events.collectedFoods.forEach((food) => {
        if (currentTime - lastComboTimeRef.current < COMBO.windowMs) {
          setCombo((prev) => prev + 1);
        } else {
          setCombo(2);
        }
        lastComboTimeRef.current = currentTime;

        setShowCombo(true);
        setComboPosition({ x: food.x, y: food.y - 20 });
        setTimeout(() => setShowCombo(false), 1000);

        const multiplier = activePowerUpsRef.current.has('doublePoints') ? 2 : 1;
        // Leer combo actual del ref para evitar closure stale
        setCombo((prevCombo) => {
          const comboMultiplier = Math.min(prevCombo, COMBO.maxMultiplier);
          const totalPoints = COMBO.basePoints * multiplier * comboMultiplier;

          setScore((prev) => {
            const newScore = prev + totalPoints;
            scoreRef.current = newScore;
            checkLevelProgress(newScore);
            return newScore;
          });

          if (prevCombo > 2) {
            playSound('collectCombo');
            spawnParticlesInto(food.x, food.y, '#ffeb3b', 10);
          } else {
            playSound('collect');
            spawnParticlesInto(food.x, food.y, '#ff6b6b', 5);
          }

          return prevCombo;
        });
      });

      events.collectedPowerUps.forEach((powerUp) => applyPowerUp(powerUp));

      events.hitObstacles.forEach((obstacle) => {
        playSound('hit');
        spawnParticlesInto(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, '#ff4444', 8);

        // Feedback visual de combo roto
        setCombo((prev) => {
          if (prev > 1) {
            setComboBroken(true);
            setTimeout(() => setComboBroken(false), 800);
          }
          return 1;
        });

        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            playSound('gameOver');
            stopMusic();
            stopRain();
            setGameState('gameOver');
            // Leer el score más reciente desde el ref, no desde el closure
            setHighScore((current) => {
              const updated = Math.max(current, scoreRef.current);
              localStorage.setItem(STORAGE_KEYS.highScore, String(updated));
              return updated;
            });
          }
          return Math.max(0, newLives);
        });
      });
    },
    [playSound, spawnParticlesInto, applyPowerUp, checkLevelProgress, stopMusic, stopRain]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = canvasSize.width / 800;

    const transition = themeTransitionRef.current;
    const themeProgress = Math.min(1, (performance.now() - transition.startTime) / THEME_TRANSITION_MS);

    particlesRef.current = drawFrame(ctx, canvas, {
      scale,
      isMobile,
      backgroundTheme,
      themeTransition: { fromTheme: transition.fromTheme, progress: themeProgress },
      weather: {
        rain: { intensity: rainIntensityRef.current },
        wind: { dir: windDirRef.current, strength: windStrengthRef.current },
      },
      player: playerRef.current,
      pacoImage: pacoImageRef.current,
      foods: foodsRef.current,
      obstacles: obstaclesRef.current,
      powerUps: powerUpsRef.current,
      particles: particlesRef.current,
      activePowerUps: activePowerUpsRef.current,
      hud: {
        score,
        lives,
        combo,
        showCombo,
        comboPosition,
        backgroundTheme,
        activePowerUps: activePowerUpsRef.current,
        comboBroken,
        level,
        levelName,
        showLevelUp,
        weather: weatherRef.current,
      },
    });
  }, [canvasSize.width, isMobile, backgroundTheme, score, lives, combo, showCombo, comboPosition, comboBroken, level, levelName, showLevelUp]);

  const gameLoop = useCallback(
    (timestamp) => {
      if (gameState !== 'playing') return;

      const deltaTime = Math.min(timestamp - lastTimeRef.current, PHYSICS.maxDeltaMs);
      lastTimeRef.current = timestamp;

      const player = playerRef.current;
      const scale = canvasSize.width / 800;
      const timeScale = activePowerUpsRef.current.has('slowMotion') ? 0.5 : 1;
      const scaledDeltaTime = deltaTime * timeScale;

      // --- Pausa con teclado (Escape o P) ---
      const keys = keysRef.current;
      const pausePressed = keys['Escape'] || keys['p'] || keys['P'];
      const wasPausePressed = prevKeyStateRef.current['Escape'] || prevKeyStateRef.current['p'] || prevKeyStateRef.current['P'];
      if (pausePressed && !wasPausePressed) {
        prevKeyStateRef.current = { ...keys };
        stopMusic();
        setGameState('paused');
        return;
      }
      prevKeyStateRef.current = { ...keys };

      if (!isMobile) {
        player.isMoving = false;
        if (keys['ArrowLeft'] && player.x > 0) {
          player.x -= PHYSICS.moveSpeed * scale * timeScale;
          player.isMoving = true;
          player.facing = -1;
        }
        if (keys['ArrowRight'] && player.x < canvasSize.width - player.width) {
          player.x += PHYSICS.moveSpeed * scale * timeScale;
          player.isMoving = true;
          player.facing = 1;
        }
        if ((keys['ArrowUp'] || keys[' ']) && !player.isJumping) {
          player.velocityY = PHYSICS.jumpVelocity * scale;
          player.isJumping = true;
          playSound('jump');
          spawnParticlesInto(player.x + player.width / 2, player.y + player.height, '#ffffff', 3);
        }
      }

      if (player.isJumping) {
        player.velocityY += PHYSICS.gravity * scale * timeScale;
        player.y += player.velocityY * timeScale;

        const groundY = canvasSize.height - PHYSICS.groundOffset * (canvasSize.height / 400);
        if (player.y >= groundY) {
          player.y = groundY;
          player.velocityY = 0;
          player.isJumping = false;
          if (player.velocityY > 5) {
            spawnParticlesInto(player.x + player.width / 2, player.y + player.height, '#8b4513', 4);
          }
        }
      }

      // --- Clima dinámico: cambia cada cierto intervalo (viento empuja a
      // Paco lateralmente, la lluvia reduce visibilidad de lo que acaba de
      // aparecer arriba). ---
      weatherCheckTimerRef.current += scaledDeltaTime;
      if (weatherCheckTimerRef.current > WEATHER.checkIntervalMs) {
        weatherCheckTimerRef.current = 0;
        const newWeather = pickWeatherType();
        if (newWeather !== weatherRef.current) {
          weatherRef.current = newWeather;
          if (newWeather === 'rain') {
            startRain();
          } else {
            stopRain();
          }
        }
      }

      if (weatherRef.current === 'wind') {
        windGustTimerRef.current += scaledDeltaTime;
        if (windGustTimerRef.current > windNextGustDelayRef.current) {
          windGustTimerRef.current = 0;
          windDirRef.current = Math.random() < 0.5 ? -1 : 1;
          const [minForce, maxForce] = WEATHER.wind.forceRange;
          windStrengthRef.current = minForce + Math.random() * (maxForce - minForce);
          const [minGust, maxGust] = WEATHER.wind.gustIntervalRangeMs;
          windNextGustDelayRef.current = minGust + Math.random() * (maxGust - minGust);
          playWindGust();
        }
        player.x += windDirRef.current * windStrengthRef.current * scale * timeScale;
        player.x = Math.max(0, Math.min(canvasSize.width - player.width, player.x));
        windStrengthRef.current *= WEATHER.wind.decay;
      } else {
        windStrengthRef.current *= 0.9;
      }

      const rainTarget = weatherRef.current === 'rain' ? 1 : 0;
      rainIntensityRef.current += (rainTarget - rainIntensityRef.current) * WEATHER.rain.fogSmoothing;

      const levelSpeedMult = levelInfoRef.current.speedMultiplier;
      const levelSpawnMult = levelInfoRef.current.spawnMultiplier;
      const effectiveGameSpeed = gameSpeedRef.current * levelSpeedMult;

      foodTimerRef.current += scaledDeltaTime;
      if (foodTimerRef.current > SPAWN_RATES.foodIntervalMs / (gameSpeedRef.current * levelSpawnMult)) {
        foodTimerRef.current = 0;
        foodsRef.current.push(spawnFood(canvasSize.width, effectiveGameSpeed));
      }

      obstacleTimerRef.current += scaledDeltaTime;
      if (obstacleTimerRef.current > SPAWN_RATES.obstacleIntervalMs / (gameSpeedRef.current * levelSpawnMult)) {
        obstacleTimerRef.current = 0;
        obstaclesRef.current.push(spawnObstacle(canvasSize.width, scale, effectiveGameSpeed, timeScale));
      }

      powerUpTimerRef.current += scaledDeltaTime;
      if (powerUpTimerRef.current > SPAWN_RATES.powerUpIntervalMs / gameSpeedRef.current && Math.random() < SPAWN_RATES.powerUpChance) {
        powerUpTimerRef.current = 0;
        createPowerUp();
      }

      foodsRef.current = foodsRef.current
        .map((food) => ({ ...food, y: food.y + food.speed * timeScale }))
        .filter((food) => food.y < canvasSize.height);

      obstaclesRef.current = obstaclesRef.current
        .map((obstacle) => ({ ...obstacle, y: obstacle.y + obstacle.speed * timeScale }))
        .filter((obstacle) => obstacle.y < canvasSize.height + 50);

      powerUpsRef.current = powerUpsRef.current
        .map((powerUp) => ({ ...powerUp, y: powerUp.y + powerUp.speed * timeScale }))
        .filter((powerUp) => powerUp.y < canvasSize.height);

      if (timestamp % DIFFICULTY.increaseEveryMs < 16) {
        gameSpeedRef.current = Math.min(gameSpeedRef.current + DIFFICULTY.speedIncrement, DIFFICULTY.maxGameSpeed);
        // La música sube de tempo/tono junto con la dificultad real (velocidad
        // base * multiplicador de nivel), para reforzar la sensación de "más rápido".
        const combinedSpeed = gameSpeedRef.current * levelInfoRef.current.speedMultiplier;
        setMusicIntensity(Math.min(1, (combinedSpeed - 1) / 4));
      }

      if (timestamp - lastComboTimeRef.current > COMBO.windowMs) {
        setCombo(1);
      }

      const events = checkCollisions({
        player,
        foods: foodsRef.current,
        powerUps: powerUpsRef.current,
        obstacles: obstaclesRef.current,
        collectedFoods: collectedFoodsRef.current,
        hitObstacles: hitObstaclesRef.current,
        shieldActive: activePowerUpsRef.current.has('shield'),
      });
      applyCollisionEvents(events);

      draw();

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [
      gameState,
      draw,
      applyCollisionEvents,
      playSound,
      spawnParticlesInto,
      createPowerUp,
      canvasSize,
      isMobile,
      keysRef,
      stopMusic,
      startRain,
      stopRain,
      playWindGust,
      setMusicIntensity,
    ]
  );

  const resetGameState = useCallback(() => {
    const scale = canvasSize.width / 800;
    playerRef.current = {
      x: PLAYER_BASE.x * scale,
      y: isMobile ? canvasSize.height - 80 : (PLAYER_BASE.y * canvasSize.height) / 400,
      width: PLAYER_BASE.width * scale,
      height: PLAYER_BASE.height * (canvasSize.height / 400),
      velocityY: 0,
      isJumping: false,
      velocityX: 0,
      isMoving: false,
    };
    foodsRef.current = [];
    obstaclesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    gameSpeedRef.current = 1;
    collectedFoodsRef.current.clear();
    hitObstaclesRef.current.clear();
    activePowerUpsRef.current.clear();
    scoreRef.current = 0;
    setScore(0);
    setLives(3);
    setCombo(1);
    setShowCombo(false);
    setComboBroken(false);

    currentThemeRef.current = 'day';
    setBackgroundTheme('day');
    themeTransitionRef.current = { fromTheme: 'day', startTime: performance.now() - THEME_TRANSITION_MS };

    weatherRef.current = 'clear';
    weatherCheckTimerRef.current = 0;
    windDirRef.current = 1;
    windStrengthRef.current = 0;
    windGustTimerRef.current = 0;
    windNextGustDelayRef.current = 1200;
    rainIntensityRef.current = 0;
    stopRain();

    levelNumberRef.current = 1;
    levelInfoRef.current = LEVELS[0];
    setLevel(1);
    setLevelName(LEVELS[0].name);
    setShowLevelUp(false);
    clearTimeout(levelUpTimeoutRef.current);
  }, [canvasSize, isMobile, stopRain]);

  const startGame = useCallback(() => {
    resetGameState();
    resumeAudio();
    setAmbientTheme('day');
    setMusicIntensity(0);
    startMusic();
    setGameState('playing');
  }, [resetGameState, resumeAudio, setAmbientTheme, setMusicIntensity, startMusic]);

  const restartGame = useCallback(() => {
    resetGameState();
    resumeAudio();
    setAmbientTheme('day');
    setMusicIntensity(0);
    startMusic();
    setGameState('playing');
  }, [resetGameState, resumeAudio, setAmbientTheme, setMusicIntensity, startMusic]);

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'playing') {
        stopMusic();
        return 'paused';
      }
      if (prev === 'paused') {
        startMusic();
        return 'playing';
      }
      return prev;
    });
  }, [stopMusic, startMusic]);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      setMuted(next);
      if (!next && gameState === 'playing') {
        // Al des-silenciar en pleno juego, retomamos música y ambiente.
        startMusic();
        setAmbientTheme(currentThemeRef.current);
        if (weatherRef.current === 'rain') startRain();
      }
      return next;
    });
  }, [setMuted, gameState, startMusic, setAmbientTheme, startRain]);

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gameLoop]);

  return {
    canvasRef,
    containerRef,
    canvasSize,
    isMobile,
    pacoImageLoaded,
    score,
    lives,
    highScore,
    highestLevel,
    level,
    levelName,
    gameState,
    backgroundTheme,
    muted,
    toggleMute,
    startGame,
    restartGame,
    togglePause,
  };
}
