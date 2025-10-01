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
  // Estado para controlar si la imagen de Paco está cargada
  const [pacoImageLoaded, setPacoImageLoaded] = useState(false);
  
  // Referencia para la imagen de Paco
  const pacoImageRef = useRef(null);
  
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
  const lastTouchTimeRef = useRef(0);
  const touchCountRef = useRef(0);
  const lastTouchMoveTime = useRef(0);

  // Cargar la imagen de Paco
  useEffect(() => {
    const pacoImage = new Image();
    pacoImage.onload = () => {
      setPacoImageLoaded(true);
    };
    pacoImage.onerror = () => {
      console.log('Error cargando la imagen paco.png');
      setPacoImageLoaded(false);
    };
    pacoImage.src = '/paco.png'; // Ajusta la ruta según donde esté tu imagen
    pacoImageRef.current = pacoImage;
  }, []);

  // Detectar si es móvil
  const isMobile = typeof navigator !== 'undefined' ? 
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false;

  // Ajustar tamaño del canvas responsivamente
  const updateCanvasSize = useCallback(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (isMobile) {
      const maxWidth = Math.min(600, containerWidth - 10);
      const aspectRatio = 16 / 9;
      const height = Math.min(maxWidth / aspectRatio, containerHeight * 0.8);

      setCanvasSize({
        width: maxWidth,
        height: height,
      });

      const scaleFactor = maxWidth / 800;
      playerRef.current = {
        ...playerRef.current,
        x: 100 * scaleFactor,
        y: height - 60,
        width: 50 * scaleFactor,
        height: 45 * (height / 400),
      };
    } else {
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

  const playSound = useCallback((soundName) => {
    if (soundBuffersRef.current[soundName]) {
      soundBuffersRef.current[soundName]();
    }
  }, []);

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

  const DOUBLE_TAP_THRESHOLD = 300;

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;

    const currentTime = Date.now();
    if (currentTime - lastTouchTimeRef.current < DOUBLE_TAP_THRESHOLD) {
      touchCountRef.current += 1;
      if (touchCountRef.current === 2 && !playerRef.current.isJumping) {
        playerRef.current.velocityY = -12 * (canvasSize.height / 400);
        playerRef.current.isJumping = true;
        playSound('jump');
        createParticles(
          playerRef.current.x + playerRef.current.width / 2,
          playerRef.current.y + playerRef.current.height,
          '#ffffff',
          5
        );
        touchCountRef.current = 0;
      }
    } else {
      touchCountRef.current = 1;
    }
    lastTouchTimeRef.current = currentTime;

    touchStartXRef.current = x;
    lastTouchXRef.current = x;
    isDraggingRef.current = true;
  }, [canvasSize.height, playSound, createParticles]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const currentTime = Date.now();
    if (currentTime - lastTouchMoveTime.current < 16) return;
    lastTouchMoveTime.current = currentTime;

    if (!isDraggingRef.current || e.touches.length > 1) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;

    const deltaX = x - lastTouchXRef.current;
    lastTouchXRef.current = x;

    if (Math.abs(deltaX) > 1) {
      const player = playerRef.current;
      const scaleFactor = canvasSize.width / 800;
      const moveSpeed = 10 * scaleFactor;

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

  const handleTouchCancel = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = false;
    playerRef.current.isMoving = false;
  }, []);

  const checkCollisions = useCallback(() => {
    const player = playerRef.current;
    const currentTime = Date.now();
    
    foodsRef.current.forEach((food, index) => {
      if (collectedFoodsRef.current.has(food.id)) return;
      
      const dx = player.x + player.width/2 - food.x;
      const dy = player.y + player.height/2 - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 25) {
        collectedFoodsRef.current.add(food.id);
        foodsRef.current.splice(index, 1);
        
        if (currentTime - lastComboTimeRef.current < 2000) {
          setCombo(prev => prev + 1);
        } else {
          setCombo(2);
        }
        lastComboTimeRef.current = currentTime;
        
        setShowCombo(true);
        setComboPosition({ x: food.x, y: food.y - 20 });
        setTimeout(() => setShowCombo(false), 1000);
        
        const basePoints = 10;
        const multiplier = activePowerUpsRef.current.has('doublePoints') ? 2 : 1;
        const comboMultiplier = Math.min(combo, 5);
        const totalPoints = basePoints * multiplier * comboMultiplier;
        
        setScore(prev => {
          const newScore = prev + totalPoints;
          if (newScore >= 150 && backgroundTheme === 'day') {
            setBackgroundTheme('night');
          }
          return newScore;
        });
        
        if (combo > 2) {
          playSound('collectCombo');
          createParticles(food.x, food.y, '#ffeb3b', 10);
        } else {
          playSound('collect');
          createParticles(food.x, food.y, '#ff6b6b', 5);
        }
      }
    });
    
    powerUpsRef.current.forEach((powerUp, index) => {
      const dx = player.x + player.width/2 - powerUp.x;
      const dy = player.y + player.height/2 - powerUp.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 25) {
        applyPowerUp(powerUp);
        powerUpsRef.current.splice(index, 1);
      }
    });
    
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
          
          setCombo(1);
          
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
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
      ctx.rotate(Math.PI);
      
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
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
      const rotation = (Date.now() * 0.01) % (Math.PI * 2);
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
      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      const wingFlap = Math.sin(Date.now() * 0.01) * 5 * scale;
      ctx.fillStyle = '#ff8e8e';
      ctx.beginPath();
      ctx.ellipse(-8 * scale, wingFlap, 8 * scale, 5 * scale, Math.PI/4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(8 * scale, wingFlap, 8 * scale, 5 * scale, -Math.PI/4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.moveTo(12 * scale, 0);
      ctx.lineTo(20 * scale, -3 * scale);
      ctx.lineTo(20 * scale, 3 * scale);
      ctx.closePath();
      ctx.fill();
      
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
    
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(x, y + 10 * scale, width, height - 10 * scale);
    
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.arc(x + width/2, y + 12 * scale, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
    
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
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + width/2, y + 25 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + width/2 - 8 * scale, y + 25 * scale, 16 * scale, 20 * scale);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + width/2 - 10 * scale, y + 15 * scale, 20 * scale, 12 * scale);
    
    ctx.fillStyle = '#ffb3ba';
    ctx.beginPath();
    ctx.moveTo(x + width/2, y + 20 * scale);
    ctx.lineTo(x + width/2 - 3 * scale, y + 17 * scale);
    ctx.lineTo(x + width/2 + 3 * scale, y + 17 * scale);
    ctx.fill();
    
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
      ctx.fillStyle = '#90ee90';
      ctx.beginPath();
      ctx.arc(x + width/2 - 7 * scale, y + 12 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width/2 + 7 * scale, y + 12 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x + width/2 - 7 * scale, y + 12 * scale, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width/2 + 7 * scale, y + 12 * scale, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    
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
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 8 * scale, y + height - 5 * scale, 10 * scale, 5 * scale);
    ctx.fillRect(x + width - 18 * scale, y + height - 5 * scale, 10 * scale, 5 * scale);
    
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
    
    if (backgroundTheme === 'day') {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, isMobile ? '#5ba8d0' : '#87ceeb');
      gradient.addColorStop(0.7, '#e0f6ff');
      gradient.addColorStop(1, '#fff8dc');
      ctx.fillStyle = gradient;
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#191970');
      gradient.addColorStop(0.7, '#2c2c54');
      gradient.addColorStop(1, '#1e1e2c');
      ctx.fillStyle = gradient;
      
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 23) % (canvas.height - 100);
        const size = Math.random() * (isMobile ? 2 : 1.5) * scale;
        ctx.globalAlpha = isMobile ? 0.9 : 0.7 + Math.random() * 0.3;
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;
    }
    
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const time = Date.now() * 0.001;
    if (backgroundTheme === 'day') {
      ctx.fillStyle = '#ffeb3b';
      ctx.shadowColor = '#ff9800';
      ctx.shadowBlur = 20 * scale;
      ctx.beginPath();
      ctx.arc(700 * scale, 80 * scale, 25 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#f5f5f5';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15 * scale;
      ctx.beginPath();
      ctx.arc(700 * scale, 80 * scale, 20 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
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
    
    ctx.fillStyle = backgroundTheme === 'day' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(150, 150, 150, 0.6)';
    
    let cloudX1 = 100 * scale + Math.sin(time * 0.5) * 20 * scale;
    ctx.beginPath();
    ctx.arc(cloudX1, 80 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(cloudX1 + 25 * scale, 75 * scale, 30 * scale, 0, Math.PI * 2);
    ctx.arc(cloudX1 + 50 * scale, 80 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    let cloudX2 = 500 * scale + Math.cos(time * 0.3) * 15 * scale;
    ctx.beginPath();
    ctx.arc(cloudX2, 100 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.arc(cloudX2 + 20 * scale, 95 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(cloudX2 + 40 * scale, 100 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
    
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
      
      ctx.fillStyle = backgroundTheme === 'day' ? '#ffeb3b' : '#ffa500';
      for (let row = 0; row < Math.floor(building.h / (30 * scale)); row++) {
        for (let col = 0; col < Math.floor(building.w / (20 * scale)); col++) {
          const shouldLight = backgroundTheme === 'day' ? 
            (Math.random() > 0.3) : 
            (Math.random() > 0.7);
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
    
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, canvas.height - 50 * scale, canvas.width, 50 * scale);
    ctx.fillStyle = backgroundTheme === 'day' ? '#90ee90' : '#2d5a2d';
    ctx.fillRect(0, canvas.height - 50 * scale, canvas.width, 10 * scale);
    
    powerUpsRef.current.forEach(powerUp => drawPowerUp(ctx, powerUp));
    
    foodsRef.current.forEach(food => {
      const floatY = Math.sin(time * 3 + food.id * 0.01) * 2 * scale;
      drawFood(ctx, { ...food, y: food.y + floatY });
    });
    
    obstaclesRef.current.forEach(obstacle => drawObstacle(ctx, obstacle));
    
    drawParticles(ctx);
    
    drawCat(ctx, player.x, player.y, player.width, player.height);
    
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
    
    ctx.fillStyle = backgroundTheme === 'day' ? '#ffeb3b' : '#4a90e2';
    ctx.fillText(backgroundTheme === 'day' ? '☀️ Día' : '🌙 Noche', canvas.width - 240 * scale, 55 * scale);
    
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
    
    if (showCombo) {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = `bold ${30 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}!`, comboPosition.x, comboPosition.y);
      ctx.textAlign = 'left';
    }
    
  }, [score, lives, combo, showCombo, comboPosition, canvasSize, backgroundTheme, drawFood, drawObstacle, drawParticles, drawPowerUp, drawCat, isMobile]);

  const gameLoop = useCallback((timestamp) => {
    if (gameState !== 'playing') return;
    
    const deltaTime = Math.min(timestamp - lastTimeRef.current, 1000/30);
    lastTimeRef.current = timestamp;
    
    const player = playerRef.current;
    const scale = canvasSize.width / 800;
    
    const timeScale = activePowerUpsRef.current.has('slowMotion') ? 0.5 : 1;
    const scaledDeltaTime = deltaTime * timeScale;
    
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
    
    powerUpTimerRef.current += scaledDeltaTime;
    if (powerUpTimerRef.current > 10000 / gameSpeedRef.current && Math.random() < 0.3) {
      powerUpTimerRef.current = 0;
      createPowerUp();
    }
    
    foodsRef.current = foodsRef.current
      .map(food => ({ ...food, y: food.y + food.speed * timeScale }))
      .filter(food => food.y < canvasSize.height);
    
    obstaclesRef.current = obstaclesRef.current
      .map(obstacle => ({ ...obstacle, y: obstacle.y + obstacle.speed * timeScale }))
      .filter(obstacle => obstacle.y < canvasSize.height + 50);
    
    powerUpsRef.current = powerUpsRef.current
      .map(powerUp => ({ ...powerUp, y: powerUp.y + powerUp.speed * timeScale }))
      .filter(powerUp => powerUp.y < canvasSize.height);
    
    if (timestamp % 10000 < 16) {
      gameSpeedRef.current = Math.min(gameSpeedRef.current + 0.05, 3);
    }
    
    if (timestamp - lastComboTimeRef.current > 2000) {
      setCombo(1);
    }
    
    checkCollisions();
    draw();
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, draw, checkCollisions, playSound, createParticles, createPowerUp, canvasSize, isMobile]);

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
    lastTouchTimeRef.current = 0;
    touchCountRef.current = 0;
    lastTouchMoveTime.current = 0;
    setScore(0);
    setLives(3);
    setCombo(1);
    setShowCombo(false);
    setBackgroundTheme('day');
    setGameState('playing');
  }, [canvasSize, isMobile]);

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => {
      updateCanvasSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  useEffect(() => {
    if (isMobile) return;
    
    const handleKeyDown = (e) => {
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

  useEffect(() => {
    if (!isMobile) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const preventDefault = (e) => e.preventDefault();
    
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    document.addEventListener('gestureend', preventDefault);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
      document.removeEventListener('gestureend', preventDefault);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

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
        padding: isMobile ? '5px' : '20px',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '10px' : '20px',
          margin: isMobile ? '5px 0 10px 0' : '0 0 20px 0',
          zIndex: 10,
        }}
      >
        {/* Imagen de Paco */}
        {pacoImageLoaded && (
          <img 
            src="/paco.png" 
            alt="Paco"
            style={{
              width: isMobile ? '40px' : '60px',
              height: isMobile ? '40px' : '60px',
              objectFit: 'contain',
            }}
          />
        )}
        
        <h1
          style={{
            color: 'white',
            fontSize: isMobile ? '20px' : '36px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            textAlign: 'center',
            padding: '0 10px',
            margin: 0,
          }}
        >
          {pacoImageLoaded ? 'PACO EN LA CIUDAD' : '🐱 PACO EN LA CIUDAD'} 🎮
        </h1>

        {/* Imagen de Paco duplicada para simetría */}
        {pacoImageLoaded && (
          <img 
            src="/paco.png" 
            alt="Paco"
            style={{
              width: isMobile ? '40px' : '60px',
              height: isMobile ? '40px' : '60px',
              objectFit: 'contain',
            }}
          />
        )}
      </div>
      
      {gameState === 'playing' ? (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
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
              touchAction: 'none',
            }}
          />
          
          <div
            style={{
              marginTop: isMobile ? '10px' : '15px',
              color: 'white',
              fontSize: isMobile ? '12px' : '16px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              background: 'rgba(255,255,255,0.2)',
              padding: isMobile ? '8px 15px' : '10px 20px',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              maxWidth: '90vw',
            }}
          >
            {isMobile ? (
              <div>
                <div>✨ Doble toque para saltar | Desliza para mover ✨</div>
                <div
                  style={{
                    fontSize: isMobile ? '10px' : '12px',
                    opacity: 0.8,
                    marginTop: '5px',
                  }}
                >
                  ¡Agarra la comida y evita los objetos que caen! ¡Optimizado para toques multi-gesto!
                </div>
              </div>
            ) : (
              <div>⬅️ ➡️ Mover | ⬆️ o Espacio Saltar | ¡Agarra la comida!</div>
            )}
            {score >= 150 && (
              <div
                style={{
                  color: '#ffeb3b',
                  fontWeight: 'bold',
                  marginTop: '5px',
                  fontSize: isMobile ? '10px' : '14px',
                }}
              >
                ¡Modo Nocturno Desbloqueado! 🌙
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: isMobile ? '20px' : '40px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            maxWidth: '90vw',
            width: isMobile ? '280px' : '400px',
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? '20px' : '32px',
              color: '#333',
              margin: '0 0 15px 0',
            }}
          >
            😿 Game Over
          </h2>
          <p
            style={{
              fontSize: isMobile ? '16px' : '24px',
              color: '#667eea',
              fontWeight: 'bold',
              margin: '10px 0',
            }}
          >
            Puntos: {score}
          </p>
          <p
            style={{
              fontSize: isMobile ? '14px' : '18px',
              color: '#888',
              margin: '5px 0',
            }}
          >
            Récord: {highScore}
          </p>
          {score >= 150 && (
            <p
              style={{
                fontSize: isMobile ? '12px' : '16px',
                color: '#ff6b6b',
                fontWeight: 'bold',
                margin: '10px 0',
              }}
            >
              ¡Lograste el modo nocturno! 🌙
            </p>
          )}
          
          <button
            onClick={restartGame}
            style={{
              marginTop: '20px',
              padding: isMobile ? '10px 25px' : '12px 30px',
              fontSize: isMobile ? '14px' : '18px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              width: '100%',
              maxWidth: isMobile ? '200px' : '250px',
            }}
          >
            🎮 Jugar de Nuevo
          </button>
        </div>
      )}
      
      <footer
        style={{
          marginTop: isMobile ? '10px' : '20px',
          color: 'white',
          textAlign: 'center',
          fontSize: isMobile ? '10px' : '14px',
          opacity: 0.8,
          padding: '10px',
          width: '100%',
        }}
      >
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
        <p style={{ margin: '5px 0', fontSize: isMobile ? '9px' : '13px' }}>
          {isMobile 
            ? 'Doble toque para saltar • Desliza para mover' 
            : '¡Agarra la comida antes de que desaparezca! 🐟🥛'}
        </p>
      </footer>
    </div>
  );
};

export default Game;