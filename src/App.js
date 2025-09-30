import React, { useEffect, useRef, useState, useCallback } from 'react';

const Game = () => {
  const canvasRef = useRef(null);
  const gameContainerRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('playing');
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [showCombo, setShowCombo] = useState(false);
  const [comboPosition, setComboPosition] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ 
    width: 800, 
    height: 400 
  });
  const [backgroundTheme, setBackgroundTheme] = useState('day');
  
  const playerRef = useRef({
    x: 100,
    y: 320,
    width: 50,
    height: 45,
    velocityY: 0,
    isJumping: false,
    velocityX: 0,
    isMoving: false
  });
  
  const foodsRef = useRef([]);
  const obstaclesRef = useRef([]);
  const particlesRef = useRef([]);
  const gameSpeedRef = useRef(1);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const foodTimerRef = useRef(0);
  const obstacleTimerRef = useRef(0);
  const powerUpTimerRef = useRef(0);
  const collectedFoodsRef = useRef(new Set());
  const hitObstaclesRef = useRef(new Set());
  const keysRef = useRef({});
  const audioContextRef = useRef(null);
  const soundBuffersRef = useRef({});
  const lastComboTimeRef = useRef(0);
  const powerUpsRef = useRef([]);
  const activePowerUpsRef = useRef(new Set());
  const touchStartXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastTouchXRef = useRef(0);

  // Detectar si es móvil
  const isMobile = typeof navigator !== 'undefined' ? 
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false;

  // Ajustar tamaño del canvas responsivamente
  const updateCanvasSize = useCallback(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // En móviles: usar casi toda la pantalla pero mantener relación de aspecto
    if (isMobile) {
      const maxWidth = Math.min(800, containerWidth - 20);
      const height = Math.min(400, containerHeight * 0.7); // 70% del alto disponible
      
      setCanvasSize({
        width: maxWidth,
        height: height
      });

      const scaleFactor = maxWidth / 800;
      playerRef.current = {
        ...playerRef.current,
        x: 100 * scaleFactor,
        y: height - 80,
        width: 50 * scaleFactor,
        height: 45 * (height / 400)
      };
    } else {
      // En desktop: tamaño fijo pero responsivo
      const maxWidth = Math.min(800, containerWidth - 40);
      const height = Math.min(400, maxWidth * 0.5);
      
      setCanvasSize({
        width: maxWidth,
        height: height
      });

      const scaleFactor = maxWidth / 800;
      playerRef.current = {
        ...playerRef.current,
        x: 100 * scaleFactor,
        y: (320 * height) / 400,
        width: 50 * scaleFactor,
        height: 45 * (height / 400)
      };
    }
  }, [isMobile]);

  // 🔥 PRIMERO: Definir playSound antes que cualquier función que la use
  const playSound = useCallback((soundName) => {
    if (soundBuffersRef.current[soundName]) {
      soundBuffersRef.current[soundName]();
    }
  }, []);

  // 🔥 SEGUNDO: Inicializar sistema de audio
  const initAudio = useCallback(async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      const createSound = (frequency, duration, type = 'sine') => {
        return () => {
          if (!audioContextRef.current) return;
          
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          oscillator.type = type;
          oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
          
          gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
          
          oscillator.start();
          oscillator.stop(audioContextRef.current.currentTime + duration);
        };
      };

      soundBuffersRef.current = {
        collect: createSound(800, 0.1, 'sine'),
        collectCombo: createSound(1200, 0.2, 'sine'),
        hit: createSound(200, 0.3, 'sawtooth'),
        jump: createSound(400, 0.1, 'triangle'),
        powerUp: createSound(600, 0.5, 'square'),
        gameOver: createSound(150, 1.0, 'sawtooth')
      };
    } catch (error) {
      console.log('Audio no disponible');
    }
  }, []);

  // Sistema de partículas
  const createParticles = useCallback((x, y, color, count = 5) => {
    const scale = canvasSize.width / 800;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8 * scale,
        vy: (Math.random() - 0.5) * 8 * scale,
        life: 1.0,
        color,
        size: Math.random() * 3 * scale + 1
      });
    }
  }, [canvasSize.width]);

  // Power-ups
  const createPowerUp = useCallback(() => {
    const powerUpTypes = [
      { type: 'shield', color: '#4a90e2', duration: 5000 },
      { type: 'doublePoints', color: '#ffeb3b', duration: 8000 },
      { type: 'slowMotion', color: '#90ee90', duration: 6000 }
    ];
    
    const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const scale = canvasSize.width / 800;
    
    powerUpsRef.current.push({
      id: Date.now() + Math.random(),
      ...powerUp,
      x: Math.random() * (canvasSize.width - 100) + 50,
      y: -30,
      speed: 2 * scale,
      size: 20 * scale
    });
  }, [canvasSize.width]);

  const applyPowerUp = useCallback((powerUp) => {
    playSound('powerUp');
    activePowerUpsRef.current.add(powerUp.type);
    
    createParticles(powerUp.x, powerUp.y, powerUp.color, 15);
    
    setTimeout(() => {
      activePowerUpsRef.current.delete(powerUp.type);
    }, powerUp.duration);
  }, [playSound, createParticles]);

  // Controles táctiles mejorados para móviles
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    touchStartXRef.current = x;
    lastTouchXRef.current = x;
    isDraggingRef.current = true;
    
    // Salto al tocar en cualquier parte de la pantalla
    if (!playerRef.current.isJumping) {
      playerRef.current.velocityY = -12 * (canvasSize.height / 400);
      playerRef.current.isJumping = true;
      playSound('jump');
      createParticles(
        playerRef.current.x + playerRef.current.width/2, 
        playerRef.current.y + playerRef.current.height, 
        '#ffffff', 
        3
      );
    }
  }, [canvasSize.height, playSound, createParticles]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!isDraggingRef.current) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    const deltaX = x - lastTouchXRef.current;
    lastTouchXRef.current = x;
    
    if (Math.abs(deltaX) > 2) {
      const player = playerRef.current;
      const scaleFactor = canvasSize.width / 800;
      const moveSpeed = 8 * scaleFactor;
      
      if (deltaX > 0 && player.x < canvasSize.width - player.width) {
        player.x += moveSpeed;
        player.isMoving = true;
      } else if (deltaX < 0 && player.x > 0) {
        player.x -= moveSpeed;
        player.isMoving = true;
      }
    }
  }, [canvasSize.width]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = false;
    playerRef.current.isMoving = false;
  }, []);

  // 🔥 AÑADIR: Función checkCollisions
  const checkCollisions = useCallback(() => {
    const player = playerRef.current;
    const currentTime = Date.now();
    
    // Colisión con comida
    foodsRef.current.forEach((food, index) => {
      if (collectedFoodsRef.current.has(food.id)) return;
      
      const dx = player.x + player.width/2 - food.x;
      const dy = player.y + player.height/2 - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 25) {
        // Marcar como recolectada y eliminar del array
        collectedFoodsRef.current.add(food.id);
        foodsRef.current.splice(index, 1);
        
        // Sistema de combo
        if (currentTime - lastComboTimeRef.current < 2000) {
          setCombo(prev => prev + 1);
        } else {
          setCombo(2);
        }
        lastComboTimeRef.current = currentTime;
        
        // Mostrar combo
        setShowCombo(true);
        setComboPosition({ x: food.x, y: food.y - 20 });
        setTimeout(() => setShowCombo(false), 1000);
        
        // Puntos con multiplicador
        const basePoints = 10;
        const multiplier = activePowerUpsRef.current.has('doublePoints') ? 2 : 1;
        const comboMultiplier = Math.min(combo, 5);
        const totalPoints = basePoints * multiplier * comboMultiplier;
        
        setScore(prev => {
          const newScore = prev + totalPoints;
          // Cambiar a tema nocturno al alcanzar 150 puntos
          if (newScore >= 150 && backgroundTheme === 'day') {
            setBackgroundTheme('night');
          }
          return newScore;
        });
        
        // Sonido y partículas
        if (combo > 2) {
          playSound('collectCombo');
          createParticles(food.x, food.y, '#ffeb3b', 10);
        } else {
          playSound('collect');
          createParticles(food.x, food.y, '#ff6b6b', 5);
        }
      }
    });
    
    // Colisión con power-ups
    powerUpsRef.current.forEach((powerUp, index) => {
      const dx = player.x + player.width/2 - powerUp.x;
      const dy = player.y + player.height/2 - powerUp.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 25) {
        applyPowerUp(powerUp);
        powerUpsRef.current.splice(index, 1);
      }
    });
    
    // Colisión con obstáculos (omitir si tiene escudo)
    if (!activePowerUpsRef.current.has('shield')) {
      obstaclesRef.current.forEach((obstacle, index) => {
        if (hitObstaclesRef.current.has(obstacle.id)) return;
        
        if (
          player.x < obstacle.x + obstacle.width &&
          player.x + player.width > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + player.height > obstacle.y
        ) {
          hitObstaclesRef.current.add(obstacle.id);
          playSound('hit');
          createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, '#ff4444', 8);
          
          setCombo(1); // Reset combo
          
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              playSound('gameOver');
              setGameState('gameOver');
              setHighScore(current => Math.max(current, score));
            }
            return Math.max(0, newLives);
          });
        }
      });
    }
  }, [score, combo, playSound, createParticles, applyPowerUp, backgroundTheme]);

  // Funciones de dibujo (drawFood, drawObstacle, etc.)
  const drawFood = useCallback((ctx, food) => {
    ctx.save();
    
    const scale = canvasSize.width / 800;
    
    if (food.type === 'fish') {
      ctx.fillStyle = '#ff6b6b';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      ctx.ellipse(food.x, food.y, 15 * scale, 8 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff8e8e';
      ctx.beginPath();
      ctx.moveTo(food.x - 15 * scale, food.y);
      ctx.lineTo(food.x - 22 * scale, food.y - 8 * scale);
      ctx.lineTo(food.x - 22 * scale, food.y + 8 * scale);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(food.x + 5 * scale, food.y - 2 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(food.x + 5 * scale, food.y - 2 * scale, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (food.type === 'milk') {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#87ceeb';
      ctx.shadowBlur = 8 * scale;
      ctx.fillRect(food.x - 10 * scale, food.y - 15 * scale, 20 * scale, 30 * scale);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#e8f4f8';
      ctx.fillRect(food.x - 8 * scale, food.y - 13 * scale, 16 * scale, 26 * scale);
      
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(food.x - 10 * scale, food.y - 18 * scale, 20 * scale, 5 * scale);
    } else if (food.type === 'croquettes') {
      ctx.fillStyle = '#d2691e';
      ctx.shadowColor = '#a0522d';
      ctx.shadowBlur = 5 * scale;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(food.x + (i - 1) * 8 * scale, food.y, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }, [canvasSize.width]);

  const drawObstacle = useCallback((ctx, obstacle) => {
    ctx.save();
    
    const scale = canvasSize.width / 800;
    
    if (obstacle.type === 'dog') {
      // Perro cayendo del cielo (rotado)
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
      ctx.rotate(Math.PI); // Rotar 180 grados para que caiga boca abajo
      
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height);
      
      ctx.fillRect(-obstacle.width/2 + 15 * scale, -obstacle.height/2 - 10 * scale, 15 * scale, 15 * scale);
      
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(-obstacle.width/2 + 18 * scale, -obstacle.height/2 - 8 * scale, 5 * scale, 12 * scale);
      ctx.fillRect(-obstacle.width/2 + 5 * scale, -obstacle.height/2 - 8 * scale, 5 * scale, 12 * scale);
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-obstacle.width/2 + 8 * scale, -obstacle.height/2 - 5 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.moveTo(-obstacle.width/2, -obstacle.height/2 + 5 * scale);
      ctx.lineTo(-obstacle.width/2 - 10 * scale, -obstacle.height/2 - 5 * scale);
      ctx.lineTo(-obstacle.width/2, -obstacle.height/2);
      ctx.fill();
      
      ctx.fillRect(-obstacle.width/2 + 5 * scale, -obstacle.height/2 + obstacle.height, 8 * scale, 10 * scale);
      ctx.fillRect(-obstacle.width/2 + obstacle.width - 13 * scale, -obstacle.height/2 + obstacle.height, 8 * scale, 10 * scale);
      
      ctx.restore();
    } else if (obstacle.type === 'box') {
      // Caja cayendo del cielo (con efecto de rotación)
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
      const rotation = (Date.now() * 0.01) % (Math.PI * 2); // Rotación continua
      ctx.rotate(rotation);
      
      ctx.fillStyle = '#d2691e';
      ctx.fillRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height);
      
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-obstacle.width/2 + 5 * scale, -obstacle.height/2 + 5 * scale, obstacle.width - 10 * scale, obstacle.height - 10 * scale);
      
      ctx.fillStyle = '#a0522d';
      ctx.beginPath();
      ctx.moveTo(-obstacle.width/2, -obstacle.height/2);
      ctx.lineTo(-obstacle.width/2 + 10 * scale, -obstacle.height/2 - 10 * scale);
      ctx.lineTo(-obstacle.width/2 + obstacle.width + 10 * scale, -obstacle.height/2 - 10 * scale);
      ctx.lineTo(-obstacle.width/2 + obstacle.width, -obstacle.height/2);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    } else if (obstacle.type === 'bird') {
      // Nuevo obstáculo: pájaro
      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      
      // Cuerpo del pájaro
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Alas (animadas)
      const wingFlap = Math.sin(Date.now() * 0.01) * 5 * scale;
      ctx.fillStyle = '#ff8e8e';
      ctx.beginPath();
      ctx.ellipse(-8 * scale, wingFlap, 8 * scale, 5 * scale, Math.PI/4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(8 * scale, wingFlap, 8 * scale, 5 * scale, -Math.PI/4, 0, Math.PI * 2);
      ctx.fill();
      
      // Pico
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.moveTo(12 * scale, 0);
      ctx.lineTo(20 * scale, -3 * scale);
      ctx.lineTo(20 * scale, 3 * scale);
      ctx.closePath();
      ctx.fill();
      
      // Ojo
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-5 * scale, -5 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.restore();
  }, [canvasSize.width]);

  const drawParticles = useCallback((ctx) => {
    particlesRef.current = particlesRef.current.filter(particle => {
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
  }, []);

  const drawPowerUp = useCallback((ctx, powerUp) => {
    ctx.save();
    
    const scale = canvasSize.width / 800;
    
    ctx.shadowColor = powerUp.color;
    ctx.shadowBlur = 15 * scale;
    
    ctx.fillStyle = powerUp.color;
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (powerUp.type === 'shield') {
      ctx.fillText('🛡️', powerUp.x, powerUp.y);
    } else if (powerUp.type === 'doublePoints') {
      ctx.fillText('2×', powerUp.x, powerUp.y);
    } else if (powerUp.type === 'slowMotion') {
      ctx.fillText('🐌', powerUp.x, powerUp.y);
    }
    
    ctx.restore();
  }, [canvasSize.width]);

  // Dibujar gato
  const drawCat = useCallback((ctx, x, y, width, height) => {
    ctx.save();
    
    const scale = canvasSize.width / 800;
    
    if (activePowerUpsRef.current.has('shield')) {
      ctx.shadowColor = '#4a90e2';
      ctx.shadowBlur = 20 * scale;
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(x + width/2, y + height/2, 35 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Cuerpo principal - gris
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(x, y + 10 * scale, width, height - 10 * scale);
    
    // Cabeza
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.arc(x + width/2, y + 12 * scale, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Orejas
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath();
    ctx.moveTo(x + 10 * scale, y + 5 * scale);
    ctx.lineTo(x + 5 * scale, y - 5 * scale);
    ctx.lineTo(x + 15 * scale, y + 8 * scale);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + width - 10 * scale, y + 5 * scale);
    ctx.lineTo(x + width - 5 * scale, y - 5 * scale);
    ctx.lineTo(x + width - 15 * scale, y + 8 * scale);
    ctx.fill();
    
    // Interior orejas rosa
    ctx.fillStyle = '#ffb3ba';
    ctx.beginPath();
    ctx.moveTo(x + 10 * scale, y + 5 * scale);
    ctx.lineTo(x + 8 * scale, y);
    ctx.lineTo(x + 13 * scale, y + 7 * scale);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + width - 10 * scale, y + 5 * scale);
    ctx.lineTo(x + width - 8 * scale, y);
    ctx.lineTo(x + width - 13 * scale, y + 7 * scale);
    ctx.fill();
    
    // Pecho blanco
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + width/2, y + 25 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + width/2 - 8 * scale, y + 25 * scale, 16 * scale, 20 * scale);
    
    // Cara blanca
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + width/2 - 10 * scale, y + 15 * scale, 20 * scale, 12 * scale);
    
    // Nariz rosa
    ctx.fillStyle = '#ffb3ba';
    ctx.beginPath();
    ctx.moveTo(x + width/2, y + 20 * scale);
    ctx.lineTo(x + width/2 - 3 * scale, y + 17 * scale);
    ctx.lineTo(x + width/2 + 3 * scale, y + 17 * scale);
    ctx.fill();
    
    // Ojos (cerrados si está en slow motion)
    if (activePowerUpsRef.current.has('slowMotion')) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x + width/2 - 9 * scale, y + 12 * scale);
      ctx.lineTo(x + width/2 - 3 * scale, y + 12 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + width/2 + 3 * scale, y + 12 * scale);
      ctx.lineTo(x + width/2 + 9 * scale, y + 12 * scale);
      ctx.stroke();
    } else {
      // Ojos verdes normales
      ctx.fillStyle = '#90ee90';
      ctx.beginPath();
      ctx.arc(x + width/2 - 7 * scale, y + 12 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width/2 + 7 * scale, y + 12 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupilas
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x + width/2 - 7 * scale, y + 12 * scale, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width/2 + 7 * scale, y + 12 * scale, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Bigotes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(x + width/2 - 5 * scale, y + 18 * scale);
    ctx.lineTo(x + 5 * scale, y + 16 * scale);
    ctx.moveTo(x + width/2 - 5 * scale, y + 20 * scale);
    ctx.lineTo(x + 3 * scale, y + 20 * scale);
    ctx.moveTo(x + width/2 + 5 * scale, y + 18 * scale);
    ctx.lineTo(x + width - 5 * scale, y + 16 * scale);
    ctx.moveTo(x + width/2 + 5 * scale, y + 20 * scale);
    ctx.lineTo(x + width - 3 * scale, y + 20 * scale);
    ctx.stroke();
    
    // Patas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 8 * scale, y + height - 5 * scale, 10 * scale, 5 * scale);
    ctx.fillRect(x + width - 18 * scale, y + height - 5 * scale, 10 * scale, 5 * scale);
    
    // Cola
    ctx.strokeStyle = '#7a7a7a';
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y + 20 * scale);
    ctx.quadraticCurveTo(x - 15 * scale, y + 15 * scale, x - 18 * scale, y + 25 * scale);
    ctx.stroke();
    
    ctx.restore();
  }, [canvasSize.width]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const player = playerRef.current;
    const scale = canvasSize.width / 800;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo según el tema
    if (backgroundTheme === 'day') {
      // Cielo diurno con degradado
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87ceeb');
      gradient.addColorStop(0.7, '#e0f6ff');
      gradient.addColorStop(1, '#fff8dc');
      ctx.fillStyle = gradient;
    } else {
      // Cielo nocturno con degradado
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#191970');
      gradient.addColorStop(0.7, '#2c2c54');
      gradient.addColorStop(1, '#1e1e2c');
      ctx.fillStyle = gradient;
      
      // Estrellas en el fondo nocturno
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 23) % (canvas.height - 100);
        const size = Math.random() * 1.5 * scale;
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;
    }
    
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Sol/Luna según el tema
    const time = Date.now() * 0.001;
    if (backgroundTheme === 'day') {
      // Sol
      ctx.fillStyle = '#ffeb3b';
      ctx.shadowColor = '#ff9800';
      ctx.shadowBlur = 20 * scale;
      ctx.beginPath();
      ctx.arc(700 * scale, 80 * scale, 25 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Luna
      ctx.fillStyle = '#f5f5f5';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15 * scale;
      ctx.beginPath();
      ctx.arc(700 * scale, 80 * scale, 20 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Cráteres en la luna
      ctx.fillStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.arc(690 * scale, 75 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(710 * scale, 85 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(695 * scale, 90 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Nubes animadas (más oscuras en modo nocturno)
    ctx.fillStyle = backgroundTheme === 'day' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(150, 150, 150, 0.6)';
    
    // Nube 1
    let cloudX1 = 100 * scale + Math.sin(time * 0.5) * 20 * scale;
    ctx.beginPath();
    ctx.arc(cloudX1, 80 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(cloudX1 + 25 * scale, 75 * scale, 30 * scale, 0, Math.PI * 2);
    ctx.arc(cloudX1 + 50 * scale, 80 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Nube 2
    let cloudX2 = 500 * scale + Math.cos(time * 0.3) * 15 * scale;
    ctx.beginPath();
    ctx.arc(cloudX2, 100 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.arc(cloudX2 + 20 * scale, 95 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(cloudX2 + 40 * scale, 100 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Edificios (más oscuros en modo nocturno)
    const buildings = [
      { x: 50 * scale, y: 100 * scale, w: 80 * scale, h: 265 * scale },
      { x: 200 * scale, y: 150 * scale, w: 100 * scale, h: 215 * scale },
      { x: 400 * scale, y: 120 * scale, w: 70 * scale, h: 245 * scale },
      { x: 600 * scale, y: 140 * scale, w: 90 * scale, h: 225 * scale }
    ];
    
    buildings.forEach(building => {
      ctx.fillStyle = backgroundTheme === 'day' ? '#696969' : '#505050';
      ctx.fillRect(building.x, building.y, building.w, building.h);
      
      ctx.fillStyle = backgroundTheme === 'day' ? '#505050' : '#404040';
      ctx.fillRect(building.x, building.y, building.w, 10 * scale);
      
      // Ventanas (menos encendidas en modo nocturno)
      ctx.fillStyle = backgroundTheme === 'day' ? '#ffeb3b' : '#ffa500';
      for (let row = 0; row < Math.floor(building.h / (30 * scale)); row++) {
        for (let col = 0; col < Math.floor(building.w / (20 * scale)); col++) {
          const shouldLight = backgroundTheme === 'day' ? 
            (Math.random() > 0.3) : 
            (Math.random() > 0.7); // Menos ventanas encendidas de noche
          if (shouldLight) {
            ctx.fillRect(
              building.x + 5 * scale + col * 20 * scale,
              building.y + 15 * scale + row * 30 * scale,
              10 * scale,
              15 * scale
            );
          }
        }
      }
    });
    
    // Suelo
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, canvas.height - 50 * scale, canvas.width, 50 * scale);
    ctx.fillStyle = backgroundTheme === 'day' ? '#90ee90' : '#2d5a2d';
    ctx.fillRect(0, canvas.height - 50 * scale, canvas.width, 10 * scale);
    
    // Dibujar power-ups
    powerUpsRef.current.forEach(powerUp => drawPowerUp(ctx, powerUp));
    
    // Dibujar comida (solo la que no ha sido recolectada)
    foodsRef.current.forEach(food => {
      const floatY = Math.sin(time * 3 + food.id * 0.01) * 2 * scale;
      drawFood(ctx, { ...food, y: food.y + floatY });
    });
    
    // Dibujar obstáculos
    obstaclesRef.current.forEach(obstacle => drawObstacle(ctx, obstacle));
    
    // Dibujar partículas
    drawParticles(ctx);
    
    // Dibujar jugador
    drawCat(ctx, player.x, player.y, player.width, player.height);
    
    // UI mejorada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10 * scale, 10 * scale, 250 * scale, 50 * scale);
    ctx.fillRect(canvas.width - 260 * scale, 10 * scale, 250 * scale, 50 * scale);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${20 * scale}px Arial`;
    ctx.fillText(`🐟 ${score}`, 20 * scale, 35 * scale);
    
    if (combo > 1) {
      ctx.fillStyle = '#ffeb3b';
      ctx.fillText(`x${combo}!`, 20 * scale, 55 * scale);
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`❤️ ${lives}`, canvas.width - 240 * scale, 35 * scale);
    
    // Indicador de tema
    ctx.fillStyle = backgroundTheme === 'day' ? '#ffeb3b' : '#4a90e2';
    ctx.fillText(backgroundTheme === 'day' ? '☀️ Día' : '🌙 Noche', canvas.width - 240 * scale, 55 * scale);
    
    // Mostrar power-ups activos
    let powerUpY = 80 * scale;
    activePowerUpsRef.current.forEach(powerUp => {
      ctx.fillStyle = 
        powerUp === 'shield' ? '#4a90e2' :
        powerUp === 'doublePoints' ? '#ffeb3b' : '#90ee90';
      const powerUpText = 
        powerUp === 'shield' ? '🛡️ Escudo' :
        powerUp === 'doublePoints' ? '2× Puntos' : '🐌 Cámara Lenta';
      ctx.fillText(powerUpText, canvas.width - 240 * scale, powerUpY);
      powerUpY += 25 * scale;
    });
    
    // Efecto de combo
    if (showCombo) {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = `bold ${30 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}!`, comboPosition.x, comboPosition.y);
      ctx.textAlign = 'left';
    }
    
  }, [score, lives, combo, showCombo, comboPosition, canvasSize, backgroundTheme, drawFood, drawObstacle, drawParticles, drawPowerUp, drawCat]);

  const gameLoop = useCallback((timestamp) => {
    if (gameState !== 'playing') return;
    
    const deltaTime = Math.min(timestamp - lastTimeRef.current, 1000/30);
    lastTimeRef.current = timestamp;
    
    const player = playerRef.current;
    const scale = canvasSize.width / 800;
    
    const timeScale = activePowerUpsRef.current.has('slowMotion') ? 0.5 : 1;
    const scaledDeltaTime = deltaTime * timeScale;
    
    // Movimiento con teclado (para desktop)
    if (!isMobile) {
      player.isMoving = false;
      if (keysRef.current['ArrowLeft'] && player.x > 0) {
        player.x -= 5 * scale * timeScale;
        player.isMoving = true;
      }
      if (keysRef.current['ArrowRight'] && player.x < canvasSize.width - player.width) {
        player.x += 5 * scale * timeScale;
        player.isMoving = true;
      }
      
      // Salto con teclado
      if ((keysRef.current['ArrowUp'] || keysRef.current[' ']) && !player.isJumping) {
        player.velocityY = -12 * scale;
        player.isJumping = true;
        playSound('jump');
        createParticles(
          player.x + player.width/2, 
          player.y + player.height, 
          '#ffffff', 
          3
        );
      }
    }
    
    // Gravedad
    if (player.isJumping) {
      player.velocityY += 0.6 * scale * timeScale;
      player.y += player.velocityY * timeScale;
      
      const groundY = canvasSize.height - 50 * (canvasSize.height / 400);
      if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
        if (player.velocityY > 5) {
          createParticles(
            player.x + player.width/2, 
            player.y + player.height, 
            '#8b4513', 
            4
          );
        }
      }
    }
    
    // Generar comida
    foodTimerRef.current += scaledDeltaTime;
    if (foodTimerRef.current > 2000 / gameSpeedRef.current) {
      foodTimerRef.current = 0;
      const foodTypes = ['fish', 'milk', 'croquettes'];
      const type = foodTypes[Math.floor(Math.random() * foodTypes.length)];
      
      foodsRef.current.push({
        id: Date.now() + Math.random(),
        type,
        x: Math.random() * (canvasSize.width - 100) + 50,
        y: -20,
        speed: (2 + Math.random() * 1.5) * gameSpeedRef.current * scale
      });
    }
    
    // Generar obstáculos que caen del cielo
    obstacleTimerRef.current += scaledDeltaTime;
    if (obstacleTimerRef.current > 2500 / gameSpeedRef.current) {
      obstacleTimerRef.current = 0;
      const obstacleTypes = ['dog', 'box', 'bird'];
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      const obstacleConfig = {
        'dog': { width: 40, height: 25 },
        'box': { width: 50, height: 30 },
        'bird': { width: 35, height: 20 }
      };
      
      obstaclesRef.current.push({
        id: Date.now() + Math.random(),
        type,
        x: Math.random() * (canvasSize.width - obstacleConfig[type].width * scale),
        y: -50,
        width: obstacleConfig[type].width * scale,
        height: obstacleConfig[type].height * scale,
        speed: (3 + Math.random() * 2) * gameSpeedRef.current * scale * timeScale
      });
    }
    
    // Generar power-ups (raro)
    powerUpTimerRef.current += scaledDeltaTime;
    if (powerUpTimerRef.current > 10000 / gameSpeedRef.current && Math.random() < 0.3) {
      powerUpTimerRef.current = 0;
      createPowerUp();
    }
    
    // Mover comida (solo la que no ha sido recolectada)
    foodsRef.current = foodsRef.current
      .map(food => ({ ...food, y: food.y + food.speed * timeScale }))
      .filter(food => food.y < canvasSize.height);
    
    // Mover obstáculos (ahora caen hacia abajo)
    obstaclesRef.current = obstaclesRef.current
      .map(obstacle => ({ ...obstacle, y: obstacle.y + obstacle.speed * timeScale }))
      .filter(obstacle => obstacle.y < canvasSize.height + 50);
    
    // Mover power-ups
    powerUpsRef.current = powerUpsRef.current
      .map(powerUp => ({ ...powerUp, y: powerUp.y + powerUp.speed * timeScale }))
      .filter(powerUp => powerUp.y < canvasSize.height);
    
    // Aumentar dificultad
    if (timestamp % 10000 < 16) {
      gameSpeedRef.current = Math.min(gameSpeedRef.current + 0.05, 3);
    }
    
    // Reset combo si pasa mucho tiempo
    if (timestamp - lastComboTimeRef.current > 2000) {
      setCombo(1);
    }
    
    checkCollisions();
    draw();
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, draw, checkCollisions, playSound, createParticles, createPowerUp, canvasSize, isMobile]);

  // 🔥 AÑADIR: Función restartGame que faltaba
  const restartGame = useCallback(() => {
    const scale = canvasSize.width / 800;
    playerRef.current = {
      x: 100 * scale,
      y: isMobile ? canvasSize.height - 80 : (320 * canvasSize.height) / 400,
      width: 50 * scale,
      height: 45 * (canvasSize.height / 400),
      velocityY: 0,
      isJumping: false,
      velocityX: 0,
      isMoving: false
    };
    foodsRef.current = [];
    obstaclesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    gameSpeedRef.current = 1;
    collectedFoodsRef.current.clear();
    hitObstaclesRef.current.clear();
    activePowerUpsRef.current.clear();
    setScore(0);
    setLives(3);
    setCombo(1);
    setShowCombo(false);
    setBackgroundTheme('day'); // Reset al tema diurno
    setGameState('playing');
  }, [canvasSize, isMobile]);

  // Efectos iniciales
  useEffect(() => {
    initAudio();
  }, [initAudio]);

  // Ajustar tamaño inicial y en redimensionamiento
  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => {
      updateCanvasSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  // Controles para desktop
  useEffect(() => {
    if (isMobile) return;
    
    const handleKeyDown = (e) => {
      // Prevenir scroll con teclas de flecha y espacio
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true;
    };
    
    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMobile]);

  // Controles táctiles para móviles
  useEffect(() => {
    if (!isMobile) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const preventDefault = (e) => e.preventDefault();
    
    // Prevenir gestos de zoom y scroll
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    document.addEventListener('gestureend', preventDefault);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
      document.removeEventListener('gestureend', preventDefault);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gameLoop]);

  return (
    <div 
      ref={gameContainerRef}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '10px' : '20px',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
        position: 'relative',
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Título responsive */}
      <h1 style={{
        color: 'white',
        fontSize: isMobile ? '24px' : '36px',
        textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
        margin: isMobile ? '5px 0 15px 0' : '0 0 20px 0',
        textAlign: 'center',
        padding: '0 10px',
        zIndex: 10
      }}>
        🐱 PACO EN LA CIUDAD 🎮
      </h1>
      
      {gameState === 'playing' ? (
        <div style={{ 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{
              border: '3px solid #333',
              borderRadius: '10px',
              background: 'white',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              maxWidth: '100%',
              height: 'auto',
              touchAction: 'none'
            }}
          />
          
          {/* Instrucciones responsive */}
          <div style={{
            marginTop: '15px',
            color: 'white',
            fontSize: isMobile ? '14px' : '16px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            background: 'rgba(255,255,255,0.2)',
            padding: '10px 20px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            maxWidth: '90vw'
          }}>
            {isMobile ? (
              <div>
                <div>✨ Toca para saltar | Desliza para mover ✨</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
                  ¡Agarra la comida y evita los objetos que caen!
                </div>
              </div>
            ) : (
              <div>⬅️ ➡️ Mover | ⬆️ o Espacio Saltar | ¡Agarra la comida!</div>
            )}
            {score >= 150 && (
              <div style={{ 
                color: '#ffeb3b', 
                fontWeight: 'bold', 
                marginTop: '5px',
                fontSize: isMobile ? '12px' : '14px'
              }}>
                ¡Modo Nocturno Desbloqueado! 🌙
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: isMobile ? '25px' : '40px',
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          maxWidth: '90vw',
          width: isMobile ? '300px' : '400px'
        }}>
          <h2 style={{ 
            fontSize: isMobile ? '24px' : '32px', 
            color: '#333', 
            margin: '0 0 15px 0' 
          }}>
            😿 Game Over
          </h2>
          <p style={{ 
            fontSize: isMobile ? '18px' : '24px', 
            color: '#667eea', 
            fontWeight: 'bold', 
            margin: '10px 0' 
          }}>
            Puntos: {score}
          </p>
          <p style={{ 
            fontSize: isMobile ? '16px' : '18px', 
            color: '#888', 
            margin: '5px 0' 
          }}>
            Récord: {highScore}
          </p>
          {score >= 150 && (
            <p style={{ 
              fontSize: isMobile ? '14px' : '16px', 
              color: '#ff6b6b', 
              fontWeight: 'bold',
              margin: '10px 0' 
            }}>
              ¡Lograste el modo nocturno! 🌙
            </p>
          )}
          
          <button
            onClick={restartGame}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              fontSize: isMobile ? '16px' : '18px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              width: '100%',
              maxWidth: '250px'
            }}
          >
            🎮 Jugar de Nuevo
          </button>
        </div>
      )}
      
      {/* Pie de página con créditos */}
      <footer style={{
        marginTop: '20px',
        color: 'white',
        textAlign: 'center',
        fontSize: isMobile ? '12px' : '14px',
        opacity: 0.8,
        padding: '10px',
        width: '100%'
      }}>
        <p style={{ margin: '5px 0' }}>
          Desarrollado por{' '}
          <a 
            href="https://github.com/AndrezOficial" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#ffeb3b',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            AndrezOficial
          </a>
        </p>
        <p style={{ margin: '5px 0', fontSize: isMobile ? '11px' : '13px' }}>
          {isMobile ? 'Toca para saltar • Desliza para mover' : '¡Agarra la comida antes de que desaparezca! 🐟🥛'}
        </p>
      </footer>
    </div>
  );
};

export default Game;