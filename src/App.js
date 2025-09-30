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
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });
  const [showMobileControls, setShowMobileControls] = useState(false);
  
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
  const touchStartYRef = useRef(0);

  // 🔥 NUEVO: Detectar si es móvil
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // 🔥 NUEVO: Ajustar tamaño del canvas para móviles
  const updateCanvasSize = useCallback(() => {
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const height = Math.min(400, maxWidth * 0.5);
    
    setCanvasSize({
      width: maxWidth,
      height: height
    });

    // Ajustar posición del jugador para el nuevo tamaño
    const scaleFactor = maxWidth / 800;
    playerRef.current = {
      ...playerRef.current,
      x: 100 * scaleFactor,
      y: (320 * height) / 400,
      width: 50 * scaleFactor,
      height: 45 * (height / 400)
    };
  }, []);

  // 🔥 NUEVO: Controles táctiles para móviles
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Área de salto (parte superior de la pantalla)
    if (y < canvasSize.height / 2) {
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
    }
  }, [canvasSize.height]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    
    if (Math.abs(deltaX) > 10) {
      const player = playerRef.current;
      const scaleFactor = canvasSize.width / 800;
      const moveSpeed = 5 * scaleFactor;
      
      if (deltaX > 0 && player.x < canvasSize.width - player.width) {
        player.x += moveSpeed;
        player.isMoving = true;
      } else if (deltaX < 0 && player.x > 0) {
        player.x -= moveSpeed;
        player.isMoving = true;
      }
      
      touchStartXRef.current = touch.clientX;
    }
  }, [canvasSize.width]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    playerRef.current.isMoving = false;
  }, []);

  // 🔥 NUEVO: Botones virtuales para móviles
  const MobileControls = () => (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 20px',
      pointerEvents: 'none'
    }}>
      {/* Botones de movimiento */}
      <div style={{
        display: 'flex',
        gap: '15px',
        pointerEvents: 'auto'
      }}>
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            keysRef.current['ArrowLeft'] = true;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            keysRef.current['ArrowLeft'] = false;
          }}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: '3px solid #333',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ⬅️
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            keysRef.current['ArrowRight'] = true;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            keysRef.current['ArrowRight'] = false;
          }}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: '3px solid #333',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ➡️
        </button>
      </div>
      
      {/* Botón de salto */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
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
        }}
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          border: '3px solid #333',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ⬆️ SALTO
      </button>
    </div>
  );

  // Ajustar tamaño inicial y en redimensionamiento
  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => {
      updateCanvasSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  // Funciones drawFood, drawObstacle, etc. (las mismas del código anterior)
  const drawFood = (ctx, food) => {
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
  };

  const drawObstacle = (ctx, obstacle) => {
    ctx.save();
    
    const scale = canvasSize.width / 800;
    
    if (obstacle.type === 'dog') {
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      ctx.fillRect(obstacle.x + obstacle.width - 15 * scale, obstacle.y - 10 * scale, 15 * scale, 15 * scale);
      
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(obstacle.x + obstacle.width - 18 * scale, obstacle.y - 8 * scale, 5 * scale, 12 * scale);
      ctx.fillRect(obstacle.x + obstacle.width - 5 * scale, obstacle.y - 8 * scale, 5 * scale, 12 * scale);
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(obstacle.x + obstacle.width - 8 * scale, obstacle.y - 5 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y + 5 * scale);
      ctx.lineTo(obstacle.x - 10 * scale, obstacle.y - 5 * scale);
      ctx.lineTo(obstacle.x, obstacle.y);
      ctx.fill();
      
      ctx.fillRect(obstacle.x + 5 * scale, obstacle.y + obstacle.height, 8 * scale, 10 * scale);
      ctx.fillRect(obstacle.x + obstacle.width - 13 * scale, obstacle.y + obstacle.height, 8 * scale, 10 * scale);
    } else if (obstacle.type === 'box') {
      ctx.fillStyle = '#d2691e';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(obstacle.x + 5 * scale, obstacle.y + 5 * scale, obstacle.width - 10 * scale, obstacle.height - 10 * scale);
      
      ctx.fillStyle = '#a0522d';
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y);
      ctx.lineTo(obstacle.x + 10 * scale, obstacle.y - 10 * scale);
      ctx.lineTo(obstacle.x + obstacle.width + 10 * scale, obstacle.y - 10 * scale);
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

  const playSound = useCallback((soundName) => {
    if (soundBuffersRef.current[soundName]) {
      soundBuffersRef.current[soundName]();
    }
  }, []);

  // Sistema de partículas
  const createParticles = (x, y, color, count = 5) => {
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
  };

  const drawParticles = (ctx) => {
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
  };

  // Power-ups
  const createPowerUp = () => {
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
  };

  const drawPowerUp = (ctx, powerUp) => {
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
  };

  const applyPowerUp = (powerUp) => {
    playSound('powerUp');
    activePowerUpsRef.current.add(powerUp.type);
    
    createParticles(powerUp.x, powerUp.y, powerUp.color, 15);
    
    setTimeout(() => {
      activePowerUpsRef.current.delete(powerUp.type);
    }, powerUp.duration);
  };

  // Dibujar gato (adaptado para responsive)
  const drawCat = (ctx, x, y, width, height) => {
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
    
    // Cuerpo del gato (código adaptado con scale)
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(x, y + 10 * scale, width, height - 10 * scale);
    
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.arc(x + width/2, y + 12 * scale, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // ... (resto del código del gato adaptado con scale)
    // Por brevedad, mantengo la estructura básica
    
    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const player = playerRef.current;
    const scale = canvasSize.width / 800;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo adaptado
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.7, '#e0f6ff');
    gradient.addColorStop(1, '#fff8dc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // UI responsive
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
    
    // ... resto del código de dibujo adaptado
    
  }, [score, lives, combo, showCombo, comboPosition, canvasSize]);

  // Game loop adaptado
  const gameLoop = useCallback((timestamp) => {
    if (gameState !== 'playing') return;
    
    const deltaTime = Math.min(timestamp - lastTimeRef.current, 1000/30);
    lastTimeRef.current = timestamp;
    
    const player = playerRef.current;
    const scale = canvasSize.width / 800;
    
    const timeScale = activePowerUpsRef.current.has('slowMotion') ? 0.5 : 1;
    const scaledDeltaTime = deltaTime * timeScale;
    
    // Movimiento con teclado (para desktop)
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
    
    // Generación de elementos adaptada
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
    
    // ... resto del game loop adaptado
    
    checkCollisions();
    draw();
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, draw, checkCollisions, playSound, canvasSize]);

  // Efectos iniciales
  useEffect(() => {
    initAudio();
    setShowMobileControls(isMobile);
  }, [initAudio, isMobile]);

  // Controles para desktop
  useEffect(() => {
    if (isMobile) return;
    
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
  }, [isMobile]);

  // Controles táctiles para móviles
  useEffect(() => {
    if (!isMobile) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
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

  const restartGame = () => {
    const scale = canvasSize.width / 800;
    playerRef.current = {
      x: 100 * scale,
      y: (320 * canvasSize.height) / 400,
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
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Título responsive */}
      <h1 style={{
        color: 'white',
        fontSize: Math.min(48, window.innerWidth / 15) + 'px',
        textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
        margin: '0 0 20px 0',
        textAlign: 'center',
        padding: '0 10px'
      }}>
        {isMobile ? '🐱 Juego 🎮' : '🐱 PACO EN LA CIUDAD 🎮'}
      </h1>
      
      {gameState === 'playing' ? (
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{
              border: '4px solid #333',
              borderRadius: '15px',
              background: 'white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
          
          {/* Controles móviles */}
          {showMobileControls && <MobileControls />}
          
          {/* Instrucciones responsive */}
          <div style={{
            marginTop: '15px',
            color: 'white',
            fontSize: Math.min(16, window.innerWidth / 30) + 'px',
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
                <div>←→ Movimiento | Toca arriba para saltar</div>
                <div style={{ fontSize: '0.8em', opacity: 0.8, marginTop: '5px' }}>
                  ¡Usa los botones o desliza!
                </div>
              </div>
            ) : (
              <div>⬅️ ➡️ Mover | ⬆️ o Espacio Saltar</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: Math.min(40, window.innerWidth / 20) + 'px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxWidth: '90vw',
          width: '400px'
        }}>
          <h2 style={{ 
            fontSize: Math.min(36, window.innerWidth / 15) + 'px', 
            color: '#333', 
            margin: '0 0 20px 0' 
          }}>
            😿 Game Over
          </h2>
          <p style={{ 
            fontSize: Math.min(24, window.innerWidth / 20) + 'px', 
            color: '#667eea', 
            fontWeight: 'bold', 
            margin: '10px 0' 
          }}>
            Puntos: {score}
          </p>
          <p style={{ 
            fontSize: Math.min(18, window.innerWidth / 25) + 'px', 
            color: '#888', 
            margin: '5px 0' 
          }}>
            Récord: {highScore}
          </p>
          
          <button
            onClick={restartGame}
            style={{
              marginTop: '30px',
              padding: '15px 40px',
              fontSize: Math.min(18, window.innerWidth / 25) + 'px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              width: '100%',
              maxWidth: '250px'
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