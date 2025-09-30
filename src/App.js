import React, { useEffect, useRef, useState, useCallback } from 'react';

const Game = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('playing');
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [showCombo, setShowCombo] = useState(false);
  const [comboPosition, setComboPosition] = useState({ x: 0, y: 0 });
  
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

  // 🔥 AÑADIR: Función drawFood que faltaba
  const drawFood = (ctx, food) => {
    ctx.save();
    
    if (food.type === 'fish') {
      // Pescado brillante
      ctx.fillStyle = '#ff6b6b';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(food.x, food.y, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff8e8e';
      ctx.beginPath();
      ctx.moveTo(food.x - 15, food.y);
      ctx.lineTo(food.x - 22, food.y - 8);
      ctx.lineTo(food.x - 22, food.y + 8);
      ctx.closePath();
      ctx.fill();
      
      // Ojo del pescado
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(food.x + 5, food.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(food.x + 5, food.y - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (food.type === 'milk') {
      // Botella de leche
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#87ceeb';
      ctx.shadowBlur = 8;
      ctx.fillRect(food.x - 10, food.y - 15, 20, 30);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#e8f4f8';
      ctx.fillRect(food.x - 8, food.y - 13, 16, 26);
      
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(food.x - 10, food.y - 18, 20, 5);
    } else if (food.type === 'croquettes') {
      // Croquetas
      ctx.fillStyle = '#d2691e';
      ctx.shadowColor = '#a0522d';
      ctx.shadowBlur = 5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(food.x + (i - 1) * 8, food.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  };

  // 🔥 AÑADIR: Función drawObstacle que faltaba
  const drawObstacle = (ctx, obstacle) => {
    ctx.save();
    
    if (obstacle.type === 'dog') {
      // Perro más detallado
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Cabeza
      ctx.fillRect(obstacle.x + obstacle.width - 15, obstacle.y - 10, 15, 15);
      
      // Orejas caídas
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(obstacle.x + obstacle.width - 18, obstacle.y - 8, 5, 12);
      ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y - 8, 5, 12);
      
      // Ojo
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(obstacle.x + obstacle.width - 8, obstacle.y - 5, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Cola
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y + 5);
      ctx.lineTo(obstacle.x - 10, obstacle.y - 5);
      ctx.lineTo(obstacle.x, obstacle.y);
      ctx.fill();
      
      // Patas
      ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height, 8, 10);
      ctx.fillRect(obstacle.x + obstacle.width - 13, obstacle.y + obstacle.height, 8, 10);
    } else if (obstacle.type === 'box') {
      // Caja 3D
      ctx.fillStyle = '#d2691e';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
      
      // Efecto 3D
      ctx.fillStyle = '#a0522d';
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y);
      ctx.lineTo(obstacle.x + 10, obstacle.y - 10);
      ctx.lineTo(obstacle.x + obstacle.width + 10, obstacle.y - 10);
      ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  };

  // Inicializar sistema de audio
  const initAudio = useCallback(async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Crear sonidos simples programáticamente
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

      // Sonidos predefinidos
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

  const playSound = useCallback((soundName) => {
    if (soundBuffersRef.current[soundName]) {
      soundBuffersRef.current[soundName]();
    }
  }, []);

  // Sistema de partículas para efectos
  const createParticles = (x, y, color, count = 5) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  // Dibujar partículas
  const drawParticles = (ctx) => {
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      particle.vy += 0.1; // Gravedad
      
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      
      return particle.life > 0;
    });
    ctx.globalAlpha = 1;
  };

  // Power-ups especiales
  const createPowerUp = () => {
    const powerUpTypes = [
      { type: 'shield', color: '#4a90e2', duration: 5000 },
      { type: 'doublePoints', color: '#ffeb3b', duration: 8000 },
      { type: 'slowMotion', color: '#90ee90', duration: 6000 }
    ];
    
    const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    powerUpsRef.current.push({
      id: Date.now() + Math.random(),
      ...powerUp,
      x: Math.random() * 700 + 50,
      y: -30,
      speed: 2,
      size: 20
    });
  };

  // Dibujar power-ups
  const drawPowerUp = (ctx, powerUp) => {
    ctx.save();
    
    // Efecto brillante
    ctx.shadowColor = powerUp.color;
    ctx.shadowBlur = 15;
    
    // Icono según tipo
    ctx.fillStyle = powerUp.color;
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
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
  };

  // Aplicar efecto de power-up
  const applyPowerUp = (powerUp) => {
    playSound('powerUp');
    activePowerUpsRef.current.add(powerUp.type);
    
    // Efectos visuales
    createParticles(powerUp.x, powerUp.y, powerUp.color, 15);
    
    setTimeout(() => {
      activePowerUpsRef.current.delete(powerUp.type);
    }, powerUp.duration);
  };

  // Dibujar gato con mejoras visuales
  const drawCat = (ctx, x, y, width, height) => {
    ctx.save();
    
    // Efecto de escudo si está activo
    if (activePowerUpsRef.current.has('shield')) {
      ctx.shadowColor = '#4a90e2';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + width/2, y + height/2, 35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Cuerpo principal - gris
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(x, y + 10, width, height - 10);
    
    // Cabeza
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.arc(x + width/2, y + 12, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Orejas
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 5);
    ctx.lineTo(x + 5, y - 5);
    ctx.lineTo(x + 15, y + 8);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + width - 10, y + 5);
    ctx.lineTo(x + width - 5, y - 5);
    ctx.lineTo(x + width - 15, y + 8);
    ctx.fill();
    
    // Interior orejas rosa
    ctx.fillStyle = '#ffb3ba';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 5);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x + 13, y + 7);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + width - 10, y + 5);
    ctx.lineTo(x + width - 8, y);
    ctx.lineTo(x + width - 13, y + 7);
    ctx.fill();
    
    // Pecho blanco
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + width/2, y + 25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + width/2 - 8, y + 25, 16, 20);
    
    // Cara blanca
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + width/2 - 10, y + 15, 20, 12);
    
    // Nariz rosa
    ctx.fillStyle = '#ffb3ba';
    ctx.beginPath();
    ctx.moveTo(x + width/2, y + 20);
    ctx.lineTo(x + width/2 - 3, y + 17);
    ctx.lineTo(x + width/2 + 3, y + 17);
    ctx.fill();
    
    // Ojos (cerrados si está en slow motion)
    if (activePowerUpsRef.current.has('slowMotion')) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + width/2 - 9, y + 12);
      ctx.lineTo(x + width/2 - 3, y + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + width/2 + 3, y + 12);
      ctx.lineTo(x + width/2 + 9, y + 12);
      ctx.stroke();
    } else {
      // Ojos verdes normales
      ctx.fillStyle = '#90ee90';
      ctx.beginPath();
      ctx.arc(x + width/2 - 7, y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width/2 + 7, y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupilas
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x + width/2 - 7, y + 12, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width/2 + 7, y + 12, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Bigotes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width/2 - 5, y + 18);
    ctx.lineTo(x + 5, y + 16);
    ctx.moveTo(x + width/2 - 5, y + 20);
    ctx.lineTo(x + 3, y + 20);
    ctx.moveTo(x + width/2 + 5, y + 18);
    ctx.lineTo(x + width - 5, y + 16);
    ctx.moveTo(x + width/2 + 5, y + 20);
    ctx.lineTo(x + width - 3, y + 20);
    ctx.stroke();
    
    // Patas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 8, y + height - 5, 10, 5);
    ctx.fillRect(x + width - 18, y + height - 5, 10, 5);
    
    // Cola
    ctx.strokeStyle = '#7a7a7a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.quadraticCurveTo(x - 15, y + 15, x - 18, y + 25);
    ctx.stroke();
    
    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const player = playerRef.current;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Cielo con degradado
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.7, '#e0f6ff');
    gradient.addColorStop(1, '#fff8dc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Nubes animadas
    const time = Date.now() * 0.001;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // Nube 1
    let cloudX1 = 100 + Math.sin(time * 0.5) * 20;
    ctx.beginPath();
    ctx.arc(cloudX1, 80, 25, 0, Math.PI * 2);
    ctx.arc(cloudX1 + 25, 75, 30, 0, Math.PI * 2);
    ctx.arc(cloudX1 + 50, 80, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Nube 2
    let cloudX2 = 500 + Math.cos(time * 0.3) * 15;
    ctx.beginPath();
    ctx.arc(cloudX2, 100, 20, 0, Math.PI * 2);
    ctx.arc(cloudX2 + 20, 95, 25, 0, Math.PI * 2);
    ctx.arc(cloudX2 + 40, 100, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Edificios
    const buildings = [
      { x: 50, y: 100, w: 80, h: 265 },
      { x: 200, y: 150, w: 100, h: 215 },
      { x: 400, y: 120, w: 70, h: 245 },
      { x: 600, y: 140, w: 90, h: 225 }
    ];
    
    buildings.forEach(building => {
      ctx.fillStyle = '#696969';
      ctx.fillRect(building.x, building.y, building.w, building.h);
      
      ctx.fillStyle = '#505050';
      ctx.fillRect(building.x, building.y, building.w, 10);
      
      // Ventanas
      ctx.fillStyle = '#ffeb3b';
      for (let row = 0; row < Math.floor(building.h / 30); row++) {
        for (let col = 0; col < Math.floor(building.w / 20); col++) {
          if (Math.random() > 0.3) {
            ctx.fillRect(
              building.x + 5 + col * 20,
              building.y + 15 + row * 30,
              10,
              15
            );
          }
        }
      }
    });
    
    // Suelo
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, 365, canvas.width, 35);
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, 365, canvas.width, 8);
    
    // Dibujar power-ups
    powerUpsRef.current.forEach(powerUp => drawPowerUp(ctx, powerUp));
    
    // Dibujar comida
    foodsRef.current.forEach(food => {
      // Efecto de flotación
      const floatY = Math.sin(time * 3 + food.id * 0.01) * 2;
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
    ctx.fillRect(10, 10, 300, 60);
    ctx.fillRect(canvas.width - 310, 10, 300, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`🐟 Puntos: ${score}`, 20, 35);
    
    // Mostrar combo
    if (combo > 1) {
      ctx.fillStyle = '#ffeb3b';
      ctx.fillText(`Combo: x${combo}!`, 20, 60);
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`❤️ Vidas: ${lives}`, canvas.width - 290, 35);
    
    // Mostrar power-ups activos
    let powerUpY = 60;
    activePowerUpsRef.current.forEach(powerUp => {
      ctx.fillStyle = 
        powerUp === 'shield' ? '#4a90e2' :
        powerUp === 'doublePoints' ? '#ffeb3b' : '#90ee90';
      ctx.fillText(
        powerUp === 'shield' ? '🛡️ Escudo' :
        powerUp === 'doublePoints' ? '2× Puntos' : '🐌 Cámara Lenta',
        canvas.width - 290,
        powerUpY
      );
      powerUpY += 25;
    });
    
    // Efecto de combo
    if (showCombo) {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}!`, comboPosition.x, comboPosition.y);
      ctx.textAlign = 'left';
    }
    
  }, [score, lives, combo, showCombo, comboPosition]);

  const checkCollisions = useCallback(() => {
    const player = playerRef.current;
    const currentTime = Date.now(); // 🔥 CORREGIDO: Definir currentTime
    
    // Colisión con comida
    foodsRef.current.forEach(food => {
      if (collectedFoodsRef.current.has(food.id)) return;
      
      const dx = player.x + player.width/2 - food.x;
      const dy = player.y + player.height/2 - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 25) {
        collectedFoodsRef.current.add(food.id);
        
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
        
        setScore(prev => prev + totalPoints);
        
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
    powerUpsRef.current.forEach(powerUp => {
      const dx = player.x + player.width/2 - powerUp.x;
      const dy = player.y + player.height/2 - powerUp.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 25) {
        applyPowerUp(powerUp);
        powerUpsRef.current = powerUpsRef.current.filter(p => p.id !== powerUp.id);
      }
    });
    
    // Colisión con obstáculos (omitir si tiene escudo)
    if (!activePowerUpsRef.current.has('shield')) {
      obstaclesRef.current.forEach(obstacle => {
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
  }, [score, combo, playSound]);

  const gameLoop = useCallback((timestamp) => {
    if (gameState !== 'playing') return;
    
    const deltaTime = Math.min(timestamp - lastTimeRef.current, 1000/30);
    lastTimeRef.current = timestamp;
    
    const player = playerRef.current;
    
    // Aplicar slow motion si está activo
    const timeScale = activePowerUpsRef.current.has('slowMotion') ? 0.5 : 1;
    const scaledDeltaTime = deltaTime * timeScale;
    
    // Movimiento horizontal
    player.isMoving = false;
    if (keysRef.current['ArrowLeft'] && player.x > 0) {
      player.x -= 5 * timeScale;
      player.isMoving = true;
    }
    if (keysRef.current['ArrowRight'] && player.x < 750) {
      player.x += 5 * timeScale;
      player.isMoving = true;
    }
    
    // Salto
    if ((keysRef.current['ArrowUp'] || keysRef.current[' ']) && !player.isJumping) {
      player.velocityY = -12;
      player.isJumping = true;
      playSound('jump');
      createParticles(player.x + player.width/2, player.y + player.height, '#ffffff', 3);
    }
    
    // Gravedad
    if (player.isJumping) {
      player.velocityY += 0.6 * timeScale;
      player.y += player.velocityY * timeScale;
      
      if (player.y >= 320) {
        player.y = 320;
        player.velocityY = 0;
        player.isJumping = false;
        // Partículas al aterrizar
        if (player.velocityY > 5) {
          createParticles(player.x + player.width/2, player.y + player.height, '#8b4513', 4);
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
        x: Math.random() * 700 + 50,
        y: -20,
        speed: (2 + Math.random() * 1.5) * gameSpeedRef.current
      });
    }
    
    // Generar obstáculos
    obstacleTimerRef.current += scaledDeltaTime;
    if (obstacleTimerRef.current > 3000 / gameSpeedRef.current) {
      obstacleTimerRef.current = 0;
      const obstacleTypes = ['dog', 'box'];
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      obstaclesRef.current.push({
        id: Date.now() + Math.random(),
        type,
        x: 800,
        y: type === 'dog' ? 310 : 305,
        width: type === 'dog' ? 40 : 50,
        height: type === 'dog' ? 25 : 30,
        speed: (3 + Math.random() * 2) * gameSpeedRef.current * timeScale
      });
    }
    
    // Generar power-ups (raro)
    powerUpTimerRef.current += scaledDeltaTime;
    if (powerUpTimerRef.current > 10000 / gameSpeedRef.current && Math.random() < 0.3) {
      powerUpTimerRef.current = 0;
      createPowerUp();
    }
    
    // Mover elementos
    foodsRef.current = foodsRef.current
      .map(food => ({ ...food, y: food.y + food.speed * timeScale }))
      .filter(food => food.y < 400);
    
    obstaclesRef.current = obstaclesRef.current
      .map(obstacle => ({ ...obstacle, x: obstacle.x - obstacle.speed * timeScale }))
      .filter(obstacle => obstacle.x > -100);
    
    powerUpsRef.current = powerUpsRef.current
      .map(powerUp => ({ ...powerUp, y: powerUp.y + powerUp.speed * timeScale }))
      .filter(powerUp => powerUp.y < 400);
    
    // Aumentar dificultad
    if (timestamp % 10000 < 16) {
      gameSpeedRef.current = Math.min(gameSpeedRef.current + 0.05, 3);
    }
    
    // 🔥 CORREGIDO: Usar timestamp en lugar de currentTime no definido
    if (timestamp - lastComboTimeRef.current > 2000) {
      setCombo(1);
    }
    
    checkCollisions();
    draw();
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, draw, checkCollisions, playSound]);

  // Efectos iniciales
  useEffect(() => {
    initAudio();
  }, [initAudio]);

  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, []);

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

  const restartGame = () => {
    playerRef.current = {
      x: 100,
      y: 320,
      width: 50,
      height: 45,
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
    setGameState('playing');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        color: 'white',
        fontSize: '3rem',
        textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
        margin: '0 0 20px 0'
      }}>
        🐱 PACO EN LA CIUDAD 🎮
      </h1>
      
      {gameState === 'playing' ? (
        <>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            style={{
              border: '4px solid #333',
              borderRadius: '15px',
              background: 'white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
            }}
          />
          <div style={{
            marginTop: '20px',
            color: 'white',
            fontSize: '1.1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            background: 'rgba(255,255,255,0.2)',
            padding: '12px 25px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div>⬅️ ➡️ Mover | ⬆️ o Espacio Saltar</div>
            <div style={{ fontSize: '0.9rem', marginTop: '5px', opacity: 0.8 }}>
              ¡Consigue combos y power-ups!
            </div>
          </div>
        </>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px 60px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          minWidth: '400px'
        }}>
          <h2 style={{ fontSize: '2.5rem', color: '#333', margin: '0 0 20px 0' }}>
            😿 Game Over
          </h2>
          <p style={{ fontSize: '1.8rem', color: '#667eea', fontWeight: 'bold', margin: '10px 0' }}>
            Puntuación: {score}
          </p>
          <p style={{ fontSize: '1.2rem', color: '#888', margin: '5px 0' }}>
            Récord: {highScore}
          </p>
          <p style={{ fontSize: '1.1rem', color: '#666', margin: '5px 0' }}>
            Combo máximo: x{combo}
          </p>
          
          {score >= 200 && <p style={{ fontSize: '1.4rem', color: '#ffd700', fontWeight: 'bold' }}>¡Leyenda Gatuna! 👑</p>}
          {score >= 100 && score < 200 && <p style={{ fontSize: '1.4rem', color: '#c0c0c0', fontWeight: 'bold' }}>¡Maestro Gato! 🏆</p>}
          {score >= 50 && score < 100 && <p style={{ fontSize: '1.4rem', color: '#cd7f32', fontWeight: 'bold' }}>¡Buen trabajo! 🎯</p>}
          {score < 50 && <p style={{ fontSize: '1.4rem', color: '#ff6b6b', fontWeight: 'bold' }}>¡Sigue intentando! 😺</p>}
          
          <button
            onClick={restartGame}
            style={{
              marginTop: '30px',
              padding: '15px 40px',
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            }}
          >
            🎮 Jugar de Nuevo
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;